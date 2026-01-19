'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/auth'

type UserProps = {
    fullName: string
    plan: string 
    avatarUrl: string | null
    role: string
    isInherited: boolean 
}

type NavItem = {
    name: string
    href: string
    icon: string
    badge?: number // <--- NEW: Support for notification count
    children?: { name: string; href: string; icon: string }[]
}

const PLAN_LABELS: Record<string, string> = {
    'PERSONAL': 'Personal',
    'GROUP': 'Group',
    'COMPANY': 'Corporate',
    'CORPORATE': 'Corporate',
}

// Update props to accept newTxCount
export function Sidebar({ user, newTxCount = 0 }: { user: UserProps, newTxCount?: number }) {
    const pathname = usePathname()

    // 1. Base Navigation
    const navItems: NavItem[] = [
        { name: 'Dashboard', href: '/dashboard', icon: 'fa-chart-line' },
        { name: 'History', href: '/dashboard/history', icon: 'fa-clock-rotate-left' },
        { name: 'Friends', href: '/dashboard/friends', icon: 'fa-user-group' },
    ]

    // 2. TEAM FEATURES
    if (!user.isInherited) {
        if (['GROUP', 'COMPANY', 'CORPORATE'].includes(user.plan)) {
            navItems.push({ 
                name: 'My Team', 
                href: '/dashboard/team', 
                icon: 'fa-users-gear' 
            })
        }
        if (['COMPANY', 'CORPORATE'].includes(user.plan)) {
            navItems.push({ 
                name: 'Write Cards', 
                href: '/dashboard/team/writer', 
                icon: 'fa-pen-to-square' 
            })
        }
    }

    // 3. STANDARD MENUS
    navItems.push(
        { 
            name: 'Subscription', 
            href: '/dashboard/subscription/status', 
            icon: 'fa-credit-card', 
            children: [
                { name: 'Status', href: '/dashboard/subscription/status', icon: 'fa-file-invoice' },
                ...(user.isInherited ? [] : [{ name: 'Payment', href: '/dashboard/subscription/payment', icon: 'fa-wallet' }])
            ]
        },
        { name: 'Account', href: '/dashboard/account', icon: 'fa-user-gear' }
    )

    // 4. ADMIN TOOLS
    if (user.role === 'ADMIN') {
        navItems.push(
            {
                name: 'NFC Writer',
                href: '/dashboard/admin/writer',
                icon: 'fa-wand-magic-sparkles' 
            },
            {
                name: 'Manage Plans',
                href: '/dashboard/admin/plans',
                icon: 'fa-list-check' 
            },
            {
                name: 'Manage Users',
                href: '/dashboard/admin/users',
                icon: 'fa-users' 
            },
            {
                name: 'Transactions',
                href: '/dashboard/admin/transactions',
                icon: 'fa-handshake',
                badge: newTxCount // <--- Pass the count here
            }
        )
    }

    const displayPlan = PLAN_LABELS[user.plan] || user.plan || 'Free';

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-colors duration-300 z-40">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center h-16 px-6 border-b border-gray-100 dark:border-gray-800">
                <Link href="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-500 transition-all duration-300 flex items-center">
                    <i className="fa-solid fa-wifi mr-2"></i>
                    NFC Konekt
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || item.children?.some(child => pathname === child.href)
                    
                    return (
                        <div key={item.name} className="relative group">
                            <Link 
                                href={item.href}
                                className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                                    isActive 
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                                }`}
                            >
                                <i className={`fa-solid ${item.icon} w-6 text-center text-lg mr-3 transition-colors ${
                                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                }`}></i>
                                <span className="flex-1">{item.name}</span>
                                
                                {/* NOTIFICATION BADGE */}
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-full shadow-sm">
                                        {item.badge}
                                    </span>
                                )}

                                {item.children && !item.badge && (
                                    <i className="fa-solid fa-chevron-down ml-auto text-xs opacity-50 group-hover:rotate-180 transition-transform duration-200"></i>
                                )}
                            </Link>

                            {/* Dropdown Menu */}
                            {item.children && (
                                <div className="hidden group-hover:block pl-9 mt-1 space-y-1 animation-fade-in">
                                    {item.children.map((child) => {
                                        const isChildActive = pathname === child.href
                                        return (
                                            <Link
                                                key={child.name}
                                                href={child.href}
                                                className={`block px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                                                    isChildActive
                                                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10'
                                                        : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                }`}
                                            >
                                                <i className={`fa-solid ${child.icon} mr-2`}></i>
                                                {child.name}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>

            {/* Footer User Section */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center mb-4 px-2">
                    <div className="shrink-0 h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800 overflow-hidden">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                            <span>{user.fullName.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{user.fullName}</p>
                        
                        <p className={`text-xs truncate font-semibold ${
                            displayPlan === 'Corporate' ? 'text-blue-600 dark:text-blue-400' :
                            displayPlan === 'Group' ? 'text-purple-600 dark:text-purple-400' :
                            'text-gray-500 dark:text-gray-400'
                        }`}>
                            {user.isInherited ? `${displayPlan} (Member)` : displayPlan}
                        </p>
                    </div>
                </div>
                
                <form action={logout}>
                    <button className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-900 transition-all shadow-sm">
                        <i className="fa-solid fa-arrow-right-from-bracket mr-2"></i>
                        Sign Out
                    </button>
                </form>
            </div>
        </aside>
    )
}