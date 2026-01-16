import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import StatsGrid from '@/components/ui/pages/dashboard/StatsGrid'
import RecentActivity from '@/components/ui/pages/dashboard/RecentActivity'
import { redirect } from 'next/navigation'

// Helper for relative time
function timeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const intervals = [
        { label: 'y', seconds: 31536000 },
        { label: 'mo', seconds: 2592000 },
        { label: 'd', seconds: 86400 },
        { label: 'h', seconds: 3600 },
        { label: 'm', seconds: 60 }
    ];
    for (const i of intervals) {
        const count = Math.floor(seconds / i.seconds);
        if (count >= 1) return `${count}${i.label} ago`;
    }
    return 'Just now';
}

export default async function DashboardPage() {
    const userId = await getAuthUserId();

    if (!userId) {
        redirect('/auth'); // Redirect to real login page
    }

    // --- 1. Fetch Raw Data Parallelly ---
    const [
        totalScansMade,
        totalScansReceived,
        totalFriends,
        friendsListRaw, // Needed for conversion calculation
        scannersListRaw, // Needed for conversion calculation
        recentScansMade,
        recentScansReceived
    ] = await Promise.all([
        // Count: Scans I made
        prisma.scan.count({ where: { scannerId: userId } }),
        
        // Count: Scans received on my cards
        prisma.scan.count({ where: { card: { userId: userId } } }),
        
        // Count: My friends
        prisma.friend.count({ where: { userId: userId } }),
        
        // List: IDs of my friends (for calculation)
        prisma.friend.findMany({ 
            where: { userId: userId }, 
            select: { friendId: true } 
        }),
        
        // List: IDs of people who scanned me (distinct, for calculation)
        prisma.scan.findMany({
            where: { card: { userId: userId } },
            select: { scannerId: true },
            distinct: ['scannerId']
        }),
        
        // Recent: Scans I made
        prisma.scan.findMany({
            where: { scannerId: userId },
            take: 3,
            orderBy: { scannedAt: 'desc' },
            include: { card: { include: { user: true } } }
        }),

        // Recent: Scans received
        prisma.scan.findMany({
            where: { card: { userId: userId } },
            take: 3,
            orderBy: { scannedAt: 'desc' },
            include: { scanner: true }
        })
    ]);

    // --- 2. Calculate "Conversion Rate" ---
    // Formula: (Unique Scanners who are also Friends / Total Unique Scanners) * 100
    const friendIds = new Set(friendsListRaw.map(f => f.friendId));
    const uniqueScanners = scannersListRaw.map(s => s.scannerId);
    
    // Count how many scanners are currently in my friend list
    const scannersWhoAreFriends = uniqueScanners.filter(id => friendIds.has(id)).length;
    
    const conversionRate = uniqueScanners.length > 0 
        ? (scannersWhoAreFriends / uniqueScanners.length) * 100 
        : 0;

    // --- 3. Prepare Recent Activity Feed ---
    // Merge both lists, sort by date, and format
    const allRecent = [
        ...recentScansMade.map(s => ({
            id: s.id,
            type: 'scanned_by_me' as const,
            userName: s.card.user.fullName,
            avatarUrl: s.card.user.avatarUrl,
            date: s.scannedAt
        })),
        ...recentScansReceived.map(s => ({
            id: s.id,
            type: 'scanned_me' as const,
            userName: s.scanner.fullName,
            avatarUrl: s.scanner.avatarUrl,
            date: s.scannedAt
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5); // Take top 5 combined

    const formattedRecent = allRecent.map(item => ({
        ...item,
        timeAgo: timeAgo(item.date)
    }));

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's what's happening with your network.</p>
            </div>

            {/* Counters & Percentage */}
            <StatsGrid stats={{
                totalScansMade,
                totalScansReceived,
                totalFriends,
                friendConversionRate: conversionRate
            }} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column (Activity Feed) */}
                <div className="lg:col-span-2 flex flex-col">
                    <RecentActivity activities={formattedRecent} />
                </div>

                {/* Sidebar Column (Quick Actions / Profile Summary) */}
                <div className="space-y-6">
                    {/* Quick Profile Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold border border-white/30">
                                JD
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">My Digital Card</h3>
                                <p className="text-indigo-100 text-xs">active • public</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex-1 bg-white text-indigo-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                                Share
                            </button>
                            <button className="flex-1 bg-indigo-500/50 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-500/70 transition-colors border border-indigo-400/30">
                                Edit
                            </button>
                        </div>
                    </div>

                    {/* Quick Actions List */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <a href="/dashboard/account" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300">
                                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center mr-3">
                                    <i className="fa-solid fa-pen-to-square text-xs"></i>
                                </div>
                                Update Profile
                            </a>
                            <a href="/dashboard/subscription" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300">
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center mr-3">
                                    <i className="fa-solid fa-crown text-xs"></i>
                                </div>
                                Manage Plan
                            </a>
                            <a href="#" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300">
                                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/20 text-teal-500 flex items-center justify-center mr-3">
                                    <i className="fa-solid fa-download text-xs"></i>
                                </div>
                                Download QR Code
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}