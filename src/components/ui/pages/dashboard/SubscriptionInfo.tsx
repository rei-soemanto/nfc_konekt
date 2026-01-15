'use client'

type SubscriptionData = {
    planType: string
    status: string
    startDate: string
    dueDate: string
    remainingDays: number
    progressPercentage: number
}

export default function SubscriptionInfo({ sub }: { sub: SubscriptionData }) {
    const isActive = sub.status === 'ACTIVE'

    return (
        <div className="max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-6 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-indigo-100 text-sm font-medium mb-1 uppercase tracking-wider">Current Plan</p>
                        <h2 className="text-3xl font-bold">{sub.planType}</h2>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-white/20 backdrop-blur-md border border-white/30 text-white`}>
                        {sub.status}
                    </span>
                </div>
            </div>

            {/* Body Content */}
            <div className="p-8 space-y-8">
                {/* Remaining Time Section */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">{sub.remainingDays}</span>
                            <span className="text-gray-500 dark:text-gray-400 ml-2 text-lg">days remaining</span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Renews on <span className="font-semibold text-gray-900 dark:text-white">{sub.dueDate}</span>
                        </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                        <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${sub.progressPercentage}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">Start Date</div>
                        <div className="text-gray-900 dark:text-white font-semibold">{sub.startDate}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">Due Date</div>
                        <div className="text-indigo-600 dark:text-indigo-400 font-semibold">{sub.dueDate}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">Auto-Renewal</div>
                        <div className="text-green-600 dark:text-green-400 font-semibold flex items-center">
                            <i className="fa-solid fa-circle-check mr-2 text-xs"></i> Enabled
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 dark:bg-gray-950/50 px-8 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
                    Cancel Subscription
                </button>
                <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-200 dark:shadow-none">
                    Upgrade Plan
                </button>
            </div>
        </div>
    )
}