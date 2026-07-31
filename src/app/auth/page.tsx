import { cookies } from 'next/headers'
import AuthCard from '@/features/auth/AuthCard'
import {
    CONNECT_PARAM,
    DEFAULT_POST_LOGIN,
    NEXT_COOKIE,
    NEXT_COOKIE_MAX_AGE,
    NEXT_PARAM,
    safeNext,
} from '@/lib/session-config'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value
}

export default async function AuthPage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams

    const next = safeNext(first(params[NEXT_PARAM]))
    const wantsConnect = first(params[CONNECT_PARAM]) === '1'

    // Persist the return target. A sign-up cannot log in until the user has been
    // to their inbox and back, and the original query string does not survive
    // that round trip — the hidden form field covers plain logins, this cookie
    // covers register -> verify -> log in on the same device.
    if (next !== DEFAULT_POST_LOGIN) {
        const separator = next.includes('?') ? '&' : '?'
        const target = wantsConnect ? `${next}${separator}${CONNECT_PARAM}=1` : next

        const cookieStore = await cookies()
        cookieStore.set(NEXT_COOKIE, target, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: NEXT_COOKIE_MAX_AGE,
        })
    }

    return <AuthCard next={next} connectAfter={wantsConnect} />
}
