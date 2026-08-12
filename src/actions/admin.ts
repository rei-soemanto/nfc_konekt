'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth' // <--- Now uses real auth

/**
 * Auth gate for admin-only work. Returns the admin's userId, throws otherwise.
 *
 * Use this rather than `getAdminData()` when you only need the check —
 * `getAdminData()` also fetches every ACTIVE card for the NFC-writer dropdown,
 * which is a wasted query for anything else.
 *
 * Server Actions are NOT covered by `middleware.ts` (it matches on request
 * paths), so every admin action must call this itself.
 */
export async function requireAdmin(): Promise<string> {
    const userId = await getAuthUserId();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
        throw new Error("Forbidden: Admin Access Only");
    }

    return userId;
}

export async function getAdminData() {
    const userId = await getAuthUserId();
    
    // 1. Strict Auth Check
    if (!userId) {
        throw new Error("Unauthorized");
    }

    // 2. Strict Role Check
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
        throw new Error("Forbidden: Admin Access Only");
    }

    // 3. Fetch all active cards for the dropdown
    const cards = await prisma.card.findMany({
        where: { status: 'ACTIVE' },
        include: { 
            user: { 
                select: { fullName: true } 
            } 
        },
        orderBy: { createdAt: 'desc' }
    });

    return { 
        isAdmin: true, 
        cards: cards.map(c => ({
            id: c.id,
            slug: c.slug,
            owner: c.user.fullName
        }))
    };
}