'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateCompanyProfile(data: { scope: string, speciality: string, description: string }) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    await prisma.user.update({
        where: { id: userId },
        data: {
            companyScope: data.scope,
            companySpeciality: data.speciality,
            companyDescription: data.description
        }
    });

    revalidatePath('/dashboard/account');
    return { success: true };
}

export async function updateEmployeeRole(employeeId: string, jobTitle: string, isPublic: boolean) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    // Security: Ensure this employee actually belongs to the admin
    const employee = await prisma.user.findFirst({
        where: { id: employeeId, parentId: userId }
    });

    if (!employee) throw new Error("Unauthorized or member not found");

    await prisma.user.update({
        where: { id: employeeId },
        data: {
            jobTitle: jobTitle,
            isCompanyPublic: isPublic
        }
    });

    revalidatePath('/dashboard/team');
    return { success: true };
}