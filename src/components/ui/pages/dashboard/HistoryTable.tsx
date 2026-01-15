'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

type HistoryItem = {
    id: string
    name: string
    role: string
    date: string
    avatar: string
    isFriend: boolean
    type: 'scanned_by_me' | 'scanned_me'
}

export default function HistoryTable({ data }: { data: HistoryItem[] }) {
    const searchParams = useSearchParams()
    // Default to 'scanning' if no param, or use param value
    const defaultTab = searchParams.get('tab') === 'scanned' ? 'scanned_me' : 'scanned_by_me'
    
    const [activeTab, setActiveTab] = useState<'scanned_by_me' | 'scanned_me'>(defaultTab)
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')

    const itemsPerPage = 10
    
    const tabData = data.filter(item => item.type === activeTab)
    const filteredData = tabData.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.role.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const currentData = filteredData.slice(
        (currentPage - 1) * itemsPerPage, 
        currentPage * itemsPerPage
    )

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Connection History</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track your networking interactions.</p>
                </div>
                
                <div className="relative w-full md:w-72">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
                    <input 
                        type="text" 
                        placeholder="Search by name or role..." 
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800 inline-flex mb-6 shadow-sm">
                <button 
                    onClick={() => { setActiveTab('scanned_by_me'); setCurrentPage(1); }}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'scanned_by_me' 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                    <i className="fa-solid fa-qrcode mr-2"></i>
                    Scans Made
                </button>
                <button 
                    onClick={() => { setActiveTab('scanned_me'); setCurrentPage(1); }}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'scanned_me' 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                    <i className="fa-solid fa-mobile-screen mr-2"></i>
                    Scans Received
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-950/50 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User Profile</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {currentData.length > 0 ? (
                                currentData.map((item) => (
                                    <tr key={item.id} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900 dark:to-gray-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs mr-3 border border-indigo-100 dark:border-indigo-900/50">
                                                    {item.avatar}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {item.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                            {item.role}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-500">
                                            <div className="flex items-center">
                                                <i className="fa-regular fa-clock mr-2 text-xs"></i>
                                                {item.date}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {item.isFriend ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30">
                                                    <i className="fa-solid fa-check mr-1.5"></i> 
                                                    Friend
                                                </span>
                                            ) : (
                                                <button className="text-indigo-600 dark:text-indigo-400 hover:text-white hover:bg-indigo-600 dark:hover:bg-indigo-500 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200">
                                                    <i className="fa-solid fa-user-plus mr-1.5"></i> 
                                                    Connect
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <i className="fa-solid fa-inbox text-4xl mb-3 text-gray-300 dark:text-gray-600"></i>
                                            <p>No history found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredData.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-950/30">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Showing <span className="font-bold text-gray-900 dark:text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of {filteredData.length} results
                        </span>
                        <div className="flex gap-2">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <i className="fa-solid fa-chevron-left mr-1"></i> Previous
                            </button>
                            <button 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Next <i className="fa-solid fa-chevron-right ml-1"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}