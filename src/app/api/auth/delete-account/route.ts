import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { AuthService } from '@/services/AuthService'

export async function DELETE(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await AuthService.deleteAccount(userId);
        return NextResponse.json({ success: true, message: "Account deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}