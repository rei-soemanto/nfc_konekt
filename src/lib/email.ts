import nodemailer from 'nodemailer'

// SMTP Configuration from environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

/**
 * Escape a value before interpolating it into an HTML email body.
 *
 * NOTE: the two older templates below predate this and interpolate raw. They
 * are left as they are; new templates should escape. Anything that originates
 * as free text (an address an admin typed, a company name a user chose) can
 * otherwise inject markup into the rendered message.
 */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

/**
 * Send a verification email with a branded HTML template.
 */
export async function sendVerificationEmail(email: string, token: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nfckonekt.com'
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 40px 30px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">NFC Konekt</h1>
                                <p style="color: #c7d2fe; margin: 8px 0 0; font-size: 14px;">Digital Business Card Platform</p>
                            </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 22px;">Verify Your Email</h2>
                                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                                    Thank you for creating an NFC Konekt account! Please click the button below to verify your email address and activate your account.
                                </p>
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                    <tr>
                                        <td style="border-radius: 8px; background: linear-gradient(135deg, #4f46e5, #7c3aed);">
                                            <a href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                                                Verify Email Address
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
                                    This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                                </p>
                                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                                <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
                                    If the button doesn't work, copy and paste this link into your browser:<br>
                                    <a href="${verifyUrl}" style="color: #6366f1; word-break: break-all;">${verifyUrl}</a>
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                                <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} NFC Konekt. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `

    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Verify your NFC Konekt account',
        html,
    })
}

/**
 * Send login credentials to a newly created team member.
 */
export async function sendTeamMemberCredentials(params: {
    email: string
    fullName: string
    password: string
    adminName: string
    companyName: string | null
    loginUrl: string
    subscriptionEndDate: Date | null
    planDuration: string
}) {
    const { email, fullName, password, adminName, companyName, loginUrl, subscriptionEndDate, planDuration } = params

    const durationLabels: Record<string, string> = {
        MONTHLY: 'Monthly (30 days)',
        SIX_MONTHS: '6 Months (180 days)',
        YEARLY: 'Yearly (365 days)',
    }
    const durationLabel = durationLabels[planDuration] ?? planDuration

    const expiryLine = subscriptionEndDate
        ? `Your account access is valid until <strong>${subscriptionEndDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> (${durationLabel} plan).`
        : `Your account access duration is <strong>${durationLabel}</strong>.`

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 40px 30px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">NFC Konekt</h1>
                                <p style="color: #c7d2fe; margin: 8px 0 0; font-size: 14px;">Digital Business Card Platform</p>
                            </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #1f2937; margin: 0 0 8px; font-size: 22px;">Welcome to the team, ${fullName}!</h2>
                                <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                                    ${adminName}${companyName ? ` from <strong>${companyName}</strong>` : ''} has added you as a team member on NFC Konekt. Use the credentials below to log in and access your digital business card.
                                </p>

                                <!-- Credentials Box -->
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 24px;">
                                    <tr>
                                        <td style="padding: 24px 28px;">
                                            <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px;">Your Login Credentials</p>
                                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                                        <span style="color: #9ca3af; font-size: 13px;">Email</span><br>
                                                        <span style="color: #111827; font-size: 15px; font-weight: 600;">${email}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <span style="color: #9ca3af; font-size: 13px;">Temporary Password</span><br>
                                                        <span style="color: #111827; font-size: 15px; font-weight: 600; font-family: monospace; background: #e0e7ff; padding: 4px 10px; border-radius: 6px; display: inline-block; margin-top: 4px;">${password}</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <!-- CTA -->
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
                                    <tr>
                                        <td style="border-radius: 8px; background: linear-gradient(135deg, #4f46e5, #7c3aed);">
                                            <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                                                Log In to Your Account
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Expiry Notice -->
                                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
                                    ${expiryLine}
                                </p>

                                <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
                                    For security, please change your password after your first login via <strong>Dashboard &rarr; Account &rarr; Security Settings</strong>.
                                </p>

                                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                                <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
                                    If the button doesn't work, copy and paste this link into your browser:<br>
                                    <a href="${loginUrl}" style="color: #6366f1; word-break: break-all;">${loginUrl}</a>
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                                <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} NFC Konekt. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `

    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `You've been added to ${companyName ?? adminName}'s team on NFC Konekt`,
        html,
    })
}

/**
 * Invite someone who does NOT have an NFC Konekt account yet.
 *
 * Unlike the two templates above, this one goes to a stranger, so it:
 *  - escapes every interpolated value (see escapeHtml)
 *  - ships a plain-text alternative alongside the HTML, which HTML-only mail
 *    does not, and which spam filters weigh
 */
export async function sendInvitationEmail(params: {
    email: string
    inviteUrl: string
    invitedByName: string
    /** Promo code the recipient can use at checkout, if one was attached. */
    promoCode?: string | null
    /** Human description of the offer, e.g. "50% off" or "IDR 25,000 off". */
    promoSummary?: string | null
    /** When the invitation (and any promo) stops being usable. */
    expiresAt: Date
}) {
    const { email, inviteUrl, invitedByName, promoCode, promoSummary, expiresAt } = params

    const safeInviter = escapeHtml(invitedByName)
    const safeUrl = escapeHtml(inviteUrl)
    const safeCode = promoCode ? escapeHtml(promoCode) : null
    const safeSummary = promoSummary ? escapeHtml(promoSummary) : null

    const expiryLabel = expiresAt.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
    })

    const promoBlock = safeCode
        ? `
                                <!-- Promo Box -->
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 24px;">
                                    <tr>
                                        <td style="padding: 24px 28px; text-align: center;">
                                            <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px;">Your Invitation Code</p>
                                            <span style="color: #111827; font-size: 20px; font-weight: 700; font-family: monospace; background: #e0e7ff; padding: 10px 20px; border-radius: 6px; display: inline-block; letter-spacing: 0.08em;">${safeCode}</span>
                                            ${safeSummary ? `<p style="color: #4b5563; font-size: 14px; margin: 14px 0 0;">${safeSummary} when you subscribe.</p>` : ''}
                                            <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">Enter this code at checkout. Valid until ${expiryLabel}.</p>
                                        </td>
                                    </tr>
                                </table>
        `
        : ''

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 40px 30px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">NFC Konekt</h1>
                                <p style="color: #c7d2fe; margin: 8px 0 0; font-size: 14px;">Digital Business Card Platform</p>
                            </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #1f2937; margin: 0 0 8px; font-size: 22px;">You're invited to NFC Konekt</h2>
                                <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                                    Join <strong>NFC Konekt</strong> &mdash; a smart digital business card you share by tapping your phone. Create your profile once, then share it instantly with anyone you meet.
                                </p>

                                <!-- What you get -->
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                    <tr><td style="padding: 6px 0; color: #4b5563; font-size: 14px;">&#10003;&nbsp; A shareable profile at your own link</td></tr>
                                    <tr><td style="padding: 6px 0; color: #4b5563; font-size: 14px;">&#10003;&nbsp; A physical NFC card that opens it with a tap</td></tr>
                                    <tr><td style="padding: 6px 0; color: #4b5563; font-size: 14px;">&#10003;&nbsp; Save every contact you meet, automatically</td></tr>
                                </table>
${promoBlock}
                                <!-- CTA -->
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
                                    <tr>
                                        <td style="border-radius: 8px; background: linear-gradient(135deg, #4f46e5, #7c3aed);">
                                            <a href="${safeUrl}" target="_blank" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                                                Create My Account
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
                                    This invitation expires on ${expiryLabel}. If you weren't expecting it, you can safely ignore this email.
                                </p>

                                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                                <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
                                    If the button doesn't work, copy and paste this link into your browser:<br>
                                    <a href="${safeUrl}" style="color: #6366f1; word-break: break-all;">${safeUrl}</a>
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                                <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} NFC Konekt. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `

    // Plain-text alternative. Uses the RAW values, not the escaped ones - HTML
    // entities would show up literally in a text/plain part.
    const text = [
        'You\'re invited to NFC Konekt',
        '',
        `${invitedByName} has invited you to join NFC Konekt - a smart digital business card you share by tapping your phone.`,
        '',
        ...(promoCode
            ? [
                `Your invitation code: ${promoCode}`,
                ...(promoSummary ? [`${promoSummary} when you subscribe.`] : []),
                'Enter this code at checkout.',
                '',
            ]
            : []),
        'Create your account:',
        inviteUrl,
        '',
        `This invitation expires on ${expiryLabel}.`,
        'If you weren\'t expecting it, you can safely ignore this email.',
        '',
        `(c) ${new Date().getFullYear()} NFC Konekt`,
    ].join('\n')

    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "You're invited to join NFC Konekt",
        text,
        html,
    })
}
