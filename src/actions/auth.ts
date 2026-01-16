'use server'

import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs' // Ensure you have installed: npm install bcryptjs @types/bcryptjs

export type AuthState = {
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
        const user = await prisma.user.findUnique({ where: { email } })
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return { message: "Invalid email or password." }
        }

        // Create Session Token
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
        console.error("Login Error:", error)
        return { message: "Something went wrong. Please try again." }
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
        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return { 
                message: "User already exists.",
                errors: { email: ["This email is already registered."] } 
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        // Create User & Default Card
        const newUser = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword,
                companyName: companyName || null,
                role: 'USER',
                cards: {
                    create: {
                        slug: fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000),
                        status: 'ACTIVE'
                    }
                }
            }
        })

        // Auto Login
        const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY)
        const token = await new SignJWT({ userId: newUser.id, role: newUser.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(secret)

        const cookieStore = await cookies()
        cookieStore.set('session_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7
        })

    } catch (error) {
        console.error("Signup Error:", error)
        return { message: "Failed to create account." }
    }

    redirect('/dashboard')
}

// --- 3. LOGOUT ACTION ---
export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('session_token')
    redirect('/') // or redirect('/auth') depending on your route
}