'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { randomBytes, randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { sendTeamMemberCredentials } from '@/lib/email'

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
        // SECURITY FIX (VULN-004): Generate random password instead of hardcoded default
        const randomPassword = randomBytes(8).toString('base64url').slice(0, 12);
        const newUser = await prisma.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                password: await bcrypt.hash(randomPassword, 10),
                role: 'USER',
                accountStatus: 'ACTIVE',
                emailVerified: true,
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

        // The account exists at this point, so a mail failure must not undo it —
        // but it must be reported: without this email the member has no password
        // and cannot sign in.
        let emailSent = true;
        try {
            await sendTeamMemberCredentials({
                email: data.email,
                fullName: data.fullName,
                password: randomPassword,
                adminName: parent.fullName,
                companyName: parent.companyName ?? null,
                loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
                subscriptionEndDate: parent.subscription.endDate ?? null,
                planDuration: parent.subscription.plan?.duration ?? 'MONTHLY',
            })
        } catch (error) {
            emailSent = false;
            console.error(`[addMemberToTeam] account created for ${data.email} but the credentials email failed`, error);
        }

        revalidatePath('/dashboard/team');
        return emailSent
            ? { success: true, message: `${data.fullName} was added and their login details have been emailed to ${data.email}.` }
            : { success: true, message: `${data.fullName} was added, but we could not email their login details to ${data.email}. Use "Resend invitation" so they can sign in.` };
    }

    // 2. ADMIN WRITE: Create Transaction Record!
    if (data.writeMethod === 'ADMIN') {
        // A. Create User
        // SECURITY FIX (VULN-004): Generate random password instead of hardcoded default
        const randomPassword = randomBytes(8).toString('base64url').slice(0, 12);
        const newUser = await prisma.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                password: await bcrypt.hash(randomPassword, 10),
                role: 'USER',
                accountStatus: 'ACTIVE',
                emailVerified: true,
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

        // As above: the account already exists, so report the mail failure
        // instead of swallowing it — otherwise the member cannot sign in.
        let adminWriteEmailSent = true;
        try {
            await sendTeamMemberCredentials({
                email: data.email,
                fullName: data.fullName,
                password: randomPassword,
                adminName: parent.fullName,
                companyName: parent.companyName ?? null,
                loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
                subscriptionEndDate: parent.subscription.endDate ?? null,
                planDuration: parent.subscription.plan?.duration ?? 'MONTHLY',
            })
        } catch (error) {
            adminWriteEmailSent = false;
            console.error(`[addMemberToTeam:ADMIN] account created for ${data.email} but the credentials email failed`, error);
        }

        // C. CREATE TRANSACTION RECORD (Fixing the bug)
        // We create a "Paid" transaction of 0 amount just to track the shipment request
        await prisma.transaction.create({
            data: {
                userId: userId,
                planId: parent.subscription.planId,
                type: 'SHIPMENT_REQUEST', // Specific type for existing slot usage
                status: 'PAID', // It's part of an existing paid slot
                amount: 0,
                cardDesign: "Standard / Existing Plan Design",
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
        return adminWriteEmailSent
            ? { success: true, message: `${data.fullName} was added and a card shipment request was sent to the admin.` }
            : { success: true, message: `${data.fullName} was added and a shipment request was sent, but we could not email their login details to ${data.email}. Use "Resend invitation" so they can sign in.` };
    }
}

export async function removeTeamMember(memberId: string) {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, message: "Unauthorized" };

    // 1. Fetch Member & Validate Parent
    const member = await prisma.user.findUnique({
        where: { id: memberId }
    });

    if (!member || member.parentId !== userId) {
        return { success: false, message: "Unauthorized to remove this member" };
    }

    // 2. CHECK SHIPMENT STATUS
    // Search for any PAID transaction that is currently shipping this user's card
    const activeShipment = await prisma.transaction.findFirst({
        where: {
            status: 'PAID',
            shipmentStatus: { in: ['PROCESSING', 'SHIPPING'] }, // Not ARRIVED yet
            pendingTeamData: {
                contains: member.email // Check if this user is in the manifest
            }
        }
    });

    if (activeShipment) {
        return { 
            success: false, 
            message: `Cannot remove member. A card shipment is currently ${activeShipment.shipmentStatus.toLowerCase()} for this user.` 
        };
    }

    // 3. Delete
    await prisma.user.delete({
        where: { id: memberId }
    });

    revalidatePath('/dashboard/team');
    return { success: true, message: "Member removed successfully" };
}