'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { randomBytes, randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { sendTeamMemberCredentials } from '@/lib/email'
import { PLAN_CONFIG, EXPANSION_PACK_SIZE } from '@/config/plans'

export type AddMemberResult = {
    success: boolean
    message: string
    /**
     * Set only when the account was created but the credentials email could not
     * be delivered. The admin needs to pass this on by hand, otherwise the new
     * member has no way to sign in.
     */
    temporaryPassword?: string
    email?: string
}

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

/**
 * Send the new member their temporary password.
 *
 * Never throws: by the time this runs the account already exists, so a mail
 * failure must not roll anything back — but it must be reported, because
 * without this email the member has no password and cannot sign in.
 */
async function deliverCredentials(params: {
    email: string
    fullName: string
    password: string
    parent: { fullName: string; companyName: string | null; subscription: { endDate: Date | null; plan: { duration: string } | null } | null }
}): Promise<{ sent: boolean }> {
    const { email, fullName, password, parent } = params

    try {
        await sendTeamMemberCredentials({
            email,
            fullName,
            password,
            adminName: parent.fullName,
            companyName: parent.companyName ?? null,
            // The auth page lives at /auth — /auth/login is a 404, so the link in
            // every credentials email sent so far was dead on arrival.
            loginUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth`,
            subscriptionEndDate: parent.subscription?.endDate ?? null,
            planDuration: parent.subscription?.plan?.duration ?? 'MONTHLY',
        })
        return { sent: true }
    } catch (error) {
        console.error(`[deliverCredentials] account exists for ${email} but the credentials email failed`, error)
        return { sent: false }
    }
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
export async function addMemberToTeam(data: { fullName: string, email: string, writeMethod: 'SELF' | 'ADMIN' }): Promise<AddMemberResult> {
    const userId = await getAuthUserId();
    if (!userId) {
        return { success: false, message: "Your session has expired. Sign in again to add a team member." };
    }

    const fullName = data.fullName?.trim();
    const email = data.email?.trim().toLowerCase();

    if (!fullName || !email) {
        return { success: false, message: "Both a full name and an email address are required." };
    }

    const parent = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            subscription: { include: { plan: true } },
            _count: { select: { members: true } },
        }
    });

    if (!parent) {
        return { success: false, message: "Your account could not be found. Please sign in again." };
    }

    // Only the corporate admin owns seats. A team member has a parentId and
    // cannot add people — previously this threw "Invalid Parent" and surfaced as
    // a generic "please try again", which told the user nothing.
    if (parent.parentId) {
        return { success: false, message: "Only your company administrator can add team members." };
    }

    if (!parent.subscription) {
        return { success: false, message: "Adding team members needs an active Corporate plan. Visit Subscription to choose one." };
    }

    if (parent.subscription.status !== 'ACTIVE') {
        return { success: false, message: `Your subscription is ${parent.subscription.status.toLowerCase()}, so new team members cannot be added. Renew it from the Subscription page.` };
    }

    // Seat limit — mirrors the calculation the team page uses to enable this form.
    // The admin occupies one seat, hence the +1.
    const maxUsers = PLAN_CONFIG['CORPORATE'].baseUsers + (parent.subscription.expansionPacks || 0) * EXPANSION_PACK_SIZE;
    const currentUsage = parent._count.members + 1;
    if (currentUsage >= maxUsers) {
        return { success: false, message: `Your plan covers ${maxUsers} people and all ${maxUsers} seats are in use. Buy an expansion pack to add more.` };
    }

    // Email is unique on User; checking first turns a raw P2002 crash into a
    // message that names the actual problem.
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
        return { success: false, message: `${email} already has an NFC Konekt account, so it cannot be added again.` };
    }

    // 1. SELF WRITE (Unchanged)
    if (data.writeMethod === 'SELF') {
        // SECURITY FIX (VULN-004): Generate random password instead of hardcoded default
        const randomPassword = randomBytes(8).toString('base64url').slice(0, 12);

        let newUser;
        try {
            // User + card in one transaction: a member with no card is a broken
            // half-created record that the team page cannot render properly.
            newUser = await prisma.$transaction(async (tx) => {
                const created = await tx.user.create({
                    data: {
                        fullName,
                        email,
                        password: await bcrypt.hash(randomPassword, 10),
                        role: 'USER',
                        accountStatus: 'ACTIVE',
                        emailVerified: true,
                        parentId: userId,
                        companyName: parent.companyName,
                    }
                });

                await tx.card.create({
                    data: {
                        slug: generateSlug(fullName),
                        status: 'ACTIVE',
                        userId: created.id
                    }
                });

                return created;
            });
        } catch (error) {
            console.error('[addMemberToTeam:SELF] failed to create member', error);
            return { success: false, message: `Could not create an account for ${fullName}. No account was created — please try again.` };
        }

        const delivery = await deliverCredentials({ email, fullName, password: randomPassword, parent });

        revalidatePath('/dashboard/team');
        return delivery.sent
            ? { success: true, message: `${fullName} was added and their login details have been emailed to ${email}.` }
            : {
                success: true,
                message: `${fullName} was added, but the email to ${email} could not be sent. Give them this temporary password directly — it will not be shown again.`,
                temporaryPassword: randomPassword,
                email,
            };
    }

    // 2. ADMIN WRITE: Create Transaction Record!
    if (data.writeMethod === 'ADMIN') {
        // A/B. Create User + Card together — a member without a card is a broken
        // half-record the team page cannot render.
        // SECURITY FIX (VULN-004): Generate random password instead of hardcoded default
        const randomPassword = randomBytes(8).toString('base64url').slice(0, 12);

        try {
            await prisma.$transaction(async (tx) => {
                const created = await tx.user.create({
                    data: {
                        fullName,
                        email,
                        password: await bcrypt.hash(randomPassword, 10),
                        role: 'USER',
                        accountStatus: 'ACTIVE',
                        emailVerified: true,
                        parentId: userId,
                        companyName: parent.companyName,
                    }
                });

                await tx.card.create({
                    data: {
                        slug: generateSlug(fullName),
                        status: 'ACTIVE',
                        userId: created.id
                    }
                });
            });
        } catch (error) {
            console.error('[addMemberToTeam:ADMIN] failed to create member', error);
            return { success: false, message: `Could not create an account for ${fullName}. No account was created — please try again.` };
        }

        const delivery = await deliverCredentials({ email, fullName, password: randomPassword, parent });

        // C. CREATE TRANSACTION RECORD (Fixing the bug)
        // We create a "Paid" transaction of 0 amount just to track the shipment request.
        // The member already exists, so a failure here must not report the whole
        // add as failed — it only means the card shipment was not queued.
        let shipmentQueued = true;
        try {
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
                        fullName,
                        email,
                        note: "Existing Slot - Admin Write Request"
                    }])
                }
            });
        } catch (error) {
            shipmentQueued = false;
            console.error('[addMemberToTeam:ADMIN] member created but the shipment request could not be recorded', error);
        }

        revalidatePath('/dashboard/team');

        const shipmentNote = shipmentQueued
            ? 'a card shipment request was sent to the admin'
            : 'the card shipment request could not be recorded — please raise it manually';

        return delivery.sent
            ? { success: true, message: `${fullName} was added and ${shipmentNote}. Their login details have been emailed to ${email}.` }
            : {
                success: true,
                message: `${fullName} was added and ${shipmentNote}, but the email to ${email} could not be sent. Give them this temporary password directly — it will not be shown again.`,
                temporaryPassword: randomPassword,
                email,
            };
    }

    return { success: false, message: `Unknown card write method "${data.writeMethod}". Choose either "I'll write it myself" or "Ask the admin to write it".` };
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