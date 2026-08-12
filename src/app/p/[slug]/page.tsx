import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { notFound } from 'next/navigation'
import PublicProfile from '@/features/public/PublicProfile' // Import the Client Component

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    
    // 1. Fetch Basic User Data
    const card = await prisma.card.findUnique({
        where: { slug },
        include: {
            user: { include: { socialLinks: true } }
        }
    });

    if (!card || card.status !== 'ACTIVE') {
        return notFound();
    }

    const targetUser = card.user;
    const viewerId = await getAuthUserId();
    
    // 2. Check Connection Status
    let isConnected = false;

    if (viewerId) {
        const connection = await prisma.connection.findUnique({
            where: { userId_targetId: { userId: viewerId, targetId: targetUser.id } }
        });
        isConnected = !!connection;
    }

    // 3. Sanitize User Data for Client Component
    // Prisma returns Date objects which cannot be passed to Client Components.
    // We map it to the simple type expected by PublicProfile.
    const userForClient = {
        id: targetUser.id,
        fullName: targetUser.fullName,
        email: targetUser.email,
        // Needed for the TEL line in the downloaded vCard and the tap-to-call
        // link on the card. It was fetched but dropped here, so "Save Contact"
        // produced a contact with no number.
        phone: targetUser.phone,
        companyName: targetUser.companyName,
        companyWebsite: targetUser.companyWebsite,
        bio: targetUser.bio,
        avatarUrl: targetUser.avatarUrl,
        socialLinks: targetUser.socialLinks.map(s => ({ 
            platform: s.platform, 
            url: s.url 
        }))
    };

    const isOwner = viewerId === targetUser.id;

    // Back link only for signed-in viewers. Anonymous visitors previously got a
    // link straight into /dashboard/connect, a protected route, which middleware
    // just bounced back to /auth — a dead end.
    const backLink = viewerId ? "/dashboard" : null;

    // 4. Render the Client Component
    return (
        <PublicProfile
            user={userForClient}
            slug={slug}
            isOwner={isOwner}
            initialIsFriend={isConnected}
            viewerId={viewerId}
            backLink={backLink}
        />
    )
}