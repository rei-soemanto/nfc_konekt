'use client'

import React from 'react'

type Friend = {
    id: string
    fullName: string
    companyName: string | null
    avatarUrl: string | null
    addedAt: string
}

export default function FriendList({ friends }: { friends: Friend[] }) {
    if (friends.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-dashed">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/20 mb-4">
                    <i className="fa-solid fa-user-group text-2xl text-indigo-500"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No friends yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Start scanning cards to add people to your network.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {friends.map((friend) => (
                <div key={friend.id} className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg border-2 border-white dark:border-gray-800 shadow-sm">
                                {friend.avatarUrl ? (
                                    <img src={friend.avatarUrl} alt={friend.fullName} className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    friend.fullName.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div>
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {friend.fullName}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {friend.companyName || 'No Company'}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                            <i className="fa-regular fa-calendar-check mr-2"></i>
                            Added {friend.addedAt}
                        </span>
                        
                        <div className="flex gap-2">
                            <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Message">
                                <i className="fa-regular fa-comment-dots"></i>
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Remove Friend">
                                <i className="fa-solid fa-user-minus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}