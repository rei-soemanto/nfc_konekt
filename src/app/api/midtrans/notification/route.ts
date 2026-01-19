import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { coreApi } from '@/lib/midtrans';
import { PlanDuration } from '@prisma/client'; // Import the Enum

export const runtime = "nodejs";

// Map the Enum to actual days
const DURATION_DAYS: Record<PlanDuration, number> = {
    [PlanDuration.MONTHLY]: 30,
    [PlanDuration.SIX_MONTHS]: 180,
    [PlanDuration.YEARLY]: 365,
};

export async function POST(req: Request) {
    try {
        const notificationJson = await req.json();

        // 1. Verify Signature with Midtrans SDK
        const statusResponse = await coreApi.transaction.notification(notificationJson);

        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        // 2. Find the subscription associated with this Order ID
        const subscription = await prisma.subscription.findFirst({
            where: { paymentId: orderId },
            include: { plan: true } // We need the plan to get the duration Enum
        });

        if (!subscription || !subscription.plan) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        // 3. Logic to Determine Success
        let isPaid = false;
        let isFailed = false;

        if (transactionStatus == 'capture') {
            if (fraudStatus == 'challenge') {
                // Manual review needed - usually ignore or set to pending
            } else if (fraudStatus == 'accept') {
                isPaid = true;
            }
        } else if (transactionStatus == 'settlement') {
            isPaid = true;
        } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
            isFailed = true;
        }

        // 4. Update Database
        if (isPaid) {
            const today = new Date();
            const newEndDate = new Date();
            
            // FIX: Get days from our Map using the Plan's Enum
            const daysToAdd = DURATION_DAYS[subscription.plan.duration] || 30; // Default to 30 if undefined
            newEndDate.setDate(today.getDate() + daysToAdd);

            // Update Subscription
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    status: 'ACTIVE',
                    startDate: today,
                    endDate: newEndDate,
                    paymentId: orderId, // Ensure ID is confirmed
                    // snapToken: null // Optional: Clear token after success
                }
            });

            // Unlock User Account
            await prisma.user.update({
                where: { id: subscription.userId },
                data: { accountStatus: 'ACTIVE' }
            });

        } else if (isFailed) {
            // Handle failed payments to allow retrying
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: { status: 'EXPIRED' }
            });
        }

        return NextResponse.json({ status: 'OK' });

    } catch (error) {
        console.error("Midtrans Notification Error:", error);
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}