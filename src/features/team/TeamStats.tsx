import Link from 'next/link'

type Props = {
    current: number
    max: number
    planName: string
    upgradeUrl?: string
}

export default function TeamStats({ current, max, planName, upgradeUrl }: Props) {
    const percentage = Math.min((current / max) * 100, 100);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Usage Card */}
            <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-500/20">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-indigo-100 text-sm font-medium">Team Usage</p>
                        <h3 className="text-3xl font-bold mt-1">{current} <span className="text-lg opacity-70">/ {max}</span></h3>
                    </div>
                    <div className="p-2 bg-white/20 rounded-lg">
                        <i className="fa-solid fa-users text-xl"></i>
                    </div>
                </div>
                <div className="w-full bg-black/20 rounded-full h-1.5 mt-2">
                    <div 
                        className="bg-white rounded-full h-1.5 transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Plan Info */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <i className="fa-solid fa-crown text-xl"></i>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Plan</p>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[250px]" title={planName}>{planName}</h3>
                    </div>
                </div>
            </div>

            {/* Quick Action */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Need more seats?</p>
                    {upgradeUrl ? (
                        <Link href={upgradeUrl} className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:underline flex items-center">
                            Buy Expansion Pack <i className="fa-solid fa-arrow-right ml-1"></i>
                        </Link>
                    ) : (
                        <span className="text-gray-400 text-sm">Contact Admin</span>
                    )}
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                    <i className="fa-solid fa-layer-group"></i>
                </div>
            </div>
        </div>
    )
}