export type VCardUser = {
    fullName: string
    email?: string | null
    phone?: string | null
    companyName?: string | null
    companyWebsite?: string | null
    bio?: string | null
    socialLinks?: { platform: string; url: string }[]
}

/**
 * Escape a value for a vCard 3.0 property (RFC 2426 §5).
 *
 * Backslash, semicolon and comma are structural separators, and a raw newline
 * terminates the property line. Interpolating an unescaped value (a bio with a
 * line break, a company name with a comma) corrupts the record and every
 * property after it is silently dropped by the importer.
 */
function escapeValue(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r\n|\r|\n/g, '\\n')
}

/**
 * Split a display name into the vCard N field: Family;Given;Additional;Prefix;Suffix
 */
function structuredName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return ';;;;'

    const family = parts.length > 1 ? parts[parts.length - 1] : ''
    const given = parts[0]
    const additional = parts.slice(1, -1).join(' ')

    return [family, given, additional, '', ''].map(escapeValue).join(';')
}

export function generateVCard(user: VCardUser): string {
    // Basic VCard 3.0 Structure
    const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${escapeValue(user.fullName)}`,
        `N:${structuredName(user.fullName)}`,
        user.email ? `EMAIL;TYPE=INTERNET:${escapeValue(user.email)}` : '',
        // vCard 3.0 TEL syntax. The 4.0 form (TEL;VALUE=uri:tel:+1...) is wrong
        // for a VERSION:3.0 record and is rejected by some importers.
        user.phone ? `TEL;TYPE=CELL:${escapeValue(user.phone)}` : '',
        user.companyName ? `ORG:${escapeValue(user.companyName)}` : '',
        user.companyWebsite ? `URL:${escapeValue(user.companyWebsite)}` : '',
        user.bio ? `NOTE:${escapeValue(user.bio)}` : '',
        // Social URLs
        ...(user.socialLinks || []).map(
            (s) => `X-SOCIALPROFILE;TYPE=${escapeValue(s.platform)}:${escapeValue(s.url)}`
        ),
        'END:VCARD'
    ];

    // RFC 2426 requires CRLF line endings. Joining with bare \n makes strict
    // importers (notably on iOS) reject or truncate the record.
    return vcard.filter(Boolean).join('\r\n');
}
