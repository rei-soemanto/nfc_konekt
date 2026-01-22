import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CardService } from '@/services/CardService'

export async function GET(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. STRICT ROLE CHECK: Must be ADMIN
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') {
        return NextResponse.json({ error: "Access Denied: Admins Only" }, { status: 403 });
    }

    // 2. Search Logic
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    try {
        const cards = await CardService.getGlobalCards(query);
        
        // Map to format expected by NFCWriter.tsx
        const formatted = cards.map(c => ({
            id: c.id,
            slug: c.slug,
            owner: c.user.fullName,
            email: c.user.email
        }));

        return NextResponse.json({ success: true, data: formatted });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}