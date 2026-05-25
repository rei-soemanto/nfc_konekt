import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/services/AuthService'

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        return NextResponse.redirect(`${appUrl}/auth/verify-email?status=invalid`)
    }

    try {
        await AuthService.verifyEmail(token)

        // Redirect to the verify-email page with success status
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        return NextResponse.redirect(`${appUrl}/auth/verify-email?status=success`)

    } catch (error: any) {
        console.error("Email Verification Error:", error.message)

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const status = error.message === "Verification token has expired" ? 'expired' : 'invalid'
        return NextResponse.redirect(`${appUrl}/auth/verify-email?status=${status}`)
    }
}
