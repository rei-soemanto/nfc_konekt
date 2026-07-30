import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { ConnectionService } from '@/services/ConnectionService'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // 'id' here is the TARGET USER ID
) {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: targetId } = await params;

    try {
        const details = await ConnectionService.getConnectionDetails(userId, targetId);

        if (!details) {
            return NextResponse.json({ error: "Connection not found or user disconnected" }, { status: 404 });
        }

        return NextResponse.json(details);
    } catch (error) {
        console.error("[GET /api/connect/[id]]", error);
        return NextResponse.json({ error: "Could not load that connection. Please try again." }, { status: 500 });
    }
}