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
        console.error('[logScan]', error);
        return { success: false, error: 'Could not record this card scan. The profile still loaded normally.' };
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

    // NOTE: there is deliberately no subscription check here.
    // Scanning a card and saving the person is the core loop of the product, and
    // gating it blocked the sign-up -> return -> connect flow entirely: a brand
    // new account has no subscription, so its very first action always failed.
    // Subscriptions still gate cards, team seats and the NFC writer.

    try {
        // 3. Check if already connected (Using correct 'userId_targetId' unique constraint)
        const existing = await prisma.connection.findUnique({
            where: {
                userId_targetId: {
                    userId: currentUserId,
                    targetId: targetUserId // <--- FIXED FIELD NAME
                }
            }
        });

        // Treat an existing link as success: the caller's intent ("this person
        // should be in my network") is already satisfied, and the auto-connect
        // path can fire twice on a refresh. Failing here would show an error for
        // an outcome the user actually wanted.
        if (existing) {
            return { success: true, alreadyConnected: true };
        }

        // 4. Create the connection (Using 'targetId')
        await prisma.connection.create({
            data: {
                userId: currentUserId,
                targetId: targetUserId // <--- FIXED FIELD NAME
            }
        });

        revalidatePath('/dashboard/connect');
        return { success: true, alreadyConnected: false };
    } catch (error) {
        console.error("[connectUser]", error);
        return { success: false, error: "Could not add this person to your network. Please try again." };
    }
}