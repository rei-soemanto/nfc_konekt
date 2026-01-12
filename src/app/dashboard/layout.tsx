import { ReactNode } from 'react'
import { logout } from '@/actions/auth'

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Simple Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
                <div className="p-6 border-b border-gray-100">
                    <span className="font-bold text-xl text-blue-600">DigiCard</span>
                </div>
                <nav className="p-4 space-y-2">
                    <a href="/dashboard" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg">Overview</a>
                    <a href="/dashboard/profile" className="block px-4 py-2 text-blue-600 bg-blue-50 font-medium rounded-lg">Profile</a>
                    <a href="/dashboard/cards" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg">My Cards</a>
                    
                    <form action={logout} className="pt-4 mt-4 border-t border-gray-100">
                        <button className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm">
                            Sign Out
                        </button>
                    </form>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}