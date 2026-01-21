'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// 1. Update Zod Schema
const profileSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().optional().nullable(), // Changed from secondaryEmail
    companyName: z.string().optional().nullable(),
    companyWebsite: z.string().url("Invalid URL").optional().nullable().or(z.literal('')),
    bio: z.string().max(500, "Bio cannot exceed 500 characters").optional().nullable(),
    socials: z.string().optional(), // JSON string
    removeAvatar: z.string().optional(), // 'true' or 'false'
})

export async function updateProfile(prevState: any, formData: FormData) {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, message: "Unauthorized" };

    // 2. Parse Data
    const rawData = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'), // Get Phone
        companyName: formData.get('companyName'),
        companyWebsite: formData.get('companyWebsite'),
        bio: formData.get('bio'),
        socials: formData.get('socials'),
        removeAvatar: formData.get('removeAvatar'),
    };

    const validated = profileSchema.safeParse(rawData);

    if (!validated.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validated.error.flatten().fieldErrors
        };
    }

    const { fullName, phone, companyName, companyWebsite, bio, socials, removeAvatar } = validated.data;

    try {
        // 3. Handle Avatar Logic (If you are handling file uploads separately, keep that logic)
        // For this snippet, I focus on the text fields update
        let updateData: any = {
            fullName,
            phone, // Update Phone
            companyName,
            companyWebsite,
            bio,
        };

        if (removeAvatar === 'true') {
            updateData.avatarUrl = null;
        }

        // 4. Handle Social Links
        if (socials) {
            const parsedSocials = JSON.parse(socials);
            // Delete existing and re-create (simplest strategy)
            await prisma.socialLink.deleteMany({ where: { userId } });
            if (parsedSocials.length > 0) {
                await prisma.socialLink.createMany({
                    data: parsedSocials.map((s: any) => ({
                        userId,
                        platform: s.platform,
                        url: s.url
                    }))
                });
            }
        }

        // 5. Update User
        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        revalidatePath('/dashboard/account');
        return { success: true, message: "Profile updated successfully" };

    } catch (error) {
        console.error("Profile Update Error:", error);
        return { success: false, message: "Failed to update profile" };
    }
}