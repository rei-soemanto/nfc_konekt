/**
 * Upload limits shared by client and server.
 *
 * This module must stay free of node-only imports (fs, path) so client
 * components can import it. The enforcing logic lives in `@/lib/upload`,
 * which is server-only.
 */

/** Hard ceiling for any user-supplied image, applied to DECODED bytes. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const MAX_UPLOAD_LABEL = '5MB'

/**
 * Accepted image types mapped to the extension written to disk.
 *
 * `image/svg+xml` is deliberately absent: an SVG served back from /uploads/
 * executes script on our own origin (stored XSS).
 */
export const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
}

export const ACCEPTED_IMAGE_TYPES = Object.keys(MIME_TO_EXT)

/** `accept` attribute value for file inputs. */
export const ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(',')

export function tooLargeMessage(actualBytes: number): string {
    const mb = (actualBytes / (1024 * 1024)).toFixed(1)
    return `Image is ${mb}MB. Maximum size is ${MAX_UPLOAD_LABEL}.`
}

export function unsupportedTypeMessage(mime: string): string {
    return `Unsupported image type "${mime || 'unknown'}". Allowed: JPEG, PNG, WebP, GIF.`
}
