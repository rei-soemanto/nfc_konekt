import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { CardService } from '@/services/CardService'

export async function POST(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { slug } = body; // Your UI sends 'slug'

        if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

        // Get Payload (Logic inside Service handles ADMIN vs PARENT permissions)
        const writeData = await CardService.getCardWritePayload(undefined, slug, userId);
        
        return NextResponse.json({
            success: true,
            data: writeData
        });

    } catch (error: any) {
        console.error("Write API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 403 });
    }
}