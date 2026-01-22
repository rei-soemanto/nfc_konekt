import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function getAuthUserId(req?: Request): Promise<string | null> {
    try {
        // 1. Try Header (Mobile/Postman)
        const authHeader = req?.headers.get('Authorization');
        let token = authHeader?.startsWith("Bearer ") ? authHeader.split(' ')[1] : null;

        // 2. Try Cookie (Web) - Only if no header
        if (!token) {
            const cookieStore = await cookies();
            const cookieToken = cookieStore.get('session_token');
            if (cookieToken) token = cookieToken.value;
        }

        if (!token) return null;

        // 3. Verify
        const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
        const { payload } = await jwtVerify(token, secret);
        
        return payload.userId as string;
    } catch (error) {
        // Log error to see if it's an auth crash
        console.error("Auth Token Error:", error); 
        return null;
    }
}