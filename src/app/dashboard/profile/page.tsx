import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ui/pages/dashboard/ProfileForm'

export default async function ProfilePage() {
    // 1. Verify Authentication
    const session = await verifySession()
    if (!session || !session.userId) {
        redirect('/login')
    }

    // 2. Fetch User Data
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
            socialLinks: {
                select: { platform: true, url: true }
            }
        }
    })

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
            </div>
            
            <ProfileForm user={user} />
        </div>
    )
}