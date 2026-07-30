import { getAuthUserId } from '@/lib/auth'
import { ProfileService } from '@/services/ProfileService'
import { err, fail, ok, toResponse } from '@/lib/result'
import { avatarFileName, parseDataUrlImage, writeUpload } from '@/lib/upload'

// GET: Fetch Data for Edit Screen
export async function GET(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) {
        return toResponse(err('UNAUTHORIZED', 'Sign in to view your profile.'));
    }

    try {
        const profile = await ProfileService.getFullProfile(userId);
        if (!profile) {
            return toResponse(err('NOT_FOUND', 'Your profile could not be found. It may have been deleted.'));
        }
        return toResponse(ok(profile));
    } catch (error) {
        return toResponse(fail('GET /api/profile', error, 'INTERNAL', 'Could not load your profile. Please try again.'));
    }
}

// PATCH: Update Profile Fields
export async function PATCH(req: Request) {
    const userId = await getAuthUserId(req);
    if (!userId) {
        return toResponse(err('UNAUTHORIZED', 'Sign in to update your profile.'));
    }

    let body: { type?: string; [key: string]: unknown } | null;
    try {
        body = await req.json();
    } catch {
        return toResponse(err('VALIDATION', 'Request body is not valid JSON.'));
    }

    const { type, ...data } = body ?? {};

    if (type !== 'PERSONAL' && type !== 'CORPORATE' && type !== 'ADDRESS') {
        return toResponse(err('VALIDATION', `Unknown update type "${type}". Expected PERSONAL, CORPORATE or ADDRESS.`));
    }

    try {
        // Look for the base64 string under either avatarUrl or photo
        const imageString = data.avatarUrl || data.photo;

        if (typeof imageString === 'string' && imageString.startsWith('data:')) {
            // Validates the MIME against an allowlist and enforces the 5MB
            // ceiling on DECODED bytes. The extension comes from the allowlist,
            // never from the request, so it cannot contain path separators.
            const parsed = parseDataUrlImage(imageString);
            if (!parsed.ok) return toResponse(parsed);

            const written = await writeUpload(
                avatarFileName(userId, parsed.data.ext),
                parsed.data.buffer
            );
            if (!written.ok) return toResponse(written);

            data.avatarUrl = written.data;
            if (data.photo) delete data.photo;
        }

        let result;
        if (type === 'PERSONAL') {
            result = await ProfileService.updatePersonal(userId, data);
        } else if (type === 'CORPORATE') {
            result = await ProfileService.updateCorporate(userId, data);
        } else {
            result = await ProfileService.updateAddress(userId, data);
        }

        return toResponse(ok(result));
    } catch (error) {
        // updateCorporate throws when the caller lacks a Corporate plan.
        if (error instanceof Error && error.message.startsWith('Unauthorized')) {
            return toResponse(err('FORBIDDEN', 'A Corporate plan is required to edit company settings.'));
        }
        return toResponse(fail('PATCH /api/profile', error, 'INTERNAL', 'Could not save your profile changes. Please try again.'));
    }
}