'use client'

import Link from 'next/link'

type Connection = {
    id: string
    targetId: string
    target: {
        id: string
        fullName: string
        avatarUrl: string | null
        jobTitle: string | null
        companyScope: string | null
        // Removed 'cards' since we don't need slug anymore
    }
}

type Props = {
    isLocked: boolean
    connections: Connection[]
}

export default function ConnectionList({ isLocked, connections }: Props) {
    // --- LOCKED VIEW (No Subscription) ---
    if (isLocked) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 shadow-xl">
                    <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fa-solid fa-lock text-3xl"></i>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Unlock Your Network</h1>
                    <p className="text-gray-500 max-w-lg mx-auto mb-8 text-lg">
                        The <strong>Connect</strong> feature allows you to build a professional network and save profiles. 
                        Upgrade your plan to start saving connections and viewing corporate details.
                    </p>
                    <Link 
                        href="/dashboard/subscription/payment" 
                        className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-lg shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                    >
                        Upgrade Now
                    </Link>
                </div>
            </div>
        )
    }

    // --- NORMAL VIEW ---
    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Connections</h1>
            
            {connections.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">You haven't connected with anyone yet.</p>
                    <p className="text-sm text-gray-400 mt-1">Scan a card to add them instantly.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {connections.map((c) => (
                        <div key={c.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xl font-bold text-indigo-700 dark:text-indigo-400 overflow-hidden shrink-0">
                                {c.target.avatarUrl ? (
                                    <img src={c.target.avatarUrl} className="w-full h-full object-cover" alt={c.target.fullName} />
                                ) : (
                                    c.target.fullName.charAt(0)
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white truncate">{c.target.fullName}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{c.target.jobTitle || 'No Title'}</p>
                                {c.target.companyScope && (
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] rounded uppercase font-bold tracking-wider">
                                        {c.target.companyScope}
                                    </span>
                                )}
                            </div>
                            
                            {/* LINK TO INTERNAL DASHBOARD PAGE */}
                            <Link 
                                href={`/dashboard/connect/${c.targetId}`}
                                className="ml-auto w-10 h-10 flex items-center justify-center text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors"
                            >
                                <i className="fa-solid fa-arrow-right"></i>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}