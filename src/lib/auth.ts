import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export async function getAuthUserId() {
    const cookieStore = await cookies()
    
    // 1. Check if cookie exists
    // MAKE SURE THIS MATCHES YOUR LOGIN COOKIE NAME
    const token = cookieStore.get('session_token')?.value 

    if (!token) {
        console.log("AUTH DEBUG: No token found in cookies.");
        return null
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY)
        const { payload } = await jwtVerify(token, secret)
        
        console.log("AUTH DEBUG: Verified User:", payload.userId);
        return payload.userId as string
    } catch (error) {
        console.log("AUTH DEBUG: Token verification failed:", error);
        return null
    }
}