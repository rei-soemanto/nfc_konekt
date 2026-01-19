'use server'

import { prisma } from '@/lib/prisma'
import { getAdminData } from '@/actions/admin' 
import { revalidatePath } from 'next/cache'
import { UserStatus, SubscriptionStatus, CardStatus } from '@prisma/client'
import { DURATION_CONFIG } from '@/lib/plans'

// 1. Fetch All Users with Relations
export async function getAllUsers() {
    await getAdminData();

    const users = await prisma.user.findMany({
        include: {
            parent: { select: { fullName: true, email: true } },
            subscription: { include: { plan: true } },
            cards: true,
        },
        orderBy: { createdAt: 'desc' }
    });

    // Transform for UI calculation
    return users.map(user => {
        const sub = user.subscription;
        let nextPaymentAmount = 0;
        let nextPaymentDate = null;

        if (sub && sub.plan) {
            // @ts-ignore
            const durationInfo = DURATION_CONFIG[sub.plan.duration] || { months: 1 };
            const expansionCost = sub.plan.expansionPrice * durationInfo.months * sub.expansionPacks;
            nextPaymentAmount = sub.plan.price + expansionCost;
            nextPaymentDate = sub.endDate;
        }

        return {
            ...user,
            nextPaymentAmount,
            nextPaymentDate
        };
    });
}

// 2. Update User Details
export async function updateUserDetails(userId: string, data: {
    accountStatus: UserStatus,
    subscriptionStatus?: SubscriptionStatus,
    expansionPacks?: number,
    cardId?: string,
    cardStatus?: CardStatus
}) {
    await getAdminData();

    await prisma.$transaction(async (tx) => {
        // Update User
        await tx.user.update({
            where: { id: userId },
            data: { accountStatus: data.accountStatus }
        });

        // Update Subscription
        if (data.subscriptionStatus || data.expansionPacks !== undefined) {
            const sub = await tx.subscription.findUnique({ where: { userId } });
            if (sub) {
                await tx.subscription.update({
                    where: { userId },
                    data: {
                        status: data.subscriptionStatus ?? sub.status,
                        expansionPacks: data.expansionPacks ?? sub.expansionPacks
                    }
                });
            }
        }

        // Update Specific Card Status
        if (data.cardId && data.cardStatus) {
            await tx.card.update({
                where: { id: data.cardId },
                data: { status: data.cardStatus }
            });
        }
    });

    revalidatePath('/dashboard/admin/users');
    return { success: true };
}

// 3. Delete User
export async function deleteUser(userId: string) {
    await getAdminData();

    await prisma.user.delete({
        where: { id: userId }
    });

    revalidatePath('/dashboard/admin/users');
    return { success: true };
}