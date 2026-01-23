import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth' // Or your auth check
import { PromoService } from '@/services/PromoService'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    // 1. Auth Check (Admin Only)
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Optional: Check if user is strictly ADMIN in DB
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const body = await req.json();

        // 2. VALIDATION: Percentage Check
        if (body.type === 'PERCENTAGE') {
            const val = Number(body.value);
            if (val < 1 || val > 100) {
                return NextResponse.json({ 
                    error: "Percentage discount must be between 1% and 100%" 
                }, { status: 400 });
            }
        }

        // 3. Create Promo
        const promo = await PromoService.create(body);

        return NextResponse.json({ success: true, data: promo });

    } catch (error: any) {
        console.error("Create Promo Error:", error);
        // Handle Unique Constraint (Duplicate Code)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Promo code already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}