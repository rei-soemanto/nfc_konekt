'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { snap } from '@/lib/midtrans'
import { randomUUID, randomBytes } from 'crypto'
import { PlanDuration } from '@prisma/client'
import { DURATION_CONFIG } from '@/lib/plans'
import { PromoService } from '@/services/PromoService'
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

// Helper: Check Active Shipment (Returns string if error, null if ok)
async function checkActiveShipment(userId: string) {
    const activeShipment = await prisma.transaction.findFirst({
        where: {
            userId,
            status: 'PAID',
            shipmentStatus: { in: ['PROCESSING', 'SHIPPING'] }
        }
    });

    if (activeShipment) {
        return "You have a shipment in progress. Please wait for it to arrive before placing a new order.";
    }
    return null;
}

export async function createTransaction(planId: string, expansionPacks: number = 0, addressSnapshot: any = null, promoCode?: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { error: "Unauthorized" };

        const shipmentError = await checkActiveShipment(userId);
        if (shipmentError) return { error: shipmentError };

        const user = await prisma.user.findUnique({ where: { id: userId } });
        const plan = await prisma.plan.findUnique({ where: { id: planId } });

        if (!user || !plan) return { error: "Invalid data" };

        const durationInfo = DURATION_CONFIG[plan.duration as PlanDuration];
        const monthMultiplier = durationInfo?.months || 1;
        const expansionMonthlyPrice = plan.expansionPrice;
        const expansionTotalCost = expansionMonthlyPrice * monthMultiplier * expansionPacks;
        let totalPrice = plan.price + expansionTotalCost;

        let discountAmount = 0;
        let appliedPromoId = null;

        if (promoCode) {
            const promoResult = await PromoService.validate(promoCode, plan.category, totalPrice);
            if (promoResult.valid) {
                discountAmount = promoResult.discount || 0;
                appliedPromoId = promoResult.promoId;
                totalPrice = Math.max(0, totalPrice - discountAmount);
            }
        }

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
                    cardDesign,
                    promoCodeId: appliedPromoId,
                    discountApplied: discountAmount
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

        // --- CASE 2: MIDTRANS ---
        const items = [{ id: plan.id, price: plan.price, quantity: 1, name: plan.name }];
        if (expansionPacks > 0) {
            items.push({
                id: `${plan.id}-EXP`,
                price: expansionMonthlyPrice * monthMultiplier, 
                quantity: expansionPacks,
                name: `Expansion (+10 Users) - ${durationInfo.label}`
            });
        }
        if (discountAmount > 0) {
            items.push({
                id: 'DISCOUNT',
                price: -discountAmount,
                quantity: 1,
                name: `Promo Code: ${promoCode}`
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
                cardDesign,
                promoCodeId: appliedPromoId,
                discountApplied: discountAmount
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

    } catch (error: any) {
        console.error("Payment Error:", error);
        return { error: error.message || "Something went wrong" };
    }
}

export async function createExpansionTransaction(planId: string, packsToAdd: number, addressSnapshot: any = null, promoCode?: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { error: "Unauthorized" };

        const shipmentError = await checkActiveShipment(userId);
        if (shipmentError) return { error: shipmentError };

        const user = await prisma.user.findUnique({ 
            where: { id: userId }, 
            include: { subscription: true } 
        });
        const plan = await prisma.plan.findUnique({ where: { id: planId } });

        if (!user || !plan || !user.subscription) return { error: "Invalid data" };

        const durationInfo = DURATION_CONFIG[plan.duration as PlanDuration];
        const monthMultiplier = durationInfo?.months || 1;
        let totalCost = (plan.expansionPrice * monthMultiplier) * packsToAdd;
        
        let discountAmount = 0;
        let appliedPromoId = null;

        if (promoCode) {
            const promoResult = await PromoService.validate(promoCode, 'EXPANSION', totalCost);
            if (promoResult.valid) {
                discountAmount = promoResult.discount || 0;
                appliedPromoId = promoResult.promoId;
                totalCost = Math.max(0, totalCost - discountAmount);
            }
        }

        const addressString = addressSnapshot ? JSON.stringify(addressSnapshot) : null;
        const pendingTeamData = user.tempSetupData || null; 
        const cardDesign = user.tempDesignData || null;
        const orderId = `EXP-${randomUUID()}`;

        // FIX 1: Handle Free Expansion (100% Promo)
        if (totalCost === 0) {
            await prisma.transaction.create({
                data: {
                    userId,
                    planId: plan.id,
                    type: 'EXPANSION',
                    status: 'PAID',
                    amount: 0,
                    paymentId: `FREE-${randomUUID()}`,
                    shippingAddress: addressString,
                    shipmentStatus: addressString ? 'PROCESSING' : 'ARRIVED',
                    expansionPacks: packsToAdd,
                    promoCodeId: appliedPromoId,
                    discountApplied: discountAmount
                }
            });

            // Immediately apply benefits since it's free
            await prisma.subscription.update({
                where: { userId: userId },
                data: {
                    expansionPacks: { increment: packsToAdd },
                    paymentId: `FREE-${randomUUID()}`,
                    shippingAddress: addressString,
                    shipmentStatus: addressString ? 'PROCESSING' : undefined
                }
            });

            if (pendingTeamData || cardDesign) {
                await prisma.user.update({ 
                    where: { id: userId }, 
                    data: { tempSetupData: null, tempDesignData: null } 
                });
            }

            return { status: 'free_activated', token: null };
        }

        // --- Normal Paid Expansion Flow ---
        const items = [{
            id: `${plan.id}-EXP-ADD`,
            price: (plan.expansionPrice * monthMultiplier) * packsToAdd, 
            quantity: 1, 
            name: `+${packsToAdd} Expansion Packs`
        }];
        
        if (discountAmount > 0) {
            items.push({ id: 'DISCOUNT', price: -discountAmount, quantity: 1, name: `Promo: ${promoCode}` });
        }

        const parameters = {
            transaction_details: { order_id: orderId, gross_amount: totalCost },
            customer_details: { first_name: user.fullName, email: user.email },
            item_details: items
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
                promoCodeId: appliedPromoId,
                discountApplied: discountAmount
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

        // FIX 2: Return status so frontend doesn't crash
        return { status: 'pending', token: transaction.token };

    } catch (error: any) {
        console.error("Expansion Payment Error:", error);
        return { error: error.message || "Something went wrong" };
    }
}