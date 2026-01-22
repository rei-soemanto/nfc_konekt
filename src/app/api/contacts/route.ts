import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { ContactService } from '@/services/ContactService'

// GET: List all contacts
export async function GET(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const contacts = await ContactService.getAllContacts(userId);
        return NextResponse.json({ success: true, data: contacts });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST: Add new contact (Manual or Scan)
export async function POST(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        
        // Mobile App Logic:
        // 1. If OCR Scan: Send { name: "...", phone: "..." }
        // 2. If NFC Scan: Send { slug: "slug-from-url" }
        
        const newContact = await ContactService.createContact(userId, body);

        return NextResponse.json({
            success: true,
            message: "Contact saved successfully",
            data: newContact
        });

    } catch (error: any) {
        console.error("Create Contact Error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}