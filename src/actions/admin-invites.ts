'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/actions/admin'
import { sendInvitationEmail } from '@/lib/email'

/** How long an invitation stays usable, unless a promo expires sooner. */
const INVITE_DAYS = 30

export type SelectablePromo = {
    code: string
    name: string
    /** Pre-rendered label for the dropdown, e.g. "WELCOME50 — 50% off (until 30 June 2026)". */
    label: string
    /** Short offer summary reused in the email body, e.g. "50% off". */
    summary: string
    endDate: Date
}

export type SendInvitationResult = {
    success: boolean
    message: string
    /**
     * Set only when the invitation row was created but the email could not be
     * delivered — the admin needs to pass this link on by hand.
     */
    inviteUrl?: string
}

function describeOffer(type: 'PERCENTAGE' | 'FIXED', value: number): string {
    return type === 'PERCENTAGE'
        ? `${value}% off`
        : `IDR ${value.toLocaleString('id-ID')} off`
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Deliberately permissive: this is a sanity check, not an RFC 5322 parser.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Promo codes that are usable RIGHT NOW — active and inside their date window.
 *
 * `PromoService.getAll()` returns every promo regardless of state, which is
 * correct for the management table but wrong for this dropdown: offering an
 * expired code in an invitation would send the recipient a code that fails at
 * checkout.
 */
export async function getSelectablePromos(): Promise<SelectablePromo[]> {
    await requireAdmin()

    const now = new Date()
    const promos = await prisma.promoCode.findMany({
        where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
        },
        orderBy: { endDate: 'asc' },
        select: { code: true, name: true, type: true, value: true, endDate: true },
    })

    return promos.map((p) => {
        const summary = describeOffer(p.type, p.value)
        return {
            code: p.code,
            name: p.name,
            summary,
            label: `${p.code} — ${summary} (until ${formatDate(p.endDate)})`,
            endDate: p.endDate,
        }
    })
}

export type InvitationRow = {
    id: string
    email: string
    promoCode: string | null
    /**
     * Display status. A stored PENDING row past its expiry is reported as
     * EXPIRED — the stored value is only rewritten when someone registers, so
     * this is resolved here rather than by reading the clock during render.
     */
    status: 'PENDING' | 'ACCEPTED' | 'EXPIRED'
    expiresAt: Date
    createdAt: Date
    invitedByName: string | null
}

/** Recent invitations, newest first, for the admin list. */
export async function getInvitations(limit = 50): Promise<InvitationRow[]> {
    await requireAdmin()

    const rows = await prisma.invitation.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
            id: true,
            email: true,
            promoCode: true,
            status: true,
            expiresAt: true,
            createdAt: true,
            invitedBy: { select: { fullName: true } },
        },
    })

    const now = new Date()
    return rows.map((r) => ({
        id: r.id,
        email: r.email,
        promoCode: r.promoCode,
        status: r.status === 'PENDING' && r.expiresAt < now ? 'EXPIRED' : r.status,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
        invitedByName: r.invitedBy?.fullName ?? null,
    }))
}

/**
 * Deliver the invitation email. Never throws: the Invitation row already exists
 * by the time this runs, so a mail failure must not roll it back — but it must
 * be reported so the admin can share the link manually.
 *
 * Mirrors deliverCredentials() in src/actions/team.ts.
 */
async function deliverInvitation(params: {
    email: string
    inviteUrl: string
    promoCode: string | null
    promoSummary: string | null
    expiresAt: Date
}): Promise<{ sent: boolean }> {
    try {
        await sendInvitationEmail(params)
        return { sent: true }
    } catch (error) {
        console.error(`[deliverInvitation] invitation row exists for ${params.email} but the email failed`, error)
        return { sent: false }
    }
}

export async function sendInvitation(data: {
    email: string
    promoCode?: string | null
}): Promise<SendInvitationResult> {
    let adminId: string
    try {
        adminId = await requireAdmin()
    } catch {
        return { success: false, message: 'Only administrators can send invitations.' }
    }

    const email = data.email?.trim().toLowerCase()
    if (!email || !EMAIL_RE.test(email)) {
        return { success: false, message: 'Enter a valid email address.' }
    }

    // The whole point of this feature is inviting people who are NOT users yet.
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existingUser) {
        return { success: false, message: `${email} already has an NFC Konekt account, so there is nothing to invite them to.` }
    }

    // Don't quietly send a second invitation while the first is still live.
    const now = new Date()
    const pending = await prisma.invitation.findFirst({
        where: { email, status: 'PENDING', expiresAt: { gt: now } },
        select: { expiresAt: true },
    })
    if (pending) {
        return {
            success: false,
            message: `${email} already has an invitation pending until ${formatDate(pending.expiresAt)}. Wait for it to expire before sending another.`,
        }
    }

    // Resolve the promo, if one was chosen, and confirm it is still usable.
    let promoCode: string | null = null
    let promoSummary: string | null = null
    let expiresAt = new Date(now.getTime() + INVITE_DAYS * 24 * 60 * 60 * 1000)

    if (data.promoCode) {
        const promo = await prisma.promoCode.findUnique({
            where: { code: data.promoCode.toUpperCase().trim() },
            select: { code: true, type: true, value: true, isActive: true, startDate: true, endDate: true },
        })

        if (!promo || !promo.isActive || promo.startDate > now || promo.endDate < now) {
            return { success: false, message: `Promo code "${data.promoCode}" is not currently valid, so the invitation was not sent.` }
        }

        promoCode = promo.code
        promoSummary = describeOffer(promo.type, promo.value)

        // Never advertise a code for longer than it actually works.
        if (promo.endDate < expiresAt) {
            expiresAt = promo.endDate
        }
    }

    // No admin lookup here: the invitation copy never names the sender, and
    // `invitedById` below already records who sent it.
    const token = randomBytes(32).toString('hex')

    try {
        await prisma.invitation.create({
            data: { email, promoCode, invitedById: adminId, token, expiresAt },
        })
    } catch (error) {
        console.error('[sendInvitation] could not record the invitation', error)
        return { success: false, message: `Could not record an invitation for ${email}. Nothing was sent — please try again.` }
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth?invite=${token}`

    // No sender name is passed: the invitation speaks as NFC Konekt by design.
    // See the note on sendInvitationEmail.
    const delivery = await deliverInvitation({
        email,
        inviteUrl,
        promoCode,
        promoSummary,
        expiresAt,
    })

    revalidatePath('/dashboard/admin/invites')

    return delivery.sent
        ? {
            success: true,
            message: promoCode
                ? `Invitation sent to ${email} with code ${promoCode}.`
                : `Invitation sent to ${email}.`,
        }
        : {
            success: true,
            message: `The invitation for ${email} was recorded, but the email could not be sent. Share this link with them directly.`,
            inviteUrl,
        }
}
