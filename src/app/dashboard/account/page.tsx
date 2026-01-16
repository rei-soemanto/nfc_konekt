import { prisma } from '@/lib/prisma'
import ProfileForm from '@/components/ui/pages/dashboard/ProfileForm'
import { redirect } from 'next/navigation'
import { getAuthUserId } from '@/lib/auth';

export default async function AccountPage() {
    const userId = await getAuthUserId();

    if (!userId) {
        redirect('/auth');
    }

    // 1. Fetch Real Data
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            socialLinks: true
        }
    });

    if (!user) {
        redirect('/auth');
    }

    // 2. Format Data
    const userData = {
        fullName: user.fullName,
        email: user.email,
        companyName: user.companyName,
        companyWebsite: user.companyWebsite,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        socialLinks: user.socialLinks.map(link => ({
            platform: link.platform,
            url: link.url
        }))
    };

    return <ProfileForm user={userData} />
}