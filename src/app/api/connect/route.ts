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