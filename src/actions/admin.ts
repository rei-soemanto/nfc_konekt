'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth' // <--- Now uses real auth

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