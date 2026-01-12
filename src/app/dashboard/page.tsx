// app/dashboard/profile/page.tsx (Server Component Example)
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'

async function getProfile() {
    const session = await verifySession()
    if (!session) return null

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
            socialLinks: true // Fetch the socials too
        }
    })
    
    return user
}