'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// 1. Send a Friend Request
export async function sendFriendRequest(targetUserId: string) {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (userId === targetUserId) return { success: false, error: "Cannot add yourself" };

    try {
        // Check if request already exists (either direction)
        const existing = await prisma.friend.findFirst({
            where: {
                OR: [
                    { userId: userId, friendId: targetUserId },
                    { userId: targetUserId, friendId: userId }
                ]
            }
        });

        if (existing) {
            if (existing.status === 'ACCEPTED') return { success: false, error: "Already friends" };
            if (existing.status === 'PENDING') return { success: false, error: "Request already pending" };
        }

        // Create the request
        await prisma.friend.create({
            data: {
                userId: userId,
                friendId: targetUserId,
                status: 'PENDING'
            }
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to send request" };
    }
}

// 2. Accept a Friend Request
export async function acceptFriendRequest(requestId: string) {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        // Verify the request exists and is intended for ME
        const request = await prisma.friend.findUnique({
            where: { id: requestId }
        });

        if (!request || request.friendId !== userId) {
            return { success: false, error: "Invalid request" };
        }

        // Update status to ACCEPTED
        await prisma.friend.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED' }
        });

        // OPTIONAL: Create the reverse record so both users see each other in "My Friends"
        // (Depends on if you want unidirectional or bidirectional friendship)
        // For simple apps, treating one record as a link is easier, but let's stick to simple status update.

        revalidatePath('/dashboard/friends');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to accept" };
    }
}

// 3. Reject / Cancel Request
export async function deleteFriend(recordId: string) {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        await prisma.friend.delete({
            where: { id: recordId }
        });
        revalidatePath('/dashboard/friends');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to remove" };
    }
}