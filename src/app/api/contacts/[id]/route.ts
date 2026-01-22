import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { ContactService } from '@/services/ContactService'

// GET: Single Contact Details
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const result = await ContactService.getContactDetails(id, userId);

    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: result });
}

// PATCH: Update Contact
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    try {
        const updated = await ContactService.updateContact(userId, id, body);
        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// DELETE: Remove Contact
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    try {
        await ContactService.deleteContact(userId, id);
        return NextResponse.json({ success: true, message: "Contact deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}