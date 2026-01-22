import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { DashboardService } from '@/services/DashboardService'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    // 1. Auth Check (Passing 'request' is critical for Bearer Token support)
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // 2. Get User Profile Data & Plan via Relation
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                role: true,
                companyName: true,
                // FIX: Fetch Plan Category via Subscription relation
                subscription: {
                    select: {
                        status: true,
                        plan: {
                            select: {
                                category: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 3. Get Stats & Activity
        const stats = await DashboardService.getDashboardStats(userId);
        const activity = await DashboardService.getRecentActivity(userId);

        // 4. Safely extract plan category
        // If no subscription or plan, default to 'PERSONAL' (or 'FREE')
        const planCategory = user.subscription?.plan?.category || 'PERSONAL';
        const isCorporate = planCategory === 'CORPORATE';

        // 5. Return Combined JSON
        return NextResponse.json({
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                avatarUrl: user.avatarUrl,
                role: user.role,
                companyName: user.companyName,
                planCategory: planCategory, // We manually add this derived field
                isCorporate: isCorporate
            },
            stats,
            activity
        });

    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}