// File: app/dashboard/layout.tsx
'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/auth' // Make sure this path is correct

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname()

    const getLinkClass = (path: string) => {
        const isActive = pathname === path
        return isActive 
            ? "block px-4 py-2 text-blue-600 bg-blue-50 font-medium rounded-lg" 
            : "block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors"
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
                <div className="p-6 border-b border-gray-100">
                    <span className="font-bold text-xl text-blue-600">DigiCard</span>
                </div>
                <nav className="p-4 space-y-2">
                    <Link href="/dashboard" className={getLinkClass('/dashboard')}>
                        Overview
                    </Link>
                    <Link href="/dashboard/profile" className={getLinkClass('/dashboard/profile')}>
                        Profile
                    </Link>
                    <Link href="/dashboard/cards" className={getLinkClass('/dashboard/cards')}>
                        My Cards
                    </Link>
                    
                    <form action={logout} className="pt-4 mt-4 border-t border-gray-100">
                        <button className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm transition-colors">
                            Sign Out
                        </button>
                    </form>
                </nav>
            </aside>

            {/* Dashboard Content Area */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    )
}