import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { ConnectionService } from '@/services/ConnectionService'

export async function GET(request: Request) {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Parse Query Param for Filtering
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;

    try {
        const connections = await ConnectionService.getConnections(userId, query);
        return NextResponse.json(connections);
    } catch (error) {
        console.error("Connection List API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { slug } = body;

        if (!slug) {
            return NextResponse.json({ error: "Card Slug is required" }, { status: 400 });
        }

        const result = await ConnectionService.addConnection(userId, slug);

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error("Add Connection Error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}