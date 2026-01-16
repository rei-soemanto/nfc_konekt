'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { writeFile } from 'fs/promises'
import path from 'path'

export type ProfileState = {
    message?: string
    success?: boolean
    errors?: {
        fullName?: string[]
        companyName?: string[]
        companyWebsite?: string[]
    }
} | undefined

export async function updateProfile(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
    const userId = await getAuthUserId();
    if (!userId) return { message: "Unauthorized", success: false };

    // 1. Get Text Fields
    const fullName = formData.get('fullName') as string;
    const companyName = formData.get('companyName') as string;
    const companyWebsite = formData.get('companyWebsite') as string;
    const bio = formData.get('bio') as string;
    const socialsRaw = formData.get('socials') as string;
    const shouldRemoveAvatar = formData.get('removeAvatar') === 'true';

    // 2. Handle Profile Picture Upload
    let newAvatarUrl: string | undefined;
    const avatarFile = formData.get('avatar') as File;

    try {
        if (shouldRemoveAvatar) {
            newAvatarUrl = null as any; 
        } 
        else if (avatarFile && avatarFile.size > 0 && avatarFile.name !== 'undefined') {
            
            // Validate Type
            if (!avatarFile.type.startsWith('image/')) {
                return { message: "File must be an image.", success: false };
            }

            // FIX: INCREASE LIMIT TO 5MB (5 * 1024 * 1024)
            if (avatarFile.size > 5 * 1024 * 1024) { 
                return { message: "Image must be smaller than 5MB.", success: false };
            }

            const buffer = Buffer.from(await avatarFile.arrayBuffer());
            const filename = `avatar-${userId}-${Date.now()}${path.extname(avatarFile.name)}`;
            const uploadPath = path.join(process.cwd(), 'public/uploads', filename);

            await writeFile(uploadPath, buffer);
            newAvatarUrl = `/uploads/${filename}`;
        }

        // 3. Update Database
        await prisma.$transaction(async (tx) => {
            const updateData: any = {
                fullName,
                companyName: companyName || null,
                companyWebsite: companyWebsite || null,
                bio: bio || null,
            };

            if (newAvatarUrl !== undefined) {
                updateData.avatarUrl = newAvatarUrl;
            }

            await tx.user.update({
                where: { id: userId },
                data: updateData
            });

            // Update Socials
            let socialLinks = [];
            try { socialLinks = JSON.parse(socialsRaw || '[]'); } catch (e) {}

            await tx.socialLink.deleteMany({ where: { userId } });

            const validLinks = socialLinks.filter((l: any) => l.url && l.url.trim() !== '');
            if (validLinks.length > 0) {
                await tx.socialLink.createMany({
                    data: validLinks.map((l: any) => ({
                        userId,
                        platform: l.platform,
                        url: l.url
                    }))
                });
            }
        });

        revalidatePath('/dashboard/account');
        return { message: "Profile updated successfully!", success: true };

    } catch (error) {
        console.error("Profile Update Error:", error);
        return { message: "Failed to update profile. Please try again.", success: false };
    }
}