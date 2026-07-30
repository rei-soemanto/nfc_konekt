import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Default-deny gate for /api/* and /dashboard/*.
 *
 * Before this existed every route self-guarded with getAuthUserId(), which
 * worked but meant a newly added route was public until someone remembered to
 * guard it. This inverts that: a new route is protected unless it is listed
 * below.
 *
 * This is defence in depth, NOT a replacement for the per-route checks —
 * handlers still call getAuthUserId() because middleware cannot do ownership
 * or role checks, and it does not run for direct Server Action invocations.
 */

/** API routes that must stay reachable without a session token. */
const PUBLIC_API_ROUTES = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/verify-email',
    // Authenticates with CRON_SECRET, not a user session.
    '/api/cron/check-subscriptions',
    // Authenticates with a Midtrans SHA-512 signature, not a user session.
    '/api/webhooks/midtrans',
    // Static reference data used by the signup/address forms.
    '/api/locations/countries',
    '/api/locations/states',
    '/api/locations/cities',
]

function isPublicApiRoute(pathname: string): boolean {
    return PUBLIC_API_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
    const authHeader = req.headers.get('authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    const token = bearer ?? req.cookies.get('session_token')?.value

    if (!token) return false

    const secretValue = process.env.JWT_SECRET_KEY
    if (!secretValue) {
        // Fail closed: without the secret we cannot verify anything.
        console.error('[middleware] JWT_SECRET_KEY is not set — denying request')
        return false
    }

    try {
        await jwtVerify(token, new TextEncoder().encode(secretValue))
        return true
    } catch {
        return false
    }
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    if (pathname.startsWith('/api/')) {
        if (isPublicApiRoute(pathname)) return NextResponse.next()

        if (!(await hasValidSession(req))) {
            return NextResponse.json(
                {
                    success: false,
                    code: 'UNAUTHORIZED',
                    error: 'Sign in to access this resource.',
                },
                { status: 401 }
            )
        }
        return NextResponse.next()
    }

    // Dashboard pages: bounce to the auth page, preserving where they were going.
    if (!(await hasValidSession(req))) {
        const loginUrl = new URL('/auth', req.url)
        loginUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/api/:path*', '/dashboard/:path*'],
}
