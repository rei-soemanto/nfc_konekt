import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import { processSuccessfulPayment } from '@/actions/verify-payment'

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { order_id, transaction_status, status_code, gross_amount, signature_key, fraud_status } = body;

        // 1. Verify Signature
        const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
        const input = `${order_id}${status_code}${gross_amount}${serverKey}`;
        const signature = createHash('sha512').update(input).digest('hex');

        if (signature !== signature_key) return NextResponse.json({ message: "Invalid Signature" }, { status: 403 });

        // 2. Find TRANSACTION
        const tx = await prisma.transaction.findUnique({
            where: { paymentId: order_id },
        });

        if (!tx) return NextResponse.json({ message: "Transaction not found" }, { status: 404 });

        // 3. Determine if payment is successful
        let isPaid = false;

        if (transaction_status === 'settlement') {
            isPaid = true;
        } else if (transaction_status === 'capture') {
            if (fraud_status === 'accept' || !fraud_status) {
                isPaid = true;
            }
        }

        // 4. Process
        if (isPaid) {
            await processSuccessfulPayment(order_id);
        } else if (transaction_status === 'expire' || transaction_status === 'cancel') {
            await prisma.transaction.update({ where: { id: tx.id }, data: { status: 'EXPIRED' } });
        }

        return NextResponse.json({ status: 'OK' });
    } catch (error) {
        console.error("Midtrans Webhook Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}