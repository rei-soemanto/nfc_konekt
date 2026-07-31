/**
 * Session lifetime and post-login redirect helpers.
 *
 * Client-safe: no node-only imports, so `safeNext` / `authUrlFor` can be used
 * from client components when building an /auth link.
 */

/** How long a login lasts. */
export const SESSION_DAYS = 30

/** JWT `exp` claim value - must stay in step with SESSION_MAX_AGE below. */
export const SESSION_JWT_EXPIRY = `${SESSION_DAYS}d`

/** Cookie `maxAge`, in seconds. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * SESSION_DAYS

/** Where a login goes when there is no valid return target. */
export const DEFAULT_POST_LOGIN = '/dashboard'

/** Query-param name for "come back here after signing in". */
export const NEXT_PARAM = 'next'

/** Query-param name carrying "...and connect once you arrive". */
export const CONNECT_PARAM = 'connect'

/**
 * Short-lived cookie that carries the return target across the email
 * verification round trip (sign up -> inbox -> log in), where the original
 * query string is lost.
 */
export const NEXT_COOKIE = 'post_auth_next'
export const NEXT_COOKIE_MAX_AGE = 60 * 30 // 30 minutes

/**
 * True if the string holds a C0/C1 control character. Checked by code point
 * rather than a regex literal so no raw control bytes end up in this source
 * file. A newline here could smuggle an extra header into a redirect.
 */
function hasControlChars(value: string): boolean {
    for (let i = 0; i < value.length; i++) {
        const code = value.charCodeAt(i)
        if (code <= 31 || code === 127) return true
    }
    return false
}

/**
 * Reduce an untrusted `next` value to a safe same-origin path.
 *
 * Rejects anything that could send the user off-site: absolute URLs
 * ("https://evil.example"), protocol-relative ("//evil.example"), and the
 * backslash variants some browsers normalise to "//".
 * Returns DEFAULT_POST_LOGIN when the input is missing or unsafe.
 */
export function safeNext(value: unknown): string {
    if (typeof value !== 'string') return DEFAULT_POST_LOGIN

    const raw = value.trim()
    if (!raw) return DEFAULT_POST_LOGIN

    // Must be a rooted path...
    if (!raw.startsWith('/')) return DEFAULT_POST_LOGIN
    // ...but not protocol-relative, and not a backslash trick.
    if (raw.startsWith('//') || raw.startsWith('/\\')) return DEFAULT_POST_LOGIN
    if (hasControlChars(raw)) return DEFAULT_POST_LOGIN

    return raw
}

/** Build an /auth URL that returns to `next`, optionally auto-connecting. */
export function authUrlFor(next: string, connect = false): string {
    const params = new URLSearchParams({ [NEXT_PARAM]: safeNext(next) })
    if (connect) params.set(CONNECT_PARAM, '1')
    return `/auth?${params.toString()}`
}
