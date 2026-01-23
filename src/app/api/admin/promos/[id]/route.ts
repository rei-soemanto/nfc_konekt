import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 1. UPDATE (PUT)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const body = await req.json();

        // Basic Validation
        if (body.type === 'PERCENTAGE') {
            const val = Number(body.value);
            if (val < 1 || val > 100) {
                return NextResponse.json({ error: "Percentage must be 1-100" }, { status: 400 });
            }
        }

        const updatedPromo = await prisma.promoCode.update({
            where: { id },
            data: {
                name: body.name,
                code: body.code.toUpperCase(),
                type: body.type,
                value: body.value,
                startDate: body.startDate,
                endDate: body.endDate,
                isActive: body.isActive, // Admin control
                applicablePlans: body.applicablePlans,
            }
        });

        return NextResponse.json({ success: true, data: updatedPromo });
    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ error: "Failed to update promo" }, { status: 500 });
    }
}

// 2. DELETE
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        await prisma.promoCode.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete promo" }, { status: 500 });
    }
}