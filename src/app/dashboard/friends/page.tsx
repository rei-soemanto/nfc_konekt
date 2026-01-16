import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { acceptFriendRequest, deleteFriend } from '@/actions/friend'
import { redirect } from 'next/navigation'

export default async function FriendsPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/');

    // 1. Fetch Incoming Requests (I am the friendId, status is PENDING)
    const requests = await prisma.friend.findMany({
        where: {
            friendId: userId,
            status: 'PENDING'
        },
        include: { user: true } // Include the sender's details
    });

    // 2. Fetch Active Friends (Accepted connections involved with me)
    const friends = await prisma.friend.findMany({
        where: {
            OR: [
                { userId: userId, status: 'ACCEPTED' },
                { friendId: userId, status: 'ACCEPTED' }
            ]
        },
        include: {
            user: true,
            friend: true
        }
    });

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Network</h1>

            {/* --- INCOMING REQUESTS SECTION --- */}
            {requests.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        Friend Requests <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">{requests.length}</span>
                    </h2>
                    <div className="grid gap-4">
                        {requests.map((req) => (
                            <div key={req.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                                        {req.user.fullName[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{req.user.fullName}</p>
                                        <p className="text-xs text-gray-500">wants to connect</p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <form action={acceptFriendRequest.bind(null, req.id)}>
                                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                            Accept
                                        </button>
                                    </form>
                                    <form action={deleteFriend.bind(null, req.id)}>
                                        <button className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                            Decline
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- FRIENDS LIST SECTION --- */}
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Your Connections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No connections yet. Scan some cards!</p>
                ) : (
                    friends.map((record) => {
                        // Determine which user object is the "Friend" (not me)
                        const friendData = record.userId === userId ? record.friend : record.user;
                        
                        return (
                            <div key={record.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-600">
                                    {friendData.fullName[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{friendData.fullName}</p>
                                    <p className="text-xs text-gray-500">{friendData.companyName || 'No Company'}</p>
                                </div>
                                <div className="ml-auto">
                                    <form action={deleteFriend.bind(null, record.id)}>
                                        <button className="text-gray-400 hover:text-red-500 transition-colors" title="Remove Friend">
                                            <i className="fa-solid fa-user-xmark"></i>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}