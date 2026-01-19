'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type AddressData = {
    country: string
    region: string
    city: string
    street: string
    postalCode: string
}

export async function saveUserAddress(data: AddressData) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    await prisma.address.upsert({
        where: { userId },
        update: data,
        create: {
            userId,
            ...data
        }
    });

    revalidatePath('/dashboard/account');
    return { success: true };
}

export async function getUserAddress() {
    const userId = await getAuthUserId();
    if (!userId) return null;

    return await prisma.address.findUnique({
        where: { userId }
    });
}