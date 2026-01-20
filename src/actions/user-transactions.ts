'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function markShipmentReceived(transactionId: string) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    // Verify ownership
    const tx = await prisma.transaction.findUnique({
        where: { id: transactionId }
    });

    if (!tx || tx.userId !== userId) {
        throw new Error("Transaction not found or unauthorized");
    }

    if (tx.shipmentStatus !== 'SHIPPING') {
        throw new Error("Shipment is not currently in transit");
    }

    // Update Transaction
    await prisma.transaction.update({
        where: { id: transactionId },
        data: { shipmentStatus: 'ARRIVED' }
    });

    // Update Subscription Mirror (if it's the latest one)
    await prisma.subscription.updateMany({
        where: { 
            userId: userId,
            paymentId: tx.paymentId 
        },
        data: { shipmentStatus: 'ARRIVED' }
    });

    revalidatePath('/dashboard/subscription/status');
    return { success: true };
}