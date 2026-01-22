import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth' // Needs to support Token auth
import { ContactService } from '@/services/ContactService'

export async function GET(request: Request) {
    const userId = await getAuthUserId(request); // Updated to read Header
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contacts = await ContactService.getAllContacts(userId);
    return NextResponse.json(contacts);
}