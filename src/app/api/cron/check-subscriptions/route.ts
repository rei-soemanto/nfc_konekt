import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    // 1. Security Check
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    if (key !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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