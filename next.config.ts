import type { NextConfig } from "next";

const nextConfig = {
    // 1. Allow larger uploads for Server Actions.
    //    The user-facing limit is 5MB (see MAX_UPLOAD_BYTES in src/lib/upload.ts),
    //    but the company logo travels as a base64 data URL, which inflates the
    //    payload by ~33% plus the data-URL prefix. 8mb leaves headroom so a
    //    genuine 5MB image is rejected by our own validator with a clear
    //    message, rather than dying at the framework boundary first.
    experimental: {
        serverActions: {
            bodySizeLimit: '8mb',
        },
    },
    // SECURITY FIX (VULN-010): Restrict image domains to known trusted sources
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com', // Google profile avatars
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com', // GitHub avatars
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com', // Cloudinary CDN
            },
            {
                protocol: 'https',
                hostname: 'nfc.thewkm.com', // Own domain
            },
        ],
    },
};

export default nextConfig;
