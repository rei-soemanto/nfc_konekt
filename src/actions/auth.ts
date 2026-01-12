'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createSession, deleteSession } from '@/lib/session'
import { redirect } from 'next/navigation'

// 1. Validation Schema (Zod)
// Think of this as Laravel's $request->validate()
const SignupSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    companyName: z.string().optional()
})

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string()
})

// --- REGISTER ACTION ---
export async function signup(prevState: any, formData: FormData) {
    // 1. Validate Input
    const validatedFields = SignupSchema.safeParse({
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        password: formData.get('password'),
        companyName: formData.get('companyName'),
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { fullName, email, password, companyName } = validatedFields.data

    // 2. Check if Email Exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser) {
        return { errors: { email: ['Email already in use.'] } }
    }

    // 3. Hash Password & Create User
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        const newUser = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword,
                companyName
            }
        })

        // 4. Create Session
        await createSession(newUser.id, newUser.role)
    } catch (error) {
        return { message: 'Database Error: Failed to create user.' }
    }

    redirect('/dashboard')
}

// --- LOGIN ACTION ---
export async function login(prevState: any, formData: FormData) {
    // 1. Validate Input
    const validatedFields = LoginSchema.safeParse(Object.fromEntries(formData))

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { email, password } = validatedFields.data

    // 2. Find User
    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        // Security: Don't reveal if user exists or not specifically
        return { message: 'Invalid credentials' } 
    }

    // 3. Compare Password
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        return { message: 'Invalid credentials' }
    }

    // 4. Create Session
    await createSession(user.id, user.role)
    
    redirect('/dashboard')
}

// --- LOGOUT ACTION ---
export async function logout() {
    await deleteSession()
    redirect('/login')
}