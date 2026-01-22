import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { SubscriptionService } from '@/services/SubscriptionService'

export async function POST(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        
        // Validate required fields
        if (!body.planCategory || !body.duration) {
            return NextResponse.json({ error: "Missing Plan Details" }, { status: 400 });
        }

        const result = await SubscriptionService.initiatePurchase(userId, body);

        // Return the Token so Mobile App can open Midtrans SDK
        return NextResponse.json({ 
            success: true, 
            data: result 
        });

    } catch (error: any) {
        console.error("Purchase Error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}