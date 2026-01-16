import type { NextConfig } from "next";

const nextConfig = {
    // 1. Allow larger uploads for Server Actions
    experimental: {
        serverActions: {
            bodySizeLimit: '5mb',
        },
    },
    // 2. Allow specific image domains (optional, prevents other errors)
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
};

export default nextConfig;
