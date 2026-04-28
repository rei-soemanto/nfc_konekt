import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { snap } from '@/lib/midtrans';

export async function POST(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { planId, mode, duration } = await req.json();

    const user = await prisma.user.findUnique({ 
        where: { id: userId }, 
        include: { subscription: { include: { plan: true } } }
    });

    if (!user || !user.subscription || !user.subscription.plan) {
        return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    let targetPlan = user.subscription.plan;

    if (mode === 'UPGRADE' && duration) {
        const upgradedPlan = await prisma.plan.findUnique({
            where: {
                category_duration: {
                    category: targetPlan.category,
                    duration: duration
                }
            }
        });
        
        if (!upgradedPlan) return NextResponse.json({ error: 'Target plan not found' }, { status: 404 });
        targetPlan = upgradedPlan;
    }

    const amount = targetPlan.price; 
    const orderId = `MOB-${mode}-${Date.now()}`;

    const transaction = await prisma.transaction.create({
        data: {
            userId,
            planId: targetPlan.id,
            paymentId: orderId,
            amount: amount,
            status: 'PENDING',
            type: mode, 
        }
    });

    const parameter = {
        transaction_details: { order_id: orderId, gross_amount: amount },
        customer_details: { first_name: user.fullName, email: user.email },
        item_details: [{ id: targetPlan.id, price: amount, quantity: 1, name: `${targetPlan.name} ${mode}` }]
    };

    const midtransResponse = await snap.createTransaction(parameter);

    return NextResponse.json({
        success: true,
        snapToken: midtransResponse.token,
        redirectUrl: midtransResponse.redirect_url,
        orderId: orderId
    });
}