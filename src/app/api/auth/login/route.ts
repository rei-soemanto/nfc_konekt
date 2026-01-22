import { NextResponse } from 'next/server'
import { AuthService } from '@/services/AuthService'
import { signToken } from '@/lib/jwt' // Uses the file we created earlier

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
        }

        // 1. Use the Service to validate
        const user = await AuthService.validateUser(email, password);

        if (!user) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        // 2. Generate Token for Mobile (valid for 7 days)
        const token = signToken(user.id);

        // 3. Return JSON
        return NextResponse.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName 
            }
        });

    } catch (error) {
        console.error("Login API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}