import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { ProfileService } from '@/services/ProfileService'
import fs from 'fs/promises';
import path from 'path';

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

        if (data.photo && typeof data.photo === 'string' && data.photo.startsWith('data:image')) {
            
            // 1. Strip the header (e.g., "data:image/png;base64,") and get the raw data & extension
            const matches = data.photo.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
            
            if (matches && matches.length === 3) {
                const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1]; 
                const base64Data = matches[2];
                const buffer = Buffer.from(base64Data, 'base64');
                
                // 2. Generate a unique filename
                const fileName = `profile-${userId}-${Date.now()}.${extension}`;
                
                // 3. Build the absolute path to your server's public/uploads folder
                const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                const filePath = path.join(uploadDir, fileName);
                
                // 4. Save the physical file to the disk
                await fs.writeFile(filePath, buffer);
                
                // 5. CRITICAL: Overwrite the massive text string in the data object 
                // with the public URL so your database only saves "/uploads/profile-1-123.jpg"
                data.photo = `/uploads/${fileName}`;
            }
        }

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

        // SECURITY FIX (VULN-009): Removed debug console.log("PAYLOAD RECEIVED FROM FRONTEND:", data)
        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error("Profile Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}