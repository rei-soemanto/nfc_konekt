import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { SubscriptionService } from '@/services/SubscriptionService'

export async function GET(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const transactions = await SubscriptionService.getTransactionHistory(userId);
        return NextResponse.json({ success: true, data: transactions });
    } catch (error) {
        console.error("Transaction History API Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
