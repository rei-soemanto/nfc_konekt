import fs from 'fs/promises'
import path from 'path'
import { err, ok, type Result } from '@/lib/result'
import {
    MAX_UPLOAD_BYTES,
    MIME_TO_EXT,
    tooLargeMessage as tooLarge,
    unsupportedTypeMessage as unsupported,
} from '@/lib/upload-limits'

export * from '@/lib/upload-limits'

/**
 * Validate a multipart File (Server Action / FormData path).
 *
 * The extension ALWAYS comes from the MIME allowlist, never from the uploaded
 * filename or the data-URL MIME string — those are attacker-controlled and
 * were previously concatenated straight into the path on disk.
 */
export function validateImageFile(file: File): Result<{ ext: string }> {
    const ext = MIME_TO_EXT[file.type?.toLowerCase() ?? '']
    if (!ext) return err('VALIDATION', unsupported(file.type))
    if (file.size > MAX_UPLOAD_BYTES) return err('VALIDATION', tooLarge(file.size))
    return ok({ ext })
}

const DATA_URL = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,(.+)$/i

/**
 * Parse and validate a base64 data URL (JSON / Server Action payload path).
 * The MIME is matched against the allowlist, so a crafted subtype containing
 * path separators can never reach the filesystem.
 */
export function parseDataUrlImage(input: string): Result<{ buffer: Buffer; ext: string; mime: string }> {
    const matches = input.match(DATA_URL)
    if (!matches) return err('VALIDATION', 'Image must be a base64-encoded data URL.')

    const mime = matches[1].toLowerCase()
    const ext = MIME_TO_EXT[mime]
    if (!ext) return err('VALIDATION', unsupported(mime))

    const buffer = Buffer.from(matches[2], 'base64')
    if (buffer.length === 0) return err('VALIDATION', 'Image data is empty or not valid base64.')
    if (buffer.length > MAX_UPLOAD_BYTES) return err('VALIDATION', tooLarge(buffer.length))

    return ok({ buffer, ext, mime })
}

/** Size guard for a base64 string we intend to store directly (company logo). */
export function validateBase64Size(input: string): Result<{ bytes: number }> {
    const comma = input.indexOf(',')
    const payload = comma >= 0 ? input.slice(comma + 1) : input
    // 4 base64 chars -> 3 bytes, minus padding.
    const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0
    const bytes = Math.floor((payload.length * 3) / 4) - padding
    if (bytes > MAX_UPLOAD_BYTES) return err('VALIDATION', tooLarge(bytes))
    return ok({ bytes })
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

/**
 * Write an upload to public/uploads/, creating the directory if needed and
 * refusing to write anywhere outside it. Returns the public URL path.
 */
export async function writeUpload(fileName: string, buffer: Buffer): Promise<Result<string>> {
    // Collapse any directory component before resolving.
    const safeName = path.basename(fileName)
    const filePath = path.resolve(UPLOAD_DIR, safeName)

    if (filePath !== path.join(path.resolve(UPLOAD_DIR), safeName)) {
        return err('VALIDATION', 'Resolved upload path escaped the uploads directory.')
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    await fs.writeFile(filePath, buffer)
    return ok(`/uploads/${safeName}`)
}

/** Deterministic, injection-free upload filename. */
export function avatarFileName(userId: string, ext: string): string {
    const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '')
    return `avatar-${safeId}-${Date.now()}.${ext}`
}
