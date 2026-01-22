import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { TeamService } from '@/services/TeamService'

// GET: List Members & Stats
export async function GET(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const members = await TeamService.getTeamMembers(userId);
        const stats = await TeamService.getTeamStats(userId);

        return NextResponse.json({
            success: true,
            data: { members, stats }
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST: Add New Member
export async function POST(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        
        // Basic Validation
        if (!body.fullName || !body.email) {
            return NextResponse.json({ error: "Name and Email are required" }, { status: 400 });
        }

        const newMember = await TeamService.addMember(userId, {
            fullName: body.fullName,
            email: body.email,
            jobTitle: body.jobTitle,
            password: body.password // Optional, Service handles default
        });

        // Strip password before returning
        const { password, ...safeMember } = newMember;

        return NextResponse.json({
            success: true,
            message: "Member added successfully",
            data: safeMember
        });

    } catch (error: any) {
        console.error("Add Member Error:", error);
        return NextResponse.json({ error: error.message || "Failed to add member" }, { status: 400 });
    }
}