'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { err, fail, ok, type Result } from '@/lib/result'
import { validateBase64Size } from '@/lib/upload'
import { ACCEPTED_IMAGE_TYPES, unsupportedTypeMessage } from '@/lib/upload-limits'

type CompanyProfileData = {
    scope: string
    speciality: string
    description: string
    logoUrl?: string | null // <--- Add this
}

export async function updateCompanyProfile(data: CompanyProfileData): Promise<Result<null>> {
    const userId = await getAuthUserId();
    if (!userId) {
        return err('UNAUTHORIZED', 'Sign in to update your company profile.');
    }

    const updateData: any = {
        companyScope: data.scope,
        companySpeciality: data.speciality,
        companyDescription: data.description,
    };

    if (data.logoUrl !== undefined) {
        // The 5MB gate in CompanyProfileForm is a convenience only — this
        // action is directly callable, so the limit is re-checked here against
        // the DECODED byte length of the base64 payload.
        if (typeof data.logoUrl === 'string' && data.logoUrl.startsWith('data:')) {
            const mime = data.logoUrl.slice(5, data.logoUrl.indexOf(';')).toLowerCase();
            if (!ACCEPTED_IMAGE_TYPES.includes(mime)) {
                return err('VALIDATION', unsupportedTypeMessage(mime));
            }
            const sized = validateBase64Size(data.logoUrl);
            if (!sized.ok) return sized;
        }
        updateData.companyLogoUrl = data.logoUrl;
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });
    } catch (error) {
        return fail(
            'updateCompanyProfile',
            error,
            'INTERNAL',
            'Could not save your company profile. Your changes were not applied.'
        );
    }

    revalidatePath('/dashboard/account');
    return ok(null);
}

export async function updateEmployeeRole(
    employeeId: string,
    jobTitle: string,
    isPublic: boolean
): Promise<Result<null>> {
    const userId = await getAuthUserId();
    if (!userId) {
        return err('UNAUTHORIZED', 'Sign in to update a team member.');
    }

    // Security: Ensure this employee actually belongs to the admin
    const employee = await prisma.user.findFirst({
        where: { id: employeeId, parentId: userId },
        select: { id: true }
    });

    if (!employee) {
        return err('FORBIDDEN', 'That team member does not belong to your company.');
    }

    try {
        await prisma.user.update({
            where: { id: employeeId },
            data: {
                jobTitle: jobTitle,
                isCompanyPublic: isPublic
            }
        });
    } catch (error) {
        return fail('updateEmployeeRole', error, 'INTERNAL', 'Could not update that team member. Please try again.');
    }

    revalidatePath('/dashboard/team');
    return ok(null);
}