// src/lib/auth.ts
import { cookies, headers } from 'next/headers'
import { verifyToken } from '@/lib/jwt' // Or however you verify tokens

// 1. Add "?" to make request optional
export async function getAuthUserId(request?: Request) {
    
    // Scenario A: API Route (Mobile) - Check Authorization Header
    if (request) {
        const authHeader = request.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const payload = await verifyToken(token);
            return payload?.userId || null;
        }
    }

    // Scenario B: Web Dashboard (Server Component) - Check Cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('auth_token')?.value; // Or 'next-auth.session-token'
    
    if (sessionToken) {
        const payload = await verifyToken(sessionToken);
        return payload?.userId || null;
    }

    return null;
}