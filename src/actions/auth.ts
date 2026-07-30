'use server'

import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthService } from '@/services/AuthService' // Import the new Service

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

    try {
        // REFACTOR: Use Service instead of direct Prisma/Bcrypt calls
        const user = await AuthService.validateUser(email, password)
        
        if (!user) {
            return { message: "Invalid email or password." }
        }

        // Create Session Token (Web Context uses 'jose' for Edge compatibility)
        const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY)
        const token = await new SignJWT({ userId: user.id, role: user.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(secret)

        const cookieStore = await cookies()
        cookieStore.set('session_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        })

    } catch (error) {
        console.error("[login]", error)
        return { message: "Could not sign you in right now. Please try again in a moment." }
    }

    redirect('/dashboard')
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