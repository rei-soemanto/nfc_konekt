'use client'

type DashboardStats = {
    totalScansMade: number
    totalScansReceived: number
    totalFriends: number
    friendConversionRate: number // The percentage you asked for
}

export default function StatsGrid({ stats }: { stats: DashboardStats }) {
    const items = [
        {
            label: "Scans Made",
            value: stats.totalScansMade,
            icon: "fa-qrcode",
            desc: "Cards you have scanned",
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-900/20"
        },
        {
            label: "Scans Received",
            value: stats.totalScansReceived,
            icon: "fa-mobile-screen",
            desc: "People who scanned you",
            color: "text-indigo-500",
            bg: "bg-indigo-50 dark:bg-indigo-900/20"
        },
        {
            label: "Friends Connected",
            value: stats.totalFriends,
            icon: "fa-user-group",
            desc: "Your network size",
            color: "text-violet-500",
            bg: "bg-violet-50 dark:bg-violet-900/20"
        },
        {
            label: "Conversion Rate",
            value: `${stats.friendConversionRate.toFixed(1)}%`,
            icon: "fa-chart-pie",
            desc: "Scanners turned into friends",
            color: "text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-900/20"
        },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {items.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${item.bg} ${item.color}`}>
                            <i className={`fa-solid ${item.icon}`}></i>
                        </div>
                        {/* Optional: Add a small trend indicator here if needed later */}
                        {/* <span className="text-xs font-medium text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">+12%</span> */}
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{item.value}</h3>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}