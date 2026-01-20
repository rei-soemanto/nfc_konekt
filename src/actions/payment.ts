'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { snap } from '@/lib/midtrans'
import { randomUUID, randomBytes } from 'crypto'
import { PlanDuration } from '@prisma/client'
import { DURATION_CONFIG } from '@/lib/plans'
import bcrypt from 'bcryptjs'

// Helper: Slug Generator
function generateSlug(name: string) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const suffix = randomBytes(3).toString('hex');
    return `${base}-${suffix}`;
}

async function hashPassword(plain: string) {
    return await bcrypt.hash(plain, 10);
}

// Helper: Check Active Shipment
async function checkActiveShipment(userId: string) {
    const activeShipment = await prisma.transaction.findFirst({
        where: {
            userId,
            status: 'PAID',
            shipmentStatus: { in: ['PROCESSING', 'SHIPPING'] }
        }
    });

    if (activeShipment) {
        throw new Error("You have a shipment in progress. Please wait for it to arrive before placing a new order.");
    }
}

export async function createTransaction(planId: string, expansionPacks: number = 0, addressSnapshot: any = null) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    // 1. CHECK ACTIVE SHIPMENT
    await checkActiveShipment(userId);

    // FIX: Removed 'include' because tempSetupData/tempDesignData are scalar fields.
    // They are returned automatically by findUnique.
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const plan = await prisma.plan.findUnique({ where: { id: planId } });

    if (!user || !plan) throw new Error("Invalid data");

    const durationInfo = DURATION_CONFIG[plan.duration as PlanDuration];
    const monthMultiplier = durationInfo?.months || 1;
    const expansionMonthlyPrice = plan.expansionPrice;
    const expansionTotalCost = expansionMonthlyPrice * monthMultiplier * expansionPacks;
    const totalPrice = plan.price + expansionTotalCost;

    const addressString = addressSnapshot ? JSON.stringify(addressSnapshot) : null;
    const pendingTeamData = user.tempSetupData || null; 
    const cardDesign = user.tempDesignData || null;
    const orderId = `SUB-${randomUUID()}`;

    // --- CASE 1: FREE TRANSACTION ---
    if (totalPrice === 0) {
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + (durationInfo?.days || 30));

        await prisma.transaction.create({
            data: {
                userId,
                planId: plan.id,
                type: 'NEW',
                status: 'PAID',
                amount: 0,
                paymentId: `FREE-${randomUUID()}`,
                shippingAddress: addressString,
                shipmentStatus: addressString ? 'PROCESSING' : 'ARRIVED',
                expansionPacks,
                pendingTeamData,
                cardDesign
            }
        });

        await prisma.subscription.upsert({
            where: { userId: userId },
            update: {
                planId: plan.id,
                expansionPacks: expansionPacks,
                status: 'ACTIVE',
                startDate: now,
                endDate: endDate,
                shippingAddress: addressString,
                shipmentStatus: addressString ? 'PROCESSING' : undefined,
            },
            create: {
                userId: userId,
                planId: plan.id,
                expansionPacks: expansionPacks,
                status: 'ACTIVE',
                paymentId: `FREE-${randomUUID()}`,
                startDate: now,
                endDate: endDate,
                shippingAddress: addressString,
                shipmentStatus: addressString ? 'PROCESSING' : 'ARRIVED',
            }
        });

        if (pendingTeamData) {
            const teamMembers = JSON.parse(pendingTeamData);
            for (const member of teamMembers) {
                const existing = await prisma.user.findUnique({ where: { email: member.email }});
                if (!existing) {
                    const newUser = await prisma.user.create({
                        data: {
                            fullName: member.fullName,
                            email: member.email,
                            password: await hashPassword("Member123!"),
                            role: 'USER',
                            accountStatus: 'ACTIVE',
                            parentId: userId
                        }
                    });
                    await prisma.card.create({
                        data: { slug: generateSlug(newUser.fullName), status: 'ACTIVE', userId: newUser.id }
                    });
                }
            }
        }
        
        await prisma.user.update({ 
            where: { id: userId }, 
            data: { tempSetupData: null, tempDesignData: null } 
        });

        return { status: 'free_activated', token: null };
    }

    // --- CASE 2: MIDTRANS TRANSACTION ---
    const items = [{ id: plan.id, price: plan.price, quantity: 1, name: plan.name }];
    if (expansionPacks > 0) {
        items.push({
            id: `${plan.id}-EXP`,
            price: expansionMonthlyPrice * monthMultiplier, 
            quantity: expansionPacks,
            name: `Expansion (+10 Users) - ${durationInfo.label}`
        });
    }

    const parameters = {
        transaction_details: { order_id: orderId, gross_amount: totalPrice },
        customer_details: { first_name: user.fullName, email: user.email },
        item_details: items
    };

    const transaction = await snap.createTransaction(parameters);

    await prisma.transaction.create({
        data: {
            userId,
            planId: plan.id,
            type: 'NEW',
            status: 'PENDING',
            amount: totalPrice,
            paymentId: orderId,
            snapToken: transaction.token,
            shippingAddress: addressString,
            shipmentStatus: 'PENDING',
            expansionPacks,
            pendingTeamData,
            cardDesign
        }
    });

    await prisma.subscription.upsert({
        where: { userId: userId },
        update: {
            planId: plan.id,
            expansionPacks: expansionPacks,
            paymentId: orderId,
            snapToken: transaction.token,
            shippingAddress: addressString,
            shipmentStatus: 'PENDING', 
        },
        create: {
            userId: userId,
            planId: plan.id,
            expansionPacks: expansionPacks,
            paymentId: orderId,
            snapToken: transaction.token,
            status: 'EXPIRED',
            endDate: new Date(),
            shippingAddress: addressString,
            shipmentStatus: 'PENDING'
        }
    });

    if (pendingTeamData || cardDesign) {
        await prisma.user.update({ 
            where: { id: userId }, 
            data: { tempSetupData: null, tempDesignData: null } 
        });
    }

    return { status: 'pending', token: transaction.token };
}

export async function createExpansionTransaction(planId: string, packsToAdd: number, addressSnapshot: any = null) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    await checkActiveShipment(userId);

    // FIX: Only include 'subscription' relation. 
    // tempSetupData and tempDesignData are returned automatically.
    const user = await prisma.user.findUnique({ 
        where: { id: userId }, 
        include: { subscription: true } 
    });
    const plan = await prisma.plan.findUnique({ where: { id: planId } });

    if (!user || !plan || !user.subscription) throw new Error("Invalid data");

    const durationInfo = DURATION_CONFIG[plan.duration as PlanDuration];
    const monthMultiplier = durationInfo?.months || 1;
    const totalCost = (plan.expansionPrice * monthMultiplier) * packsToAdd;
    
    const addressString = addressSnapshot ? JSON.stringify(addressSnapshot) : null;
    const pendingTeamData = user.tempSetupData || null; 
    const cardDesign = user.tempDesignData || null;
    const orderId = `EXP-${randomUUID()}`;

    const parameters = {
        transaction_details: { order_id: orderId, gross_amount: totalCost },
        customer_details: { first_name: user.fullName, email: user.email },
        item_details: [{
            id: `${plan.id}-EXP-ADD`,
            price: totalCost,
            quantity: 1, 
            name: `+${packsToAdd} Expansion Packs (${durationInfo.label})`
        }]
    };

    const transaction = await snap.createTransaction(parameters);
    
    await prisma.transaction.create({
        data: {
            userId,
            planId: plan.id,
            type: 'EXPANSION',
            status: 'PENDING',
            amount: totalCost,
            paymentId: orderId,
            snapToken: transaction.token,
            shippingAddress: addressString,
            shipmentStatus: 'PENDING',
            expansionPacks: packsToAdd,
            pendingTeamData,
            cardDesign
        }
    });

    await prisma.subscription.update({
        where: { userId: userId },
        data: {
            paymentId: orderId,
            snapToken: transaction.token,
            shippingAddress: addressString, 
            shipmentStatus: 'PENDING' 
        }
    });

    if (pendingTeamData || cardDesign) {
        await prisma.user.update({ 
            where: { id: userId }, 
            data: { tempSetupData: null, tempDesignData: null } 
        });
    }

    return { token: transaction.token };
}