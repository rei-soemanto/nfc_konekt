'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function logScan(cardSlug: string) {
    const viewerId = await getAuthUserId();
    if (!viewerId) return { success: false, reason: 'anonymous' };

    const card = await prisma.card.findUnique({
        where: { slug: cardSlug }
    });

    if (!card) return { success: false, error: 'Card not found' };

    // PREVENT SELF-SCAN LOGGING
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

// Renamed to 'connectUser' to match new terminology
export async function connectUser(targetUserId: string) {
    const currentUserId = await getAuthUserId();
    
    // 1. Check if logged in
    if (!currentUserId) {
        return { success: false, error: "You must be logged in to connect." };
    }

    // 2. SELF-CONNECT CHECK
    if (currentUserId === targetUserId) {
        return { success: false, error: "You cannot add yourself." };
    }

    // 3. SUBSCRIPTION CHECK (New Requirement)
    const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { subscription: true, parent: { include: { subscription: true } } }
    });
    const sub = user?.subscription || user?.parent?.subscription;
    
    if (!sub || sub.status !== 'ACTIVE') {
        return { success: false, error: "Subscription required to connect." };
    }

    try {
        // 4. Check if already connected (Using correct 'userId_targetId' unique constraint)
        const existing = await prisma.connection.findUnique({
            where: {
                userId_targetId: {
                    userId: currentUserId,
                    targetId: targetUserId // <--- FIXED FIELD NAME
                }
            }
        });

        if (existing) {
            return { success: false, error: "Already connected." };
        }

        // 5. Create the connection (Using 'targetId')
        await prisma.connection.create({
            data: {
                userId: currentUserId,
                targetId: targetUserId // <--- FIXED FIELD NAME
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Connect Error:", error);
        return { success: false, error: "Database error" };
    }
}