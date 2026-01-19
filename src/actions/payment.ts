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

export async function createTransaction(planId: string, expansionPacks: number = 0, addressSnapshot: any = null) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

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
    const orderId = `SUB-${randomUUID()}`;

    // --- CASE 1: FREE TRANSACTION ---
    if (totalPrice === 0) {
        // ... (Keep existing Free Logic, but create a PAID Transaction record too for history)
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + (durationInfo?.days || 30));

        // Create Transaction Record
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
                pendingTeamData
            }
        });

        // Update Subscription
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
                paymentId: `FREE-${randomUUID()}`, // Optional legacy field
                startDate: now,
                endDate: endDate,
                shippingAddress: addressString,
                shipmentStatus: addressString ? 'PROCESSING' : 'ARRIVED',
            }
        });

        // Immediate Team Creation
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
            await prisma.user.update({ where: { id: userId }, data: { tempSetupData: null } });
        }

        return { status: 'free_activated', token: null };
    }

    // --- CASE 2: MIDTRANS TRANSACTION ---
    
    // 1. Create Midtrans Params
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
    
    // 2. CREATE TRANSACTION RECORD (The Log)
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
            pendingTeamData
        }
    });

    // 3. UPSERT SUBSCRIPTION (The Current State)
    // We set status to EXPIRED/Pending until paid. 
    // We LINK this subscription to the transaction via paymentId if needed, 
    // or just let the webhook sync them.
    await prisma.subscription.upsert({
        where: { userId: userId },
        update: {
            planId: plan.id,
            expansionPacks: expansionPacks,
            paymentId: orderId, // Points to latest pending
            snapToken: transaction.token,
            shippingAddress: addressString,
            shipmentStatus: 'PENDING', // Wait for payment to become PROCESSING
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

    // Clear temp data
    if (pendingTeamData) {
        await prisma.user.update({ where: { id: userId }, data: { tempSetupData: null } });
    }

    return { status: 'pending', token: transaction.token };
}

export async function createExpansionTransaction(planId: string, packsToAdd: number, addressSnapshot: any = null) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } });
    const plan = await prisma.plan.findUnique({ where: { id: planId } });

    if (!user || !plan || !user.subscription) throw new Error("Invalid data");

    const durationInfo = DURATION_CONFIG[plan.duration as PlanDuration];
    const monthMultiplier = durationInfo?.months || 1;
    const totalCost = (plan.expansionPrice * monthMultiplier) * packsToAdd;
    
    const addressString = addressSnapshot ? JSON.stringify(addressSnapshot) : null;
    const pendingTeamData = user.tempSetupData || null; 
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
    
    // 1. Create Transaction Log
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
            expansionPacks: packsToAdd, // Only the added ones
            pendingTeamData
        }
    });

    // 2. Update Subscription (Latest Reference)
    await prisma.subscription.update({
        where: { userId: userId },
        data: {
            paymentId: orderId,
            snapToken: transaction.token,
            // We do NOT update expansionPacks count yet (wait for success)
            // But we do update shipment info so user sees "Processing" after payment
            shippingAddress: addressString, 
            shipmentStatus: 'PENDING' 
        }
    });

    if (pendingTeamData) {
        await prisma.user.update({ where: { id: userId }, data: { tempSetupData: null } });
    }

    return { token: transaction.token };
}