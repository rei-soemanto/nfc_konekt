import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { SubscriptionService } from '@/services/SubscriptionService'

export async function GET(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const [status, transactions] = await Promise.all([
            SubscriptionService.getStatus(userId),
            SubscriptionService.getTransactionHistory(userId)
        ]);
        return NextResponse.json({ success: true, data: { ...status, transactions } });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}