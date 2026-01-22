import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CardService } from '@/services/CardService'

export async function GET(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. FETCH USER WITH SUBSCRIPTION & PLAN
    const user = await prisma.user.findUnique({ 
        where: { id: userId },
        include: {
            subscription: {
                include: {
                    plan: true // Include Plan to check 'category'
                }
            }
        }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    // 2. CHECK PERMISSIONS
    const isAdmin = user.role === 'ADMIN';
    
    // Check if they have a Corporate Subscription
    // We check 'plan.category' because 'planId' is just a random number
    const isCorporate = user.subscription?.status === 'ACTIVE' && 
                        user.subscription?.plan?.category === 'CORPORATE';

    if (!isAdmin && !isCorporate) {
        return NextResponse.json({ error: "Requires Corporate Subscription" }, { status: 403 });
    }
    
    // 3. CHECK INHERITANCE (Team Members cannot use this)
    if (user.parentId) {
        return NextResponse.json({ error: "Team Members cannot access this feature" }, { status: 403 });
    }

    try {
        const teamMembers = await CardService.getTeamCards(userId);

        // Map to format expected by NFCWriterClient.tsx
        const formatted = teamMembers
            .filter(m => m.cards.length > 0)
            .map(m => ({
                id: m.cards[0].id,
                name: m.fullName,
                slug: m.cards[0].slug
            }));

        return NextResponse.json({ success: true, data: formatted });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}