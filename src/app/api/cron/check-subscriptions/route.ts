import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { timingSafeEqual } from 'crypto';

/** Constant-time secret comparison that does not leak length via early exit. */
function secretMatches(provided: string | null, expected: string): boolean {
    if (!provided) return false;
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

export async function GET(req: Request) {
    // 1. Security Check
    const expected = process.env.CRON_SECRET;
    if (!expected) {
        console.error('[cron/check-subscriptions] CRON_SECRET is not set — refusing to run');
        return NextResponse.json({ error: 'Cron is not configured on this server.' }, { status: 503 });
    }

    // Prefer the Authorization header. A secret in the query string ends up in
    // server logs, proxy logs and Referer headers; the query param is still
    // accepted for now so existing schedulers keep working.
    const authHeader = req.headers.get('authorization');
    const bearer = authHeader?.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7)
        : null;
    const legacyKey = new URL(req.url).searchParams.get('key');

    if (!secretMatches(bearer, expected) && !secretMatches(legacyKey, expected)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!bearer && legacyKey) {
        console.warn('[cron/check-subscriptions] authenticated via deprecated ?key= query param; switch the scheduler to an Authorization: Bearer header');
    }

    const now = new Date();
    
    // --- LOGIC 1: LOCK ACCOUNTS (Overdue by 1 Week) ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Find active users with subscriptions that expired more than 7 days ago
    const usersToLock = await prisma.user.findMany({
        where: {
            accountStatus: 'ACTIVE',
            subscription: {
                endDate: { lt: sevenDaysAgo }
            }
        }
    });

    for (const user of usersToLock) {
        await prisma.user.update({
            where: { id: user.id },
            data: { accountStatus: 'LOCKED' }
        });
        console.log(`🔒 Locked user: ${user.email}`);
    }

    // --- LOGIC 2: DELETE ACCOUNTS (Overdue by 1 Month) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Find users with subscriptions expired more than 30 days ago
    const usersToDelete = await prisma.user.findMany({
        where: {
            subscription: {
                endDate: { lt: thirtyDaysAgo }
            }
        }
    });

    for (const user of usersToDelete) {
        // Due to "onDelete: Cascade" in schema, this deletes cards, scans, friends, etc.
        await prisma.user.delete({
            where: { id: user.id }
        });
        console.log(`❌ Deleted user permanently: ${user.email}`);
    }

    return NextResponse.json({ 
        locked: usersToLock.length, 
        deleted: usersToDelete.length 
    });
}