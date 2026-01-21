'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

type CompanyProfileData = {
    scope: string
    speciality: string
    description: string
    logoUrl?: string | null // <--- Add this
}

export async function updateCompanyProfile(data: CompanyProfileData) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    const updateData: any = {
        companyScope: data.scope,
        companySpeciality: data.speciality,
        companyDescription: data.description,
    };

    if (data.logoUrl !== undefined) {
        updateData.companyLogoUrl = data.logoUrl;
    }

    await prisma.user.update({
        where: { id: userId },
        data: updateData
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