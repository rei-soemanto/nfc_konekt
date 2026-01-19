import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NFCWriterClient from '@/components/ui/pages/team/NFCWriterClient'

export default async function TeamWriterPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    // 1. Fetch User to check role/plan
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
            subscription: { include: { plan: true } },
            // Also fetch current user's card if they want to write their own
            cards: true 
        }
    });

    if (!user) return redirect('/auth/login');

    // 2. Permission Check (Corporate/Company Only)
    const planCategory = user.subscription?.plan?.category;
    if (planCategory !== 'CORPORATE') {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
                <p className="text-gray-500">This feature is available for Corporate plans only.</p>
            </div>
        )
    }

    // 3. Fetch Team Members AND Their Cards
    // We need the 'slug' from the 'Card' model, not the User ID.
    const teamMembers = await prisma.user.findMany({
        where: { parentId: userId },
        include: { cards: true },
        orderBy: { createdAt: 'desc' }
    });

    // 4. Combine Manager (Self) + Team
    // Map them to the format expected by NFCWriterClient
    // CRITICAL: We map 'slug' to card.slug. If no card exists, we fallback to ID or handle empty.
    const membersList = [
        // Add Manager (Self)
        {
            id: user.id,
            name: `${user.fullName} (You)`,
            slug: user.cards[0]?.slug || '' 
        },
        // Add Team Members
        ...teamMembers.map(member => ({
            id: member.id,
            name: member.fullName,
            slug: member.cards[0]?.slug || '' // <--- CRITICAL: Use Card Slug
        }))
    ].filter(m => m.slug !== ''); // Filter out users with no cards to prevent errors

    return (
        <div className="max-w-xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <i className="fa-solid fa-pen-to-square text-indigo-600 mr-3"></i>
                    Write NFC Cards
                </h1>
                <p className="text-gray-500 mt-2 text-sm">
                    Use your Android device to write profile links to blank NFC cards. 
                    Select a team member below and tap the card.
                </p>
            </div>

            {/* Pass the correctly formatted list with SLUGS to the client */}
            <NFCWriterClient members={membersList} />
        </div>
    )
}