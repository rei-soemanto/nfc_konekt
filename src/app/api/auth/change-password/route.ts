import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { AuthService } from '@/services/AuthService'

export async function POST(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { oldPassword, newPassword } = body;

        if (!oldPassword || !newPassword) {
            return NextResponse.json({ error: "Both passwords required" }, { status: 400 });
        }

        await AuthService.changePassword(userId, oldPassword, newPassword);
        
        return NextResponse.json({ success: true, message: "Password updated" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}