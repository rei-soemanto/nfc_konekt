'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { snap } from '@/lib/midtrans'
import { randomBytes, randomUUID } from 'crypto'
import { PlanDuration } from '@prisma/client'
import { DURATION_CONFIG } from '@/lib/plans'
import { PromoService } from '@/services/PromoService'
import bcrypt from 'bcryptjs'

// --- HELPER FUNCTIONS ---

function generateSlug(name: string) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const suffix = randomBytes(3).toString('hex');
    return `${base}-${suffix}`;
}

async function hashPassword(plain: string) {
    return await bcrypt.hash(plain, 10);
}

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

// --- HELPER: Create Pending Users ---
// This creates the actual User accounts and Cards based on the JSON data
async function createPendingUsers(userId: string, pendingTeamData: string | null) {
    if (!pendingTeamData) return;
    try {
        const teamMembers = JSON.parse(pendingTeamData);
        for (const member of teamMembers) {
            // Check by email to prevent duplicates
            const existing = await prisma.user.findUnique({ where: { email: member.email }});
            if (!existing) {
                const newUser = await prisma.user.create({
                    data: {
                        fullName: member.fullName,
                        email: member.email,
                        password: await hashPassword("Member123!"), // Default password
                        role: 'USER',
                        accountStatus: 'ACTIVE',
                        parentId: userId, // Link to Team Leader
                        jobTitle: member.jobTitle || undefined,
                        // If you store extra fields like 'note' from the CSV, add them here if Schema allows
                    }
                });
                
                // Create the Digital Card for the new member
                await prisma.card.create({ 
                    data: { 
                        slug: generateSlug(newUser.fullName), 
                        status: 'ACTIVE', 
                        userId: newUser.id 
                    } 
                });
            }
        }
        
        // Clear temp data after processing
        await prisma.user.update({ 
            where: { id: userId }, 
            data: { tempSetupData: null, tempDesignData: null } 
        });
        
    } catch (e) {
        console.error("Error creating team members:", e);
    }
}

// ==========================================
// 1. CREATE NEW SUBSCRIPTION (New / Upgrade)
// ==========================================
export async function createTransaction(planId: string, expansionPacks: number = 0, addressSnapshot: any = null, promoCode?: string) {
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

        if (!user || !plan) return { error: "Invalid data" };

        const durationInfo = DURATION_CONFIG[plan.duration as PlanDuration];
        const monthMultiplier = durationInfo?.months || 1;
        
        // Dates
        const now = new Date();
        const startDate = now;
        const endDate = new Date(now);
        endDate.setDate(now.getDate() + (durationInfo?.days || 30));

        // Status
        const shipmentStatusFree = addressSnapshot ? 'PROCESSING' : 'ARRIVED';
        const shipmentStatusPaid = 'PENDING'; 

        // Cost
        const expansionTotalCost = plan.expansionPrice * monthMultiplier * expansionPacks;
        let totalPrice = plan.price + expansionTotalCost;

        // Promo
        let discountAmount = 0;
        let appliedPromoId = null;
        if (promoCode) {
            const promo = await PromoService.calculateDiscount(promoCode, {
                planId: plan.id, planCategory: plan.category, basePrice: plan.price, expansionPrice: expansionTotalCost
            });
            if (promo.valid) {
                discountAmount = promo.discount || 0;
                appliedPromoId = promo.promoId;
                totalPrice = Math.max(0, totalPrice - discountAmount);
            }
        }

        const addressString = addressSnapshot ? JSON.stringify(addressSnapshot) : null;
        const pendingTeamData = user.tempSetupData || null; 
        const cardDesign = user.tempDesignData || null;
        const orderId = `SUB-${randomUUID()}`;

        // --- FREE ---
        if (totalPrice === 0) {
            await prisma.transaction.create({
                data: {
                    userId, planId: plan.id, type: 'NEW', status: 'PAID', amount: 0, paymentId: `FREE-${randomUUID()}`,
                    shippingAddress: addressString, shipmentStatus: shipmentStatusFree, expansionPacks,
                    pendingTeamData, cardDesign, promoCodeId: appliedPromoId, discountApplied: discountAmount
                }
            });
            await prisma.subscription.upsert({
                where: { userId },
                update: { planId: plan.id, expansionPacks, status: 'ACTIVE', startDate, endDate, shippingAddress: addressString, shipmentStatus: shipmentStatusFree },
                create: { userId, planId: plan.id, expansionPacks, status: 'ACTIVE', paymentId: `FREE-${randomUUID()}`, startDate, endDate, shippingAddress: addressString, shipmentStatus: shipmentStatusFree }
            });
            // ✅ Create users immediately for free plans
            await createPendingUsers(userId, pendingTeamData);
            return { status: 'free_activated', token: null };
        }

        // --- PAID ---
        const items = [{ id: plan.id, price: plan.price, quantity: 1, name: `Plan: ${plan.name}` }];
        if (expansionPacks > 0) items.push({ id: `${plan.id}-EXP`, price: plan.expansionPrice * monthMultiplier, quantity: expansionPacks, name: `Expansion (+${expansionPacks * 10} Users)` });
        if (discountAmount > 0) items.push({ id: 'DISCOUNT', price: -discountAmount, quantity: 1, name: `Promo Code` });

        const transaction = await snap.createTransaction({
            transaction_details: { order_id: orderId, gross_amount: totalPrice },
            customer_details: { first_name: user.fullName, email: user.email },
            item_details: items
        });

        await prisma.transaction.create({
            data: {
                userId, planId: plan.id, type: 'NEW', status: 'PENDING', amount: totalPrice, paymentId: orderId, snapToken: transaction.token,
                shippingAddress: addressString, shipmentStatus: shipmentStatusPaid, expansionPacks, 
                pendingTeamData, cardDesign, // ✅ Stored for Webhook to use later
                promoCodeId: appliedPromoId, discountApplied: discountAmount
            }
        });

        await prisma.subscription.upsert({
            where: { userId },
            update: { planId: plan.id, expansionPacks, paymentId: orderId, snapToken: transaction.token, shippingAddress: addressString, startDate, endDate, shipmentStatus: 'PENDING' },
            create: { userId, planId: plan.id, expansionPacks, paymentId: orderId, snapToken: transaction.token, status: 'EXPIRED', startDate, endDate, shippingAddress: addressString, shipmentStatus: 'PENDING' }
        });

        // Don't create users yet, wait for payment webhook
        return { status: 'pending', token: transaction.token };

    } catch (error: any) {
        console.error("New Plan Error:", error);
        return { error: error.message || "Error creating transaction" };
    }
}

// ==========================================
// 2. RENEW SUBSCRIPTION (Extend Time)
// ==========================================
export async function renewSubscription(planId: string, promoCode?: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { error: "Unauthorized" };

        const user = await prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } });
        const plan = await prisma.plan.findUnique({ where: { id: planId } });

        if (!user || !plan || !user.subscription) return { error: "Invalid renewal data" };
        if (user.subscription.planId !== plan.id) return { error: "Plan mismatch. Please use 'Change Plan' instead." };

        const currentSub = user.subscription;
        const durationInfo = DURATION_CONFIG[plan.duration as PlanDuration];
        const monthMultiplier = durationInfo?.months || 1;

        // Time Stacking
        const now = new Date();
        let startDate = now;
        let endDate = new Date(now);

        if (currentSub.endDate > now) {
            startDate = currentSub.endDate;
            endDate = new Date(currentSub.endDate);
            endDate.setDate(endDate.getDate() + (durationInfo?.days || 30));
        } else {
            endDate.setDate(now.getDate() + (durationInfo?.days || 30));
        }

        const finalExpansionPacks = currentSub.expansionPacks;
        const expansionTotalCost = plan.expansionPrice * monthMultiplier * finalExpansionPacks;
        let totalPrice = plan.price + expansionTotalCost;

        let discountAmount = 0;
        let appliedPromoId = null;
        if (promoCode) {
            const promo = await PromoService.calculateDiscount(promoCode, {
                planId: plan.id, planCategory: plan.category, basePrice: plan.price, expansionPrice: expansionTotalCost
            });
            if (promo.valid) {
                discountAmount = promo.discount || 0;
                appliedPromoId = promo.promoId;
                totalPrice = Math.max(0, totalPrice - discountAmount);
            }
        }

        const orderId = `REN-${randomUUID()}`;

        // --- FREE RENEWAL ---
        if (totalPrice === 0) {
            await prisma.transaction.create({
                data: {
                    userId, planId: plan.id, type: 'RENEW', status: 'PAID', amount: 0, paymentId: `FREE-${randomUUID()}`,
                    shipmentStatus: 'ARRIVED', expansionPacks: finalExpansionPacks, promoCodeId: appliedPromoId, discountApplied: discountAmount
                }
            });
            await prisma.subscription.update({
                where: { userId },
                data: { status: 'ACTIVE', startDate, endDate, shipmentStatus: undefined } 
            });
            return { status: 'free_activated', token: null };
        }

        // --- PAID RENEWAL ---
        const items = [{ id: plan.id, price: plan.price, quantity: 1, name: `Renewal: ${plan.name}` }];
        if (finalExpansionPacks > 0) items.push({ id: `${plan.id}-EXP`, price: plan.expansionPrice * monthMultiplier, quantity: finalExpansionPacks, name: `Expansion (+${finalExpansionPacks * 10} Users)` });
        if (discountAmount > 0) items.push({ id: 'DISCOUNT', price: -discountAmount, quantity: 1, name: `Promo Code` });

        const transaction = await snap.createTransaction({
            transaction_details: { order_id: orderId, gross_amount: totalPrice },
            customer_details: { first_name: user.fullName, email: user.email },
            item_details: items
        });

        await prisma.transaction.create({
            data: {
                userId, planId: plan.id, type: 'RENEW', status: 'PENDING', amount: totalPrice, paymentId: orderId,
                snapToken: transaction.token, shipmentStatus: 'ARRIVED', expansionPacks: finalExpansionPacks,
                promoCodeId: appliedPromoId, discountApplied: discountAmount
            }
        });

        await prisma.subscription.update({
            where: { userId },
            data: { paymentId: orderId, snapToken: transaction.token, startDate, endDate }
        });

        return { status: 'pending', token: transaction.token };

    } catch (error: any) {
        console.error("Renew Error:", error);
        return { error: error.message || "Renewal failed" };
    }
}

// ==========================================
// 3. EXPANSION ONLY (Add Packs)
// ==========================================
export async function createExpansionTransaction(planId: string, packsToAdd: number, addressSnapshot: any = null, promoCode?: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { error: "Unauthorized" };

        const shipmentError = await checkActiveShipment(userId);
        if (shipmentError) return { error: shipmentError };

        const user = await prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } });
        const plan = await prisma.plan.findUnique({ where: { id: planId } });

        if (!user || !plan || !user.subscription) return { error: "Invalid data" };

        const now = new Date();
        const endDate = new Date(user.subscription.endDate);
        const diffTime = Math.max(0, endDate.getTime() - now.getTime());
        const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (remainingDays <= 0) return { error: "Subscription expired. Please renew first." };

        const pricePerDay = plan.expansionPrice / 30;
        const costPerPack = Math.ceil(pricePerDay * remainingDays);
        let totalCost = costPerPack * packsToAdd;

        // Promo
        let discountAmount = 0;
        let appliedPromoId = null;
        if (promoCode) {
            const promo = await PromoService.calculateDiscount(promoCode, {
                planId: plan.id, planCategory: plan.category, basePrice: 0, expansionPrice: totalCost
            });
            if (promo.valid) {
                discountAmount = promo.discount || 0;
                appliedPromoId = promo.promoId;
                totalCost = Math.max(0, totalCost - discountAmount);
            }
        }

        const addressString = addressSnapshot ? JSON.stringify(addressSnapshot) : null;
        const orderId = `EXP-${randomUUID()}`;
        
        // ✅ EXTRACT DATA for Storage
        // We must fetch these from the user now so they are saved in the transaction history
        const pendingTeamData = user.tempSetupData || null;
        const cardDesign = user.tempDesignData || null;

        const shipmentStatusFree = 'PROCESSING';
        const shipmentStatusPaid = 'PENDING';

        // --- FREE EXPANSION ---
        if (totalCost === 0) {
            await prisma.transaction.create({
                data: {
                    userId, planId: plan.id, type: 'EXPANSION', status: 'PAID', amount: 0, paymentId: `FREE-${randomUUID()}`,
                    shippingAddress: addressString, shipmentStatus: shipmentStatusFree, expansionPacks: packsToAdd,
                    promoCodeId: appliedPromoId, discountApplied: discountAmount,
                    // ✅ SAVE DATA
                    pendingTeamData,
                    cardDesign
                }
            });
            await prisma.subscription.update({
                where: { userId },
                data: { expansionPacks: { increment: packsToAdd }, shipmentStatus: shipmentStatusFree }
            });
            
            // ✅ CREATE USERS IMMEDIATELY
            await createPendingUsers(userId, pendingTeamData);
            
            return { status: 'free_activated', token: null };
        }

        // --- PAID EXPANSION ---
        const items = [{ id: `${plan.id}-EXP-ADD`, price: costPerPack * packsToAdd, quantity: 1, name: `+${packsToAdd} Packs (${remainingDays} Days)` }];
        if (discountAmount > 0) items.push({ id: 'DISCOUNT', price: -discountAmount, quantity: 1, name: `Promo Code` });

        const transaction = await snap.createTransaction({
            transaction_details: { order_id: orderId, gross_amount: totalCost },
            customer_details: { first_name: user.fullName, email: user.email },
            item_details: items
        });

        await prisma.transaction.create({
            data: {
                userId, planId: plan.id, type: 'EXPANSION', status: 'PENDING', amount: totalCost, paymentId: orderId,
                snapToken: transaction.token, shippingAddress: addressString, shipmentStatus: shipmentStatusPaid,
                expansionPacks: packsToAdd, promoCodeId: appliedPromoId, discountApplied: discountAmount,
                // ✅ SAVE DATA (So webhook can use it later)
                pendingTeamData,
                cardDesign
            }
        });

        await prisma.subscription.update({
            where: { userId },
            data: { paymentId: orderId, snapToken: transaction.token, shippingAddress: addressString, shipmentStatus: shipmentStatusPaid }
        });

        // Don't create users yet, wait for payment webhook
        return { status: 'pending', token: transaction.token };

    } catch (error: any) {
        console.error("Expansion Error:", error);
        return { error: error.message || "Error processing expansion" };
    }
}