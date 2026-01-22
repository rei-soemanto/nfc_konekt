import { prisma } from '@/lib/prisma'
import { snap } from '@/lib/midtrans' // Uses your uploaded midtrans.ts
import { PLAN_CONFIG, DURATION_CONFIG, getPlanName } from '@/lib/plans' // Uses your uploaded plans.ts

export class SubscriptionService {
    /**
     * 1. GET STATUS
     * Used by Mobile App to show "Current Plan: Corporate"
     */
    static async getStatus(userId: string) {
        const sub = await prisma.subscription.findUnique({
            where: { userId },
            include: { plan: true }
        });

        if (!sub) return { status: 'FREE', planName: 'Free Plan' };

        // Check if expired
        const isExpired = new Date() > new Date(sub.endDate);
        
        return {
            status: isExpired ? 'EXPIRED' : sub.status,
            planName: sub.plan.name,
            endDate: sub.endDate,
            daysLeft: Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        };
    }

    /**
     * 2. INITIATE PURCHASE (Checkout)
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