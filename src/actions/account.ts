'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hash, compare } from 'bcryptjs'
import { logout } from '@/actions/auth' // Your existing logout action

export async function changePassword(prevState: any, formData: FormData) {
    const userId = await getAuthUserId();
    if (!userId) return { message: "Unauthorized", success: false };

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;

    if (!currentPassword || !newPassword) {
        return { message: "Both fields are required", success: false };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { message: "User not found", success: false };

    // Verify Old Password
    const isValid = await compare(currentPassword, user.password);
    if (!isValid) {
        return { message: "Incorrect current password", success: false };
    }

    // Update Password
    const hashedPassword = await hash(newPassword, 12);
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });

    return { message: "Password updated successfully!", success: true };
}

export async function deleteAccount() {
    const userId = await getAuthUserId();
    if (!userId) return;

    // Perform Safe Delete Logic
    await prisma.$transaction(async (tx) => {
        // 1. Check if user is a Parent (has members)
        const user = await tx.user.findUnique({ 
            where: { id: userId },
            include: { members: true } 
        });

        if (user && user.members.length > 0) {
            // 2. Unlink all children
            // They lose the subscription (because parentId is gone)
            // But their account remains active (status defaults to ACTIVE or you can set to FREE)
            await tx.user.updateMany({
                where: { parentId: userId },
                data: { 
                    parentId: null, 
                    // Optional: You can explicitly set them to a 'Free' status if you have a field for it
                }
            });
        }

        // 3. Delete the User
        // Cascade will handle deleting their OWN cards, subscription, and social links
        await tx.user.delete({
            where: { id: userId }
        });
    });

    // 4. Logout and Redirect
    await logout();
    redirect('/');
}