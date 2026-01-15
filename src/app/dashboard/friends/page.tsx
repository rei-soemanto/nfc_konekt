import { prisma } from '@/lib/prisma'
import FriendList from '@/components/ui/pages/dashboard/FriendList'
import { redirect } from 'next/navigation'

// Mock Auth Helper (Replace with actual session later)
async function getAuthUserId() {
    const user = await prisma.user.findFirst();
    return user?.id;
}

export default async function FriendsPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth');

    // Fetch friends where I am the 'userId'
    const rawFriends = await prisma.friend.findMany({
        where: { userId: userId },
        include: {
            friend: true // Include the friend's user profile details
        },
        orderBy: { createdAt: 'desc' }
    });

    // Format data for the component
    const formattedFriends = rawFriends.map(f => ({
        id: f.friend.id,
        fullName: f.friend.fullName,
        companyName: f.friend.companyName,
        avatarUrl: f.friend.avatarUrl,
        addedAt: new Date(f.createdAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        })
    }));

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Friends</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">People you have connected with.</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                    <i className="fa-solid fa-user-plus mr-2"></i> Add Friend
                </button>
            </div>
            
            <FriendList friends={formattedFriends} />
        </div>
    )
}