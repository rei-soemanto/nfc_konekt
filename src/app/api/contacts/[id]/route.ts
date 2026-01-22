import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth' 
import { ContactService } from '@/services/ContactService' // Reuse the logic!

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // 1. Authenticate (Mobile app sends Token)
    const userId = await getAuthUserId(); 
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 2. Reuse Business Logic
    const data = await ContactService.getContactDetails(id, userId);

    if (!data) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // 3. Return JSON for Mobile App
    return NextResponse.json({
        success: true,
        data: {
            contact: data.contact,
            isRegisteredMember: !!data.registeredProfile,
            registeredProfile: data.registeredProfile
        }
    });
}