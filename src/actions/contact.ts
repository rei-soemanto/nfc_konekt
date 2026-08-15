'use server'

import { sendContactMessageEmail } from '@/lib/email'

export type ContactState = {
    success?: boolean
    message?: string
    errors?: {
        name?: string[]
        email?: string[]
        message?: string[]
    }
} | undefined

// Deliberately permissive: a sanity check, not an RFC 5322 parser.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MAX_NAME = 100
const MAX_EMAIL = 254 // RFC 5321 practical maximum
const MAX_MESSAGE = 4000

/**
 * Public contact form -> admin inbox.
 *
 * This is an UNAUTHENTICATED action that causes an email to be sent, i.e. a
 * spam relay if left unguarded. Mitigations here: a hidden honeypot field that
 * real users never fill, hard length caps so the inbox cannot be flooded with
 * megabyte payloads, and full escaping in the template.
 *
 * NOT mitigated: request-rate limiting. That needs shared storage (the app has
 * no Redis) and is worth adding if this ever attracts abuse.
 */
export async function sendContactMessage(prevState: ContactState, formData: FormData): Promise<ContactState> {
    // Honeypot. Hidden from real users via CSS; bots fill every field they find.
    // Report success so an abuser learns nothing from the response.
    const trap = formData.get('company_website')
    if (typeof trap === 'string' && trap.trim() !== '') {
        console.warn('[sendContactMessage] honeypot tripped — dropping submission')
        return { success: true, message: "Thanks! We'll get back to you shortly." }
    }

    const name = (formData.get('name') as string | null)?.trim() ?? ''
    const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? ''
    const message = (formData.get('message') as string | null)?.trim() ?? ''

    const errors: NonNullable<ContactState>['errors'] = {}

    if (!name) errors.name = ['Please tell us your name.']
    else if (name.length > MAX_NAME) errors.name = [`Name must be ${MAX_NAME} characters or fewer.`]

    if (!email) errors.email = ['Please enter your email address.']
    else if (email.length > MAX_EMAIL || !EMAIL_RE.test(email)) errors.email = ['That does not look like a valid email address.']

    if (!message) errors.message = ['Please write a message.']
    else if (message.length > MAX_MESSAGE) errors.message = [`Message must be ${MAX_MESSAGE} characters or fewer.`]

    if (Object.keys(errors).length > 0) {
        return { message: 'Please correct the highlighted fields.', errors }
    }

    try {
        await sendContactMessageEmail({ name, email, message })
    } catch (error) {
        // Nothing is persisted, so there is no partial state to explain — but the
        // sender must be told their message did not get through.
        console.error('[sendContactMessage] could not deliver the contact message', error)
        return {
            message: 'We could not send your message just now. Please try again, or email us directly at nfckonekt@gmail.com.',
        }
    }

    return { success: true, message: "Thanks! Your message is on its way — we'll get back to you shortly." }
}
