'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Helper to get current user (Replace with your actual auth session)
async function getAuthUserId() {
    const user = await prisma.user.findFirst(); 
    return user?.id;
}

export async function logScan(cardSlug: string) {
    const viewerId = await getAuthUserId();
    
    // 1. If not logged in, we can't track "Who scanned" in strict schema
    // In a real app, you might create a "Guest" user or track simple analytics
    if (!viewerId) return { success: false, reason: 'anonymous' };

    // 2. Find the card
    const card = await prisma.card.findUnique({
        where: { slug: cardSlug }
    });

    if (!card) return { success: false, error: 'Card not found' };

    // 3. Don't log if I scan my own card
    if (card.userId === viewerId) return { success: false, reason: 'owner' };

    // 4. Create the Scan Record
    try {
        await prisma.scan.create({
            data: {
                scannerId: viewerId,
                cardId: card.id
            }
        });
        
        revalidatePath('/dashboard'); // Update stats
        return { success: true };
    } catch (error) {
        console.error("Scan Log Error:", error);
        return { success: false, error: 'Failed to log' };
    }
}

export async function addFriend(friendId: string) {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        await prisma.friend.create({
            data: {
                userId: userId,
                friendId: friendId
            }
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: "Already friends or error" };
    }
}