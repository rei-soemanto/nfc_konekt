import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth' // Import real auth
import PublicProfile from '@/components/ui/pages/public/PublicProfile'
import { notFound } from 'next/navigation'

type Props = {
    params: Promise<{ slug: string }>
}

export default async function CardProfilePage({ params }: Props) {
    const { slug } = await params;
    
    // 1. Get the Current Viewer (Scanner)
    const viewerId = await getAuthUserId();

    // 2. Fetch Card Owner Data
    const card = await prisma.card.findUnique({
        where: { slug: slug },
        include: {
            user: {
                include: {
                    socialLinks: true
                }
            }
        }
    });

    if (!card) return notFound();

    // 3. Status Checks
    const isOwner = viewerId === card.user.id;
    let isFriend = false;

    // 4. Check if they are already friends (only if logged in and not owner)
    if (viewerId && !isOwner) {
        const friendRecord = await prisma.friend.findFirst({
            where: {
                userId: viewerId,
                friendId: card.user.id
            }
        });
        isFriend = !!friendRecord;
    }

    const userData = {
        id: card.user.id,
        fullName: card.user.fullName,
        companyName: card.user.companyName,
        companyWebsite: card.user.companyWebsite,
        bio: card.user.bio,
        avatarUrl: card.user.avatarUrl,
        socialLinks: card.user.socialLinks
    };

    // Pass the new status flags to the component
    return (
        <PublicProfile 
            user={userData} 
            slug={slug} 
            isOwner={isOwner} 
            initialIsFriend={isFriend}
            viewerId={viewerId} // Pass null if anonymous
        />
    )
}