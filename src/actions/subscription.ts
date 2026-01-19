'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function cancelSubscription() {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, message: "Unauthorized" };

    try {
        await prisma.subscription.update({
            where: { userId: userId },
            data: { status: 'CANCELED' } 
        });
        
        revalidatePath('/dashboard/subscription/status');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to cancel subscription." };
    }
}