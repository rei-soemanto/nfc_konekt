import { prisma } from '@/lib/prisma'
import { snap } from '@/lib/midtrans' // Uses your uploaded midtrans.ts
import { PLAN_CONFIG, DURATION_CONFIG, getPlanName } from '@/lib/plans' // Uses your uploaded plans.ts
import { PlanDuration } from '@prisma/client'

export class SubscriptionService {
    /**
     * 1. GET STATUS
     * Used by Mobile App to show current plan, shipment status, and billing info
     */
    static async getStatus(userId: string) {
        const sub = await prisma.subscription.findUnique({
            where: { userId },
            include: { plan: true }
        });

        if (!sub) return { status: 'FREE', planName: 'Free Plan' };

        const now = new Date();
        const start = new Date(sub.startDate);
        const end = new Date(sub.endDate);

        // Check if expired
        const isExpired = now > end;
        const resolvedStatus = isExpired ? 'EXPIRED' : sub.status;

        // Duration info for billing calculations
        const durationInfo = DURATION_CONFIG[sub.plan.duration as PlanDuration] || { label: 'Unknown', months: 1 };

        // Calculate progress percentage
        const totalDuration = end.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();
        let progressPercentage = 0;
        if (totalDuration > 0) {
            progressPercentage = (elapsed / totalDuration) * 100;
        }
        progressPercentage = Math.min(Math.max(progressPercentage, 0), 100);

        // Calculate next bill amount (plan price + expansion packs cost)
        const expansionCostPerCycle = sub.plan.expansionPrice * durationInfo.months;
        const nextBillAmount = sub.plan.price + (expansionCostPerCycle * sub.expansionPacks);

        // Query active shipment from Transaction table (excludes renewals)
        const activeShipment = await prisma.transaction.findFirst({
            where: {
                userId: userId,
                status: 'PAID',
                shipmentStatus: { in: ['PROCESSING', 'SHIPPING'] },
                type: { not: 'RENEW' }
            },
            orderBy: { createdAt: 'desc' }
        });

        return {
            // Core status
            status: resolvedStatus,
            planId: sub.plan.id,
            planName: sub.plan.name,
            planPrice: sub.plan.price,
            planDurationLabel: durationInfo.label,
            expansionPacks: sub.expansionPacks,
            expansionPrice: expansionCostPerCycle,
            currency: 'IDR',

            // Dates
            startDate: sub.startDate,
            endDate: sub.endDate,
            daysLeft: Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
            progressPercentage,

            // Billing
            nextBillAmount,
            nextBillDate: sub.endDate,

            // Shipment tracking (from latest active transaction)
            shipment: activeShipment ? {
                transactionId: activeShipment.id,
                status: activeShipment.shipmentStatus,
                trackingLink: activeShipment.trackingLink,
            } : null,
        };
    }

    /**
     * 2. GET TRANSACTION HISTORY
     * Returns all paid transactions for a user, formatted for the frontend
     */
    static async getTransactionHistory(userId: string) {
        const transactions = await prisma.transaction.findMany({
            where: {
                userId: userId,
                status: 'PAID'
            },
            orderBy: { createdAt: 'desc' },
            include: { plan: true }
        });

        return transactions.map(tx => ({
            id: tx.id,
            type: tx.type,                     // 'NEW', 'EXPANSION', 'RENEW'
            status: tx.status,                  // 'PAID'
            amount: tx.amount,
            currency: 'IDR',
            paymentId: tx.paymentId,
            shipmentStatus: tx.type === 'RENEW' ? null : tx.shipmentStatus,
            trackingLink: tx.trackingLink,
            expansionPacks: tx.expansionPacks,
            planName: tx.plan?.name || null,
            discountApplied: tx.discountApplied,
            createdAt: tx.createdAt,
        }));
    }

    /**
     * 3. INITIATE PURCHASE (Checkout)
     * Handles: Plan Selection, Addressing, Card Design, Team Setup
     */
    static async initiatePurchase(userId: string, data: any) {
        const { 
            planCategory, // 'PERSONAL' or 'CORPORATE'
            duration,     // 'MONTHLY', 'YEARLY'
            cardDesignId, // 'matte-black'
            shippingAddress, 
            teamMembers,  // Array of emails (for Corporate)
            expansionPacks = 0
        } = data;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        // A. Fetch Plan Price from DB or Config
        // Note: You should have these Plans seeded in your DB. 
        // For safety, we look up by the unique composite key [category, duration]
        const plan = await prisma.plan.findUnique({
            where: { 
                category_duration: { 
                    category: planCategory, 
                    duration: duration 
                } 
            }
        });

        if (!plan) throw new Error("Invalid Plan Selection");

        // B. Calculate Total Price
        let total = plan.price;
        if (expansionPacks > 0) {
            total += (expansionPacks * plan.expansionPrice);
        }

        // C. Create Transaction Record (Pending)
        const orderId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const transaction = await prisma.transaction.create({
            data: {
                userId,
                planId: plan.id,
                paymentId: orderId,
                amount: total,
                status: 'PENDING',
                type: 'NEW_SUBSCRIPTION',
                
                // Store Metadata for Webhook processing later
                cardDesign: cardDesignId,
                shippingAddress: JSON.stringify(shippingAddress),
                pendingTeamData: teamMembers ? JSON.stringify(teamMembers) : null,
                expansionPacks: expansionPacks
            }
        });

        // D. Request Snap Token from Midtrans
        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: total
            },
            customer_details: {
                first_name: user.fullName,
                email: user.email,
            },
            item_details: [{
                id: plan.id,
                price: total,
                quantity: 1,
                name: getPlanName(planCategory, duration)
            }]
        };

        const midtransResponse = await snap.createTransaction(parameter);

        // Save Token to Transaction for reference
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { snapToken: midtransResponse.token }
        });

        return {
            snapToken: midtransResponse.token,
            redirectUrl: midtransResponse.redirect_url,
            orderId: orderId
        };
    }
}