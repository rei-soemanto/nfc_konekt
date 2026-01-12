// lib/session.ts
import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.SESSION_SECRET || 'your-secret-key'
const encodedKey = new TextEncoder().encode(secretKey)

type SessionPayload = {
    userId: string
    role: string
    expiresAt: Date
}

export async function createSession(userId: string, role: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // 1. Create the JWT
    const session = await new SignJWT({ userId, role, expiresAt })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey)
    
    // 2. Set the Cookie
    const cookieStore = await cookies()
    cookieStore.set('session', session, {
        httpOnly: true,
        secure: true,
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    })
}

export async function verifySession() {
    const cookieStore = await cookies()
    const cookie = cookieStore.get('session')?.value
    const session = await decrypt(cookie)
    
    if (!session?.userId) {
        return null
    }
    
    return { isAuth: true, userId: String(session.userId), role: String(session.role) }
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}

// Helper: Decrypt JWT
async function decrypt(session: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        })
        return payload
    } catch (error) {
        return null
    }
}