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

        // Look for the base64 string under either avatarUrl or photo
        const imageString = data.avatarUrl || data.photo;

        if (imageString && typeof imageString === 'string' && imageString.startsWith('data:image')) {

            // 1. Strip header and get details
            const matches = imageString.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);

            if (matches && matches.length === 3) {
                const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                const base64Data = matches[2];
                const buffer = Buffer.from(base64Data, 'base64');

                // 2. Generate a filename matching your old structure
                const fileName = `avatar-${userId}-${Date.now()}.${extension}`;

                // 3. Absolute path to host directory
                const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                const filePath = path.join(uploadDir, fileName);

                // 4. Write to disk
                await fs.writeFile(filePath, buffer);

                // 5. Map to your true DB column name and clean up temp keys
                data.avatarUrl = `/uploads/${fileName}`;
                if (data.photo) delete data.photo;
            }
        }

        let result;
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
        console.error("Profile Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}