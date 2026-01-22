import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { HistoryService } from '@/services/HistoryService'

export async function GET(request: Request) {
    // 1. Auth Check (Supports both Cookie & Bearer Token)
    const userId = await getAuthUserId(request);
    
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Fetch Data
        const history = await HistoryService.getHistory(userId);

        // 3. Return JSON
        return NextResponse.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error("History API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}