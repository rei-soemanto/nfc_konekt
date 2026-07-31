import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function getAuthUserId(req?: Request): Promise<string | null> {
    // 1. Try Header (Mobile/Postman)
    const authHeader = req?.headers.get('Authorization');
    let token = authHeader?.startsWith("Bearer ") ? authHeader.split(' ')[1] : null;

    // 2. Try Cookie (Web) - Only if no header.
    //    cookies() throws in a statically-rendered context; that is a "no session
    //    available here" signal, not an auth failure, so it must not be logged as
    //    one — it used to spam the build output on every prerendered page.
    if (!token) {
        try {
            const cookieStore = await cookies();
            token = cookieStore.get('session_token')?.value ?? null;
        } catch {
            return null;
        }
    }

    // Anonymous visitor — an ordinary state, not an error.
    if (!token) return null;

    try {
        // 3. Verify
        const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
        const { payload } = await jwtVerify(token, secret);

        return payload.userId as string;
    } catch {
        // A token WAS presented and failed to verify — expired, tampered with, or
        // signed by a rotated key. Worth a log line, unlike the anonymous case.
        // SECURITY FIX (VULN-009): never log the token or the full JWT error.
        console.warn("[getAuthUserId] rejected a session token (expired or invalid)");
        return null;
    }
}