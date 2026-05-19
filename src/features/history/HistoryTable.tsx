'use client'

import { useState } from 'react'
import HistoryAction from './HistoryAction'

type Person = {
    id: string
    fullName: string
    email: string
    jobTitle: string | null
    companyName: string | null
    avatarUrl: string | null
}

type HistoryItem = {
    id: string
    scannedAt: Date
    person: Person
    isConnected: boolean
}

type Props = {
    outbound: HistoryItem[]
    inbound: HistoryItem[]
    hasSubscription: boolean
}

export default function HistoryTable({ outbound, inbound, hasSubscription }: Props) {
    const [activeTab, setActiveTab] = useState<'OUTBOUND' | 'INBOUND'>('OUTBOUND');

    const data = activeTab === 'OUTBOUND' ? outbound : inbound;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            
            {/* TABS */}
            <div className="flex border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setActiveTab('OUTBOUND')}
                    className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${
                        activeTab === 'OUTBOUND' 
                            ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' 
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <i className="fa-solid fa-qrcode mr-2"></i>
                    Scanned By Me
                </button>
                <button
                    onClick={() => setActiveTab('INBOUND')}
                    className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${
                        activeTab === 'INBOUND' 
                            ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' 
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <i className="fa-solid fa-eye mr-2"></i>
                    User Scanning Me
                </button>
            </div>

            {/* CONTENT */}
            <div className="overflow-x-auto">
                {data.length === 0 ? (
                    <div className="p-12 text-center border-dashed border-gray-300 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <i className={`fa-solid ${activeTab === 'OUTBOUND' ? 'fa-camera' : 'fa-user-tag'} text-2xl`}></i>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                            {activeTab === 'OUTBOUND' 
                                ? "You haven't scanned anyone yet." 
                                : "No one has scanned your card yet."}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase font-bold text-xs border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role / Company</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden">
                                                {item.person.avatarUrl ? (
                                                    <img src={item.person.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    item.person.fullName.charAt(0)
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white">{item.person.fullName}</div>
                                                <div className="text-xs text-gray-500">{item.person.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900 dark:text-white font-medium">{item.person.jobTitle || '-'}</div>
                                        <div className="text-xs text-gray-500">{item.person.companyName || 'No Company'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(item.scannedAt).toLocaleDateString('id-ID', { 
                                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                        })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <HistoryAction 
                                            targetUserId={item.person.id}
                                            isConnected={item.isConnected}
                                            hasSubscription={hasSubscription}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}