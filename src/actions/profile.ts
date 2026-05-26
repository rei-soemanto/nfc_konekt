'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'

// 1. Update Zod Schema
const profileSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().optional().nullable(),
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
        phone: formData.get('phone'),
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
        let updateData: any = {
            fullName,
            phone,
            companyName,
            companyWebsite,
            bio,
        };

        // Handle explicit manual removal request
        if (removeAvatar === 'true') {
            updateData.avatarUrl = null;
        }

        // --- BINARY FILE UPLOAD HANDLER ---
        const avatarFile = formData.get('avatar') as File | null;
        
        if (avatarFile && avatarFile.size > 0 && typeof avatarFile.arrayBuffer === 'function') {
            // Extract file extension (fallback to jpg if missing)
            const ext = avatarFile.name.split('.').pop() || 'jpg';
            const fileName = `avatar-${userId}-${Date.now()}.${ext}`;
            
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            const filePath = path.join(uploadDir, fileName);

            // Read binary stream data straight out of the Server Action stream
            const bytes = await avatarFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Write raw binary data directly to disk
            await fs.writeFile(filePath, buffer);

            // Set the string value to match your true database column name
            updateData.avatarUrl = `/uploads/${fileName}`;
        }
        // ----------------------------------

        // 4. Handle Social Links
        if (socials) {
            const parsedSocials = JSON.parse(socials);
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