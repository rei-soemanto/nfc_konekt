import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash, timingSafeEqual } from 'crypto'
import { processSuccessfulPayment } from '@/actions/verify-payment'

type MidtransNotification = {
    order_id?: string
    transaction_status?: string
    status_code?: string
    gross_amount?: string
    signature_key?: string
    fraud_status?: string
}

/** Constant-time compare of two hex digests of equal length. */
function signaturesMatch(expected: string, received: unknown): boolean {
    if (typeof received !== 'string' || received.length !== expected.length) return false
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'))
}

export async function POST(request: Request) {
    try {
        // Fail CLOSED: with no server key the signature below would be computed
        // over an empty secret, which anyone could reproduce to forge a PAID
        // notification. Refuse to process rather than trust the payload.
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        if (!serverKey) {
            console.error('[midtrans webhook] MIDTRANS_SERVER_KEY is not set — refusing to process notification');
            return NextResponse.json(
                { message: "Webhook is not configured on this server." },
                { status: 503 }
            );
        }

        let body: MidtransNotification;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ message: "Notification body is not valid JSON." }, { status: 400 });
        }

        const { order_id, transaction_status, status_code, gross_amount, signature_key, fraud_status } = body ?? {};

        if (!order_id) {
            return NextResponse.json({ message: "Notification is missing order_id." }, { status: 400 });
        }

        // 1. Verify Signature
        const input = `${order_id}${status_code}${gross_amount}${serverKey}`;
        const signature = createHash('sha512').update(input).digest('hex');

        if (!signaturesMatch(signature, signature_key)) {
            return NextResponse.json({ message: "Invalid Signature" }, { status: 403 });
        }

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
        // Returning 500 makes Midtrans retry the notification, which is what we
        // want: the payment is real and the retry is our second chance to record it.
        console.error("[midtrans webhook] failed to process notification", error);
        return NextResponse.json(
            { message: "Could not process the payment notification. It will be retried." },
            { status: 500 }
        );
    }
}