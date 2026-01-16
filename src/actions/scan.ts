'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth' // Use the REAL auth we fixed earlier
import { revalidatePath } from 'next/cache'

export async function logScan(cardSlug: string) {
    const viewerId = await getAuthUserId();
    if (!viewerId) return { success: false, reason: 'anonymous' };

    const card = await prisma.card.findUnique({
        where: { slug: cardSlug }
    });

    if (!card) return { success: false, error: 'Card not found' };

    // PREVENT SELF-SCAN LOGGING (Optional: Keep this to prevent cluttering history)
    if (card.userId === viewerId) return { success: false, reason: 'owner' };

    try {
        await prisma.scan.create({
            data: {
                scannerId: viewerId,
                cardId: card.id
            }
        });
        
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to log' };
    }
}

export async function addFriend(targetUserId: string) {
    const currentUserId = await getAuthUserId();
    
    // 1. Check if logged in
    if (!currentUserId) {
        return { success: false, error: "You must be logged in to connect." };
    }

    // 2. SELF-FRIEND CHECK: Prevent adding yourself
    if (currentUserId === targetUserId) {
        return { success: false, error: "You cannot add yourself as a friend." };
    }

    try {
        // 3. Check if already friends
        const existing = await prisma.friend.findFirst({
            where: {
                userId: currentUserId,
                friendId: targetUserId
            }
        });

        if (existing) {
            return { success: false, error: "Already connected." };
        }

        // 4. Create the connection
        // This means: "CurrentUser" ADDS "TargetUser" to their list
        await prisma.friend.create({
            data: {
                userId: currentUserId,
                friendId: targetUserId
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Add Friend Error:", error);
        return { success: false, error: "Database error" };
    }
}