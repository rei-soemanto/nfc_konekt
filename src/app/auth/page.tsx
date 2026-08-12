import AuthCard from '@/features/auth/AuthCard'
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

    return <AuthCard next={next} connectAfter={wantsConnect} />
}
