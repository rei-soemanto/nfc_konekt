import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { TeamService } from '@/services/TeamService'

// PATCH: Update Member
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: memberId } = await params;
    const body = await req.json();

    try {
        const updatedMember = await TeamService.updateMember(userId, memberId, {
            fullName: body.fullName,
            jobTitle: body.jobTitle,
            phone: body.phone
        });

        const { password, ...safeMember } = updatedMember;
        return NextResponse.json({ success: true, data: safeMember });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// DELETE: Remove Member
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: memberId } = await params;

    try {
        await TeamService.removeMember(userId, memberId);
        return NextResponse.json({ success: true, message: "Member removed" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}