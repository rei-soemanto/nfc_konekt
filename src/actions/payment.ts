'use server'

import { midtransSnap } from '@/lib/midtrans'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function createSubscriptionToken(planType: string, userId: string) {
    if (!userId) throw new Error("Unauthorized");

    // 1. Define Pricing Logic (Object Oriented / Config)
    const PLANS: Record<string, number> = {
        'PERSONAL': 0,
        'GROUP': 290000, // IDR 290.000
        'COMPANY': 990000 // IDR 990.000
    };

    const price = PLANS[planType];

    if (price === undefined) throw new Error("Invalid Plan");
    
    // If free plan, handle directly (update DB and redirect)
    if (price === 0) {
        // Update user subscription directly here
        return { token: null, status: 'free_activated' };
    }

    // 2. Create Unique Order ID
    const orderId = `SUB-${planType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 3. Prepare Parameter for Midtrans
    const parameter = {
        transaction_details: {
            order_id: orderId,
            gross_amount: price
        },
        credit_card: {
            secure: true
        },
        customer_details: {
            // In real app, fetch real user data here
            first_name: "Customer", 
            email: "customer@example.com", 
        }
    };

    // 4. Request Token from Midtrans
    try {
        const transaction = await midtransSnap.createTransaction(parameter);
        return { token: transaction.token, status: 'pending' };
    } catch (error) {
        console.error("Midtrans Error:", error);
        throw new Error("Payment Gateway Error");
    }
}