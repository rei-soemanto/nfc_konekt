'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

// Schema includes the "Extra" fields now
const ProfileSchema = z.object({
    fullName: z.string().min(2),
    companyName: z.string().min(1),
    companyWebsite: z.string().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(), // Assumes you handle file upload elsewhere and pass the URL
    socials: z.array(z.object({
        platform: z.string(),
        url: z.string().url()
    })).optional()
})

export async function updateProfile(prevState: any, formData: FormData) {
    // 1. Verify User is Logged In
    const session = await verifySession()
    if (!session || !session.userId) {
        return { message: 'Unauthorized' }
    }

    // 2. Parse Data
    // Note: 'socials' should be passed as a JSON string from the frontend form
    const rawSocials = formData.get('socials') 
        ? JSON.parse(formData.get('socials') as string) 
        : []

    const validatedFields = ProfileSchema.safeParse({
        fullName: formData.get('fullName'),
        companyName: formData.get('companyName'),
        companyWebsite: formData.get('companyWebsite'),
        bio: formData.get('bio'),
        avatarUrl: formData.get('avatarUrl'),
        socials: rawSocials
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const data = validatedFields.data

    try {
        // 3. Perform Update Transaction
        await prisma.$transaction(async (tx) => {

            // Step A: Update basic user details
            await tx.user.update({
                where: { id: session.userId },
                    data: {
                    fullName: data.fullName,
                    companyName: data.companyName,
                    companyWebsite: data.companyWebsite,
                    bio: data.bio,
                    avatarUrl: data.avatarUrl,
                }
            })

            // Step B: Update Socials (Delete old -> Create new)
            // This ensures we don't have stale data if a user removes a link
                if (data.socials) {
                    await tx.socialLink.deleteMany({
                        where: { userId: session.userId }
                    })

                    if (data.socials.length > 0) {
                        await tx.socialLink.createMany({
                            data: data.socials.map((social) => ({
                            userId: session.userId,
                            platform: social.platform,
                            url: social.url
                        }))
                    })
                }
            }
        })

        // 4. Refresh Data
        revalidatePath('/dashboard/profile')
        return { message: 'Profile updated successfully!' }

    } catch (error) {
        console.error(error)
        return { message: 'Failed to update profile.' }
    }
}