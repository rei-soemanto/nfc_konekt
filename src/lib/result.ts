import { NextResponse } from 'next/server'

/**
 * Canonical failure codes for the app. Every failure path picks one of these
 * so callers can branch on `code` instead of string-matching a message.
 */
export type ErrorCode =
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'VALIDATION'
    | 'CONFLICT'
    | 'PAYMENT_FAILED'
    | 'RATE_LIMIT'
    | 'INTERNAL'

export type Result<T> =
    | { ok: true; data: T }
    | { ok: false; code: ErrorCode; message: string }

export function ok<T>(data: T): Result<T> {
    return { ok: true, data }
}

/**
 * `message` is user-facing: it must say what failed and why, and must never
 * carry a stack trace, Prisma metadata or a provider payload.
 */
export function err(code: ErrorCode, message: string): Result<never> {
    return { ok: false, code, message }
}

const STATUS: Record<ErrorCode, number> = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION: 400,
    CONFLICT: 409,
    PAYMENT_FAILED: 402,
    RATE_LIMIT: 429,
    INTERNAL: 500,
}

export function statusFor(code: ErrorCode): number {
    return STATUS[code]
}

/** Serialize a Result into the HTTP response shape used by every API route. */
export function toResponse<T>(result: Result<T>): NextResponse {
    if (result.ok) {
        return NextResponse.json({ success: true, data: result.data })
    }
    return NextResponse.json(
        { success: false, code: result.code, error: result.message },
        { status: statusFor(result.code) }
    )
}

/**
 * Log the real error server-side and return a safe Result for the client.
 * `context` names the operation so the log line is searchable, e.g.
 * `fail('updateCompanyProfile', e, 'INTERNAL', 'Could not save company profile.')`
 */
export function fail(
    context: string,
    cause: unknown,
    code: ErrorCode = 'INTERNAL',
    message = 'An unexpected error occurred. Please try again.'
): Result<never> {
    console.error(`[${context}]`, cause)
    return err(code, message)
}
