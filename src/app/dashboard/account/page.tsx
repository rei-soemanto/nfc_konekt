import { prisma } from '@/lib/prisma'
import ProfileForm from '@/components/ui/pages/dashboard/ProfileForm'
import { redirect } from 'next/navigation'

// --- HELPER: Replace this with your actual Auth Session logic ---
async function getAuthUserId() {
    // FOR TESTING: Returns the first user found. 
    // TODO: Replace with: const session = await auth(); return session?.user?.id;
    const user = await prisma.user.findFirst();
    return user?.id;
}

export default async function AccountPage() {
    const userId = await getAuthUserId();

    if (!userId) {
        redirect('/auth'); // Redirect if not logged in
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

    // 2. Format Data for the Component
    // We map the database shape to the shape expected by ProfileForm
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