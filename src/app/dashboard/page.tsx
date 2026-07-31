import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import StatsGrid from '@/features/dashboard/StatsGrid'
import RecentActivity from '@/features/dashboard/RecentActivity'
import QuickProfileCard from '@/features/dashboard/QuickProfileCard'
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
        redirect('/auth');
    }

    // --- 1. Fetch Raw Data Parallelly ---
    const [
        totalScansMade,
        totalScansReceived,
        totalConnections, // Renamed from totalFriends
        connectionsListRaw, // Renamed from friendsListRaw
        scannersListRaw,
        recentScansMade,
        recentScansReceived,
        currentUser
    ] = await Promise.all([
        prisma.scan.count({ where: { scannerId: userId } }),
        prisma.scan.count({ where: { card: { userId: userId } } }),
        prisma.connection.count({ where: { userId: userId } }), // Updated to Connection model
        
        prisma.connection.findMany({ 
            where: { userId: userId },
            select: { targetId: true } // Only fetch targetId
        }),
        
        prisma.scan.findMany({
            where: { card: { userId: userId } },
            select: { scannerId: true },
            distinct: ['scannerId']
        }),
        
        prisma.scan.findMany({
            where: { scannerId: userId },
            take: 3,
            orderBy: { scannedAt: 'desc' },
            include: { card: { include: { user: true } } }
        }),

        prisma.scan.findMany({
            where: { card: { userId: userId } },
            take: 3,
            orderBy: { scannedAt: 'desc' },
            include: { scanner: true }
        }),

        prisma.user.findUnique({
            where: { id: userId },
            select: {
                fullName: true,
                companyName: true,
                avatarUrl: true,
                cards: {
                    where: { status: 'ACTIVE' },
                    take: 1,
                    select: { slug: true, status: true }
                }
            }
        })
    ]);

    // --- 2. Calculate Data ---
    // Fix: Use 'targetId' instead of 'friendId'
    const connectionIds = new Set(connectionsListRaw.map(c => c.targetId));
    
    const uniqueScanners = scannersListRaw.map(s => s.scannerId);
    // Fix: Filter based on connectionIds
    const scannersWhoAreConnections = uniqueScanners.filter(id => connectionIds.has(id)).length;
    
    const conversionRate = uniqueScanners.length > 0 
        ? (scannersWhoAreConnections / uniqueScanners.length) * 100 
        : 0;

    // Merge Activity
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
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

    const formattedRecent = allRecent.map(item => ({
        ...item,
        timeAgo: timeAgo(item.date)
    }));

    // Prepare User Data for Card
    const userData = currentUser ? {
        fullName: currentUser.fullName,
        companyName: currentUser.companyName,
        avatarUrl: currentUser.avatarUrl
    } : { fullName: 'User', companyName: '', avatarUrl: null };

    const activeCard = currentUser?.cards[0] || null;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's what's happening with your network.</p>
            </div>

            {/*
                Flex column on mobile, 3-col grid from lg up.
                order-* drives the mobile stacking (profile card first); the explicit
                lg:row-start / lg:col-start reproduce the previous desktop layout
                exactly — stats full-width on row 1, activity + sidebar on row 2.
                StatsGrid had to move inside this container so CSS order can reach it;
                order only reorders siblings.
            */}
            <div className="flex flex-col gap-8 lg:grid lg:grid-cols-3">

                {/* Sidebar — first on mobile, right column on desktop */}
                <div className="order-1 space-y-6 lg:col-start-3 lg:row-start-2">

                    {/* Dynamic Quick Profile Card */}
                    <QuickProfileCard user={userData} card={activeCard} />

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
                            <a href="/dashboard/subscription/status" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300">
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center mr-3">
                                    <i className="fa-solid fa-crown text-xs"></i>
                                </div>
                                Manage Plan
                            </a>
                        </div>
                    </div>
                </div>

                {/* Stats — second on mobile, full-width top row on desktop */}
                <div className="order-2 lg:col-span-3 lg:col-start-1 lg:row-start-1">
                    <StatsGrid stats={{
                        totalScansMade,
                        totalScansReceived,
                        totalFriends: totalConnections, // Pass as totalFriends if StatsGrid expects that prop name
                        friendConversionRate: conversionRate
                    }} />
                </div>

                {/* Activity feed — last on mobile, left 2 columns on desktop */}
                <div className="order-3 flex flex-col lg:col-span-2 lg:col-start-1 lg:row-start-2">
                    <RecentActivity activities={formattedRecent} />
                </div>
            </div>
        </div>
    )
}