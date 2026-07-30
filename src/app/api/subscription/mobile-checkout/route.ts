import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { snap } from '@/lib/midtrans';
import { err, fail, toResponse } from '@/lib/result';

const VALID_MODES = ['NEW', 'NEW_SUBSCRIPTION', 'RENEW', 'EXPANSION', 'UPGRADE'] as const;
const VALID_DURATIONS = ['MONTHLY', 'SIX_MONTHS', 'YEARLY'] as const;

type CheckoutMode = (typeof VALID_MODES)[number];
type CheckoutDuration = (typeof VALID_DURATIONS)[number];

function isValidMode(value: unknown): value is CheckoutMode {
    return typeof value === 'string' && (VALID_MODES as readonly string[]).includes(value);
}

function isValidDuration(value: unknown): value is CheckoutDuration {
    return typeof value === 'string' && (VALID_DURATIONS as readonly string[]).includes(value);
}

export async function POST(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) {
        return toResponse(err('UNAUTHORIZED', 'Sign in to start a checkout.'));
    }

    let body: { mode?: string; duration?: string } | null;
    try {
        body = await req.json();
    } catch {
        return toResponse(err('VALIDATION', 'Request body is not valid JSON.'));
    }

    const { mode, duration } = body ?? {};

    if (!isValidMode(mode)) {
        return toResponse(err('VALIDATION', `Unknown checkout mode "${mode}". Expected one of: ${VALID_MODES.join(', ')}.`));
    }
    if (duration !== undefined && !isValidDuration(duration)) {
        return toResponse(err('VALIDATION', `Unknown duration "${duration}". Expected one of: ${VALID_DURATIONS.join(', ')}.`));
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                fullName: true,
                email: true,
                subscription: { include: { plan: true } }
            }
        });

        if (!user) {
            return toResponse(err('NOT_FOUND', 'Your account could not be found.'));
        }
        if (!user.subscription?.plan) {
            return toResponse(err('CONFLICT', 'You do not have an active subscription plan to check out against. Purchase a plan first.'));
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

            if (!upgradedPlan) {
                return toResponse(err('NOT_FOUND', `No ${targetPlan.category} plan exists for duration ${duration}.`));
            }
            targetPlan = upgradedPlan;
        }

        const amount = targetPlan.price;
        const orderId = `MOB-${mode}-${Date.now()}`;

        // Ask Midtrans for the token BEFORE writing the transaction, so a
        // gateway failure does not leave an orphaned PENDING row behind.
        let midtransResponse;
        try {
            midtransResponse = await snap.createTransaction({
                transaction_details: { order_id: orderId, gross_amount: amount },
                customer_details: { first_name: user.fullName, email: user.email },
                item_details: [{ id: targetPlan.id, price: amount, quantity: 1, name: `${targetPlan.name} ${mode}` }]
            });
        } catch (error) {
            return toResponse(fail(
                'POST /api/subscription/mobile-checkout (midtrans)',
                error,
                'PAYMENT_FAILED',
                'The payment provider could not start this checkout. You have not been charged — please try again shortly.'
            ));
        }

        await prisma.transaction.create({
            data: {
                userId,
                planId: targetPlan.id,
                paymentId: orderId,
                amount: amount,
                status: 'PENDING',
                type: mode,
                snapToken: midtransResponse.token,
            }
        });

        // Flat success shape kept deliberately: existing mobile clients read
        // snapToken/redirectUrl/orderId at the top level. Error responses do
        // move to the shared shape, but they retain the `error` key so those
        // stay backward compatible too.
        return NextResponse.json({
            success: true,
            snapToken: midtransResponse.token,
            redirectUrl: midtransResponse.redirect_url,
            orderId,
        });
    } catch (error) {
        return toResponse(fail(
            'POST /api/subscription/mobile-checkout',
            error,
            'INTERNAL',
            'Could not start your checkout. Please try again.'
        ));
    }
}
