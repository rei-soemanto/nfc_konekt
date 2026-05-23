import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CardService } from '@/services/CardService'

export async function POST(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // SECURITY FIX (VULN-007): Validate admin/corporate permissions at route level
    const user = await prisma.user.findUnique({ 
        where: { id: userId },
        include: { subscription: { include: { plan: true } } }
    });
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    const isAdmin = user.role === 'ADMIN';
    const isCorporateParent = user.subscription?.plan?.category === 'CORPORATE' && !user.parentId;
    
    if (!isAdmin && !isCorporateParent) {
        return NextResponse.json({ error: 'Forbidden: Admin or Corporate subscription required' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { slug } = body;

        if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

        const writeData = await CardService.getCardWritePayload(undefined, slug, userId);
        
        return NextResponse.json({
            success: true,
            data: writeData
        });

    } catch (error: any) {
        console.error("Write API Error:", error);
        // SECURITY: Don't leak internal error details
        return NextResponse.json({ error: "Forbidden or card not found" }, { status: 403 });
    }
}