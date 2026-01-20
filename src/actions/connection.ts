'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// Helper to check if user can use Connect feature
async function checkSubscriptionAccess(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true, parent: { include: { subscription: true } } }
    });

    const sub = user?.subscription || user?.parent?.subscription;
    
    // Check if subscription exists and is active
    if (!sub || sub.status !== 'ACTIVE') {
        throw new Error("SUBSCRIPTION_REQUIRED");
    }
    return true;
}

export async function addToConnect(targetUserId: string) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    if (userId === targetUserId) throw new Error("Cannot connect with yourself");

    // 1. ACCESS CHECK: Only subscribers can initiate
    try {
        await checkSubscriptionAccess(userId);
    } catch (e) {
        return { success: false, error: "Upgrade required to add connections." };
    }

    // 2. CREATE MUTUAL CONNECTION (No approval needed)
    // We use a transaction to ensure both sides are added instantly
    try {
        await prisma.$transaction([
            // Add Target to My List
            prisma.connection.upsert({
                where: { userId_targetId: { userId, targetId: targetUserId } },
                update: {},
                create: { userId, targetId: targetUserId }
            }),
            // Add Me to Target's List (They can see me if they subscribe later)
            prisma.connection.upsert({
                where: { userId_targetId: { userId: targetUserId, targetId: userId } },
                update: {},
                create: { userId: targetUserId, targetId: userId }
            })
        ]);

        revalidatePath('/dashboard/connect');
        return { success: true, message: "Connected successfully." };
    } catch (error) {
        console.error("Connect Error:", error);
        return { success: false, error: "Failed to connect." };
    }
}

export async function getMyConnections() {
    const userId = await getAuthUserId();
    if (!userId) return [];

    // 1. VISIBILITY CHECK: Free users cannot SEE their list
    try {
        // We reuse the helper, assuming it's exported or defined in this file
        // await checkSubscriptionAccess(userId); 
        // For brevity, assuming access is checked or handled by the caller/UI state
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { subscription: true, parent: { include: { subscription: true } } }
        });
        const sub = user?.subscription || user?.parent?.subscription;
        if (!sub || sub.status !== 'ACTIVE') {
            return { error: "SUBSCRIPTION_REQUIRED", data: [] };
        }
    } catch (e) {
        return { error: "SUBSCRIPTION_REQUIRED", data: [] };
    }

    const connections = await prisma.connection.findMany({
        where: { userId },
        include: { 
            target: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatarUrl: true,
                    jobTitle: true,
                    companyScope: true
                    
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: connections };
}

export async function removeConnection(targetId: string) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    // Removes connection ONE WAY (or both, depending on preference. Usually 'Disconnect' implies both).
    // Let's remove both to keep the list clean.
    await prisma.connection.deleteMany({
        where: {
            OR: [
                { userId: userId, targetId: targetId },
                { userId: targetId, targetId: userId }
            ]
        }
    });

    revalidatePath('/dashboard/connect');
    return { success: true };
}