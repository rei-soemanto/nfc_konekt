import { NextResponse } from 'next/server'
import { AuthService } from '@/services/AuthService'

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fullName, email, password, companyName } = body;

        // Basic Validation
        if (!fullName || !email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Call Service to Create User (sends verification email internally)
        await AuthService.registerUser({ 
            fullName, 
            email, 
            password, 
            companyName 
        });

        // 2. Return Success — no token, user must verify email first
        return NextResponse.json({
            success: true,
            message: "Account verification email sent, check your email to activate your account",
        }, { status: 201 });

    } catch (error: any) {
        console.error("Register API Error:", error);
        
        // Handle specific "User already exists" error
        if (error.message === "User already exists") {
            return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
        }

        return NextResponse.json({ error: "Could not create your account. Please try again in a moment." }, { status: 500 });
    }
}