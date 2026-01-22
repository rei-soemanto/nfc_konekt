import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { ProfileService } from '@/services/ProfileService'

// GET: Fetch Data for Edit Screen
export async function GET(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await ProfileService.getFullProfile(userId);
    return NextResponse.json({ success: true, data: profile });
}

// PATCH: Update Profile Fields
export async function PATCH(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { type, ...data } = body;

        let result;
        // Mobile app sends "type" to tell us what to update
        if (type === 'PERSONAL') {
            result = await ProfileService.updatePersonal(userId, data);
        } else if (type === 'CORPORATE') {
            result = await ProfileService.updateCorporate(userId, data);
        } else if (type === 'ADDRESS') {
            result = await ProfileService.updateAddress(userId, data);
        } else {
            return NextResponse.json({ error: "Invalid Update Type" }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}