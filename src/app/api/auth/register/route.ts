import { NextResponse } from 'next/server'
import { AuthService } from '@/services/AuthService'
import { signToken } from '@/lib/jwt'

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fullName, email, password, companyName } = body;

        // Basic Validation
        if (!fullName || !email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Call Service to Create User
        const user = await AuthService.registerUser({ 
            fullName, 
            email, 
            password, 
            companyName 
        });

        // 2. Generate Token for Mobile
        const token = signToken(user.id);

        // 3. Return Success
        return NextResponse.json({
            success: true,
            message: "Account created successfully",
            token: token,
            user: user
        }, { status: 201 });

    } catch (error: any) {
        console.error("Register API Error:", error);
        
        // Handle specific "User already exists" error
        if (error.message === "User already exists") {
            return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}