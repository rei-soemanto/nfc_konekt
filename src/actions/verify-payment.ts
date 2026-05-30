'use server'

import { prisma } from '@/lib/prisma'
import { coreApi } from '@/lib/midtrans'
import { getAuthUserId } from '@/lib/auth'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { sendTeamMemberCredentials } from '@/lib/email'

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

    if (!tx) throw new Error("Transaction not found");
    
    // Already processed — idempotency guard
    if (tx.status === 'PAID') return { alreadyProcessed: true };

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
    if (tx.pendingTeamData) {
        const teamMembers = JSON.parse(tx.pendingTeamData);
        for (const member of teamMembers) {
            const existing = await prisma.user.findUnique({ where: { email: member.email } });
            if (!existing) {
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
                try {
                    const subscriptionEndDate = calculateEndDate(tx.plan!.duration);
                    await sendTeamMemberCredentials({
                        email: member.email,
                        fullName: member.fullName,
                        password: randomPassword,
                        adminName: tx.user.fullName,
                        companyName: tx.user.companyName ?? null,
                        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
                        subscriptionEndDate,
                        planDuration: tx.plan!.duration,
                    })
                } catch {}
            }
        }
    }

    return { alreadyProcessed: false };
}

// =============================================
// CLIENT-SIDE VERIFY: Called after Snap onSuccess
// Queries Midtrans API directly to confirm payment
// =============================================
export async function verifyPayment(orderId: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { error: "Unauthorized" };

        // Security: Verify the transaction belongs to the logged-in user
        const tx = await prisma.transaction.findUnique({
            where: { paymentId: orderId }
        });

        if (!tx) return { error: "Transaction not found" };
        if (tx.userId !== userId) return { error: "Unauthorized" };

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
            await processSuccessfulPayment(orderId);
            return { success: true };
        } else if (transactionStatus === 'expire' || transactionStatus === 'cancel' || transactionStatus === 'deny') {
            await prisma.transaction.update({ where: { id: tx.id }, data: { status: 'EXPIRED' } });
            return { error: "Payment was not successful" };
        }

        // Still pending (e.g. bank transfer waiting for payment)
        return { pending: true };

    } catch (error: any) {
        console.error("Verify Payment Error:", error);
        return { error: "Failed to verify payment" };
    }
}
