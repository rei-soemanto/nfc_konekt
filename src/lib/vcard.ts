export function generateVCard(user: any) {
    // Basic VCard 3.0 Structure
    const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${user.fullName}`,
        `N:${user.fullName.split(' ').reverse().join(';')};;;`,
        `EMAIL;TYPE=INTERNET:${user.email}`,
        user.companyName ? `ORG:${user.companyName}` : '',
        user.companyWebsite ? `URL:${user.companyWebsite}` : '',
        user.bio ? `NOTE:${user.bio}` : '',
        // Social URLs
        ...(user.socialLinks || []).map((s: any) => `X-SOCIALPROFILE;TYPE=${s.platform}:${s.url}`),
        'END:VCARD'
    ];

    return vcard.filter(Boolean).join('\n');
}