'use server'

import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthService } from '@/services/AuthService' // Import the new Service
import {
    DEFAULT_POST_LOGIN,
    NEXT_COOKIE,
    NEXT_PARAM,
    SESSION_JWT_EXPIRY,
    SESSION_MAX_AGE,
    safeNext,
} from '@/lib/session-config'

export type AuthState = {
    success?: boolean
    message?: string
    errors?: {
        fullName?: string[]
        email?: string[]
        password?: string[]
        companyName?: string[]
    }
} | undefined

// --- 1. LOGIN ACTION ---
export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { message: "Please enter both email and password." }
    }

    // Resolved inside the try, used by the redirect after it — redirect() throws
    // a control-flow signal, so it must never sit inside the try block.
    let destination = DEFAULT_POST_LOGIN

    try {
        // REFACTOR: Use Service instead of direct Prisma/Bcrypt calls
        const user = await AuthService.validateUser(email, password)
        
        if (!user) {
            return { message: "Invalid email or password." }
        }

        // Create Session Token (Web Context uses 'jose' for Edge compatibility)
        // JWT expiry and cookie maxAge are driven by the same constant — if they
        // drift apart the token dies while the cookie lingers, which reads to the
        // user as a silent, unexplained logout.
        const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY)
        const token = await new SignJWT({ userId: user.id, role: user.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime(SESSION_JWT_EXPIRY)
            .sign(secret)

        const cookieStore = await cookies()
        cookieStore.set('session_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: SESSION_MAX_AGE
        })

        // Where to go next: the form field wins, otherwise the cookie dropped when
        // /auth was first opened (that one survives the sign-up -> verify-email ->
        // log-in round trip, where the original query string is lost).
        const fromForm = formData.get(NEXT_PARAM)
        const fromCookie = cookieStore.get(NEXT_COOKIE)?.value
        destination = safeNext(fromForm ?? fromCookie)

        if (fromCookie) {
            cookieStore.delete(NEXT_COOKIE)
        }

    } catch (error) {
        console.error("[login]", error)
        return { message: "Could not sign you in right now. Please try again in a moment." }
    }

    redirect(destination)
}

// --- 2. SIGNUP ACTION ---
export async function signup(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const companyName = formData.get('companyName') as string

    if (!fullName || !email || !password) {
        return { 
            message: "Missing required fields.",
            errors: {
                fullName: !fullName ? ["Name is required"] : [],
                email: !email ? ["Email is required"] : [],
                password: !password ? ["Password is required"] : []
            }
        }
    }

    try {
        // REFACTOR: Use Service to handle check, hash, create, and send verification email
        await AuthService.registerUser({
            fullName,
            email,
            password,
            companyName
        })

        // No auto-login — return success message instead
        return { 
            success: true,
            message: "Account verification email sent, check your email to activate your account" 
        }

    } catch (error: any) {
        console.error("Signup Error:", error)
        
        // Handle specific Service error
        if (error.message === "User already exists") {
            return { 
                message: "User already exists.",
                errors: { email: ["This email is already registered."] } 
            }
        }

        return { message: "Could not create your account. No account was created — please try again." }
    }
}

// --- 3. LOGOUT ACTION ---
export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('session_token')
    redirect('/') 
}