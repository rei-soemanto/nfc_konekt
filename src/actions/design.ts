'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// In a real app, you would upload to S3/Cloudinary here.
// For this demo, we'll simulate a file URL or store simple template names.
export async function saveDesignChoice(design: string) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    await prisma.user.update({
        where: { id: userId },
        data: { tempDesignData: design }
    });

    return { success: true };
}

export async function getTempDesign() {
    const userId = await getAuthUserId();
    if (!userId) return null;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tempDesignData: true }
    });

    return user?.tempDesignData || null;
}