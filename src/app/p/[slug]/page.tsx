import { prisma } from '@/lib/prisma'
import PublicProfile from '@/components/ui/pages/public/PublicProfile'
import { notFound } from 'next/navigation'

// 1. Update the type to be a Promise
type Props = {
    params: Promise<{ slug: string }>
}

export default async function CardProfilePage({ params }: Props) {
    // 2. Await the params before accessing slug
    const { slug } = await params;

    // Fetch card and related user info
    const card = await prisma.card.findUnique({
        where: { slug: slug }, // Now slug is a valid string, not undefined
        include: {
            user: {
                include: {
                    socialLinks: true
                }
            }
        }
    });

    if (!card) {
        return notFound();
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

    return <PublicProfile user={userData} slug={slug} />
}