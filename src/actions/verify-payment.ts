'use server'

import { prisma } from '@/lib/prisma'
import { coreApi } from '@/lib/midtrans'
import { getAuthUserId } from '@/lib/auth'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { sendTeamMemberCredentials, sendPaymentNotificationEmail } from '@/lib/email'

// --- HELPERS ---

function generateSlug(name: string) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const suffix = randomBytes(3).toString('hex');
    return `${base}-${suffix}`;
}

async function hashPassword(plain: string) {
    return await bcrypt.hash(plain, 10);
}

function daysForDuration(duration: string): number {
    if (duration === 'MONTHLY') return 30;
    if (duration === 'SIX_MONTHS') return 180;
    if (duration === 'YEARLY') return 365;
    return 30;
}

function calculateEndDate(duration: string) {
    const date = new Date();
    date.setDate(date.getDate() + daysForDuration(duration));
    return date;
}

// =============================================
// SHARED: Process a paid transaction
// Used by both the webhook AND the client-side verify action
// =============================================
export async function processSuccessfulPayment(orderId: string) {
    const tx = await prisma.transaction.findUnique({
        where: { paymentId: orderId },
        include: { user: true, plan: true }
    });

    if (!tx) {
        throw new Error(`No transaction exists with payment id "${orderId}".`);
    }

    // Already processed — idempotency guard
    // adminNotified is true here because the FIRST call already sent it — this
    // path deliberately sends nothing, which is what stops a webhook retry from
    // emailing the admin twice for one order.
    if (tx.status === 'PAID') return { alreadyProcessed: true, emailFailures: [] as string[], adminNotified: true };

    // Validate BEFORE marking PAID. Every branch below dereferences tx.plan for
    // the duration, so a missing plan would otherwise throw a TypeError after
    // the transaction had already been recorded as paid.
    const needsPlan = tx.type === 'NEW_SUBSCRIPTION' || tx.type === 'NEW' || tx.type === 'RENEW';
    if (needsPlan && !tx.plan) {
        throw new Error(
            `Transaction "${orderId}" is type ${tx.type} but has no linked plan, so the subscription period cannot be calculated. It was left unpaid for manual review.`
        );
    }

    // A. Update Transaction Status
    await prisma.transaction.update({
        where: { id: tx.id },
        data: {
            status: 'PAID',
            shipmentStatus: tx.shippingAddress ? 'PROCESSING' : 'ARRIVED'
        }
    });

    // B. Update Subscription based on type
    if (tx.type === 'NEW_SUBSCRIPTION' || tx.type === 'NEW') {
        await prisma.subscription.update({
            where: { userId: tx.userId },
            data: {
                status: 'ACTIVE',
                shipmentStatus: tx.shippingAddress ? 'PROCESSING' : undefined,
                startDate: new Date(),
                endDate: calculateEndDate(tx.plan!.duration)
            }
        });
    } else if (tx.type === 'EXPANSION') {
        await prisma.subscription.update({
            where: { userId: tx.userId },
            data: {
                expansionPacks: { increment: tx.expansionPacks },
                shipmentStatus: 'PROCESSING',
                shippingAddress: tx.shippingAddress
            }
        });
    } else if (tx.type === 'RENEW') {
        const sub = await prisma.subscription.findUnique({ where: { userId: tx.userId } });
        const now = new Date();
        const currentEnd = sub?.endDate && new Date(sub.endDate) > now
            ? new Date(sub.endDate)
            : now;

        const newEndDate = new Date(currentEnd);
        newEndDate.setDate(newEndDate.getDate() + daysForDuration(tx.plan!.duration));

        const isExpired = !sub?.endDate || new Date(sub.endDate) <= now;

        await prisma.subscription.update({
            where: { userId: tx.userId },
            data: {
                status: 'ACTIVE',
                ...(isExpired ? { startDate: now } : {}),
                endDate: newEndDate,
            }
        });
    }

    // C. Create Users & Cards (from Transaction Manifest)
    //
    // Every failure below is reported rather than swallowed: by this point the
    // customer has already been charged and the transaction marked PAID, so a
    // silent failure here means they paid for team seats that never appeared —
    // or whose owners never received a password.
    const emailFailures: string[] = [];

    if (tx.pendingTeamData) {
        let teamMembers: { fullName: string; email: string }[];
        try {
            teamMembers = JSON.parse(tx.pendingTeamData);
        } catch (error) {
            console.error(`[processSuccessfulPayment] order ${orderId}: pendingTeamData is not valid JSON — team members were NOT created`, error);
            throw new Error(
                `Payment for order ${orderId} was recorded, but the stored team roster was corrupt and no team members could be created. Manual follow-up required.`
            );
        }

        if (!Array.isArray(teamMembers)) {
            console.error(`[processSuccessfulPayment] order ${orderId}: pendingTeamData is not an array`);
            throw new Error(
                `Payment for order ${orderId} was recorded, but the stored team roster was not a list. Manual follow-up required.`
            );
        }

        for (const member of teamMembers) {
            const existing = await prisma.user.findUnique({
                where: { email: member.email },
                select: { id: true }
            });
            if (existing) continue;

            const randomPassword = randomBytes(8).toString('base64url').slice(0, 12);
            const newUser = await prisma.user.create({
                data: {
                    fullName: member.fullName,
                    email: member.email,
                    password: await hashPassword(randomPassword),
                    role: 'USER',
                    accountStatus: 'ACTIVE',
                    emailVerified: true,
                    parentId: tx.userId,
                }
            });
            await prisma.card.create({
                data: {
                    slug: generateSlug(newUser.fullName),
                    status: 'ACTIVE',
                    userId: newUser.id
                }
            });

            // The account exists now, so a mail failure must NOT abort the loop
            // or undo the other members — but it must be visible. Without the
            // credential email this member has no way to sign in.
            try {
                await sendTeamMemberCredentials({
                    email: member.email,
                    fullName: member.fullName,
                    password: randomPassword,
                    adminName: tx.user.fullName,
                    companyName: tx.user.companyName ?? null,
                    // The auth page lives at /auth — /auth/login is a 404.
                    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth`,
                    subscriptionEndDate: calculateEndDate(tx.plan!.duration),
                    planDuration: tx.plan!.duration,
                });
            } catch (error) {
                emailFailures.push(member.email);
                console.error(
                    `[processSuccessfulPayment] order ${orderId}: account created for ${member.email} but the credentials email failed to send — they cannot sign in until it is resent`,
                    error
                );
            }
        }
    }

    // D. Tell the admin a payment landed.
    //
    // Last thing in the function, and after the `tx.status === 'PAID'` guard at
    // the top — so a webhook retry racing the client-side verifyPayment() path
    // short-circuits there and this cannot send twice for one order.
    //
    // Never throws: the customer has already been charged and everything above
    // has committed. A failed notification must not unwind that or surface to
    // the payer as a failure, so it is logged and reported instead.
    let adminNotified = true;
    try {
        await sendPaymentNotificationEmail({
            customerName: tx.user.fullName,
            customerEmail: tx.user.email,
            // plan is optional on Transaction — EXPANSION and SHIPMENT_REQUEST
            // rows can have none.
            planName: tx.plan?.name ?? null,
            planDuration: tx.plan?.duration ?? null,
            amount: tx.amount,
            transactionType: tx.type,
            orderId,
            hasShipment: Boolean(tx.shippingAddress),
        });
    } catch (error) {
        adminNotified = false;
        console.error(
            `[processSuccessfulPayment] order ${orderId}: payment processed successfully but the admin notification email failed`,
            error
        );
    }

    return { alreadyProcessed: false, emailFailures, adminNotified };
}

// =============================================
// CLIENT-SIDE VERIFY: Called after Snap onSuccess
// Queries Midtrans API directly to confirm payment
// =============================================
export async function verifyPayment(orderId: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { error: "Your session has expired. Sign in again to confirm this payment." };

        // Security: Verify the transaction belongs to the logged-in user
        const tx = await prisma.transaction.findUnique({
            where: { paymentId: orderId }
        });

        // Deliberately the same message for "missing" and "not yours" so this
        // cannot be used to probe which order ids exist.
        if (!tx || tx.userId !== userId) {
            return { error: `No payment with reference "${orderId}" was found on your account.` };
        }

        // Already processed — no need to hit Midtrans
        if (tx.status === 'PAID') return { success: true };

        // Query Midtrans directly for the transaction status
        const statusResponse = await coreApi.transaction.status(orderId);
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        let isPaid = false;
        if (transactionStatus === 'settlement') {
            isPaid = true;
        } else if (transactionStatus === 'capture') {
            if (fraudStatus === 'accept' || !fraudStatus) {
                isPaid = true;
            }
        }

        if (isPaid) {
            const outcome = await processSuccessfulPayment(orderId);
            if (outcome.emailFailures.length > 0) {
                // The payment and the accounts are fine; only the emails failed.
                // Say so plainly rather than reporting a blanket success.
                return {
                    success: true,
                    warning: `Your payment was successful, but we could not email login details to: ${outcome.emailFailures.join(', ')}. Please resend their invitations from the Team page.`
                };
            }
            return { success: true };
        } else if (transactionStatus === 'expire' || transactionStatus === 'cancel' || transactionStatus === 'deny') {
            await prisma.transaction.update({ where: { id: tx.id }, data: { status: 'EXPIRED' } });
            return {
                error: transactionStatus === 'deny'
                    ? "Your bank declined this payment. No charge was made — please try a different payment method."
                    : `This payment was ${transactionStatus === 'expire' ? 'not completed in time' : 'cancelled'}. No charge was made — please start the checkout again.`
            };
        }

        // Still pending (e.g. bank transfer waiting for payment)
        return { pending: true };

    } catch (error) {
        console.error(`[verifyPayment] order ${orderId}`, error);
        return {
            error: "We could not confirm your payment right now. If you were charged, it will be applied automatically within a few minutes — please do not pay again."
        };
    }
}
