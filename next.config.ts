import type { NextConfig } from "next";

const nextConfig = {
    // 1. Allow larger uploads for Server Actions
    experimental: {
        serverActions: {
            bodySizeLimit: '5mb',
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
