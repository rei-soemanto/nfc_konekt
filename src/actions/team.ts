'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { randomBytes, randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'

// Helper
function generateSlug(name: string) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const suffix = randomBytes(3).toString('hex');
    return `${base}-${suffix}`;
}

export type TeamMemberDraft = {
    fullName: string
    email: string
}

export async function saveTeamSetupDraft(members: TeamMemberDraft[]) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    await prisma.user.update({
        where: { id: userId },
        data: { tempSetupData: JSON.stringify(members) }
    });

    return { success: true };
}

// NEW: Add Single Member (Used in Team Dashboard)
export async function addMemberToTeam(data: { fullName: string, email: string, writeMethod: 'SELF' | 'ADMIN' }) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    const parent = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: { include: { plan: true } } } // Include plan
    });

    if (!parent || !parent.subscription) throw new Error("Invalid Parent");

    // 1. SELF WRITE (Unchanged)
    if (data.writeMethod === 'SELF') {
        // ... (Keep existing logic)
         const newUser = await prisma.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                password: await bcrypt.hash("Member123!", 10),
                role: 'USER',
                accountStatus: 'ACTIVE',
                parentId: userId,
            }
        });

        await prisma.card.create({
            data: {
                slug: generateSlug(data.fullName),
                status: 'ACTIVE',
                userId: newUser.id
            }
        });

        revalidatePath('/dashboard/team');
        return { success: true, message: "Member added successfully." };
    }

    // 2. ADMIN WRITE: Create Transaction Record!
    if (data.writeMethod === 'ADMIN') {
        // A. Create User
        const newUser = await prisma.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                password: await bcrypt.hash("Member123!", 10),
                role: 'USER',
                accountStatus: 'ACTIVE',
                parentId: userId,
            }
        });

        // B. Create Card
        await prisma.card.create({
            data: {
                slug: generateSlug(data.fullName),
                status: 'ACTIVE',
                userId: newUser.id
            }
        });

        // C. CREATE TRANSACTION RECORD (Fixing the bug)
        // We create a "Paid" transaction of 0 amount just to track the shipment request
        await prisma.transaction.create({
            data: {
                userId: userId,
                planId: parent.subscription.planId,
                type: 'SHIPMENT_REQUEST', // Specific type for existing slot usage
                status: 'PAID', // It's part of an existing paid slot
                amount: 0,
                paymentId: `REQ-${randomUUID()}`,
                shippingAddress: parent.subscription.shippingAddress, // Use parent's existing address
                shipmentStatus: 'PROCESSING',
                isNew: true, // Flag admin
                // The manifest
                pendingTeamData: JSON.stringify([{
                    fullName: data.fullName,
                    email: data.email,
                    note: "Existing Slot - Admin Write Request" 
                }])
            }
        });

        revalidatePath('/dashboard/team');
        return { success: true, message: "Shipment request sent to Admin." };
    }
}

export async function removeTeamMember(memberId: string) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    // Security Check: Ensure the user being deleted is actually a child of the requester
    const member = await prisma.user.findUnique({
        where: { id: memberId }
    });

    if (!member || member.parentId !== userId) {
        throw new Error("Unauthorized to remove this member");
    }

    await prisma.user.delete({
        where: { id: memberId }
    });

    revalidatePath('/dashboard/team');
    return { success: true };
}