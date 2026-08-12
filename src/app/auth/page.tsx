import AuthCard from '@/features/auth/AuthCard'
import { prisma } from '@/lib/prisma'
import { CONNECT_PARAM, NEXT_PARAM, safeNext } from '@/lib/session-config'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value
}

/**
 * Read-only by design.
 *
 * This page must NOT mutate cookies. Next.js only allows that when the request
 * phase is 'action' (Server Actions and Route Handlers); during a page render
 * `cookies()` returns a sealed read-only jar and `.set()` throws
 * ReadonlyRequestCookiesError — "Cookies can only be modified in a Server
 * Action or Route Handler" — which surfaces as a 500.
 *
 * The `post_auth_next` cookie that carries the return target across the
 * sign-up -> inbox -> log-in round trip is therefore written by `signup()` in
 * `src/actions/auth.ts` instead. Plain logins need no cookie at all: the value
 * travels in a hidden form field.
 */
export default async function AuthPage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams

    const next = safeNext(first(params[NEXT_PARAM]))
    const wantsConnect = first(params[CONNECT_PARAM]) === '1'

    // Admin invitation link: prefill the address it was sent to and open the
    // Sign Up panel. A DB READ only — see the cookie warning above.
    const inviteToken = first(params.invite)
    let invitedEmail: string | undefined

    if (inviteToken) {
        const invitation = await prisma.invitation.findUnique({
            where: { token: inviteToken },
            select: { email: true, status: true, expiresAt: true },
        })

        // Only prefill for an invitation that is still open. An accepted or
        // expired one silently falls back to a normal signup rather than
        // telling a stranger whether the token is real.
        if (invitation && invitation.status === 'PENDING' && invitation.expiresAt > new Date()) {
            invitedEmail = invitation.email
        }
    }

    return <AuthCard next={next} connectAfter={wantsConnect} invitedEmail={invitedEmail} />
}
