'use client'

type ActivityItem = {
    id: string
    type: 'scanned_me' | 'scanned_by_me' | 'friend_added'
    userName: string
    avatarUrl: string | null
    timeAgo: string
}

export default function RecentActivity({ activities }: { activities: ActivityItem[] }) {
    if (activities.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-800 text-center">
                <p className="text-gray-500 dark:text-gray-400">No recent activity found.</p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex-1">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">View All</button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {activities.map((item) => (
                    <div key={item.id} className="p-4 flex items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        {/* Icon/Avatar */}
                        <div className="shrink-0 mr-4">
                            {item.avatarUrl ? (
                                <img src={item.avatarUrl} alt={item.userName} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 
                                    ${item.type === 'friend_added' ? 'bg-green-100 text-green-600 border-white dark:border-gray-800 dark:bg-green-900/30 dark:text-green-400' : 
                                      item.type === 'scanned_me' ? 'bg-indigo-100 text-indigo-600 border-white dark:border-gray-800 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                      'bg-blue-100 text-blue-600 border-white dark:border-gray-800 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                    {item.userName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.userName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                {item.type === 'friend_added' && <><i className="fa-solid fa-user-plus mr-1.5 text-green-500"></i> Added you as a friend</>}
                                {item.type === 'scanned_me' && <><i className="fa-solid fa-mobile-screen mr-1.5 text-indigo-500"></i> Scanned your card</>}
                                {item.type === 'scanned_by_me' && <><i className="fa-solid fa-qrcode mr-1.5 text-blue-500"></i> You scanned them</>}
                            </p>
                        </div>

                        {/* Time */}
                        <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                            {item.timeAgo}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}