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

    try {
        const body = await req.json();

        // Extract ONLY role and isHidden
        const { role, isHidden } = body;

        // Validation (Optional but recommended)
        if (role && role !== 'USER' && role !== 'ADMIN') {
            return NextResponse.json({ error: "Invalid Role" }, { status: 400 });
        }

        const updatedMember = await TeamService.updateMember(userId, memberId, {
            role,
            isHidden
        });

        return NextResponse.json({ 
            success: true, 
            message: "Member updated successfully",
            data: {
                ...updatedMember,
                // Return 'isHidden' to frontend for consistency
                isHidden: !updatedMember.isCompanyPublic 
            }
        });

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