'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/auth'
import { useState, useEffect } from 'react'

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
    badge?: number 
    children?: { name: string; href: string; icon: string }[]
}

const PLAN_LABELS: Record<string, string> = {
    'PERSONAL': 'Personal',
    'GROUP': 'Group',
    'COMPANY': 'Corporate',
    'CORPORATE': 'Corporate',
}

export function Sidebar({ user, newTxCount = 0 }: { user: UserProps, newTxCount?: number }) {
    const pathname = usePathname()
    
    // --- STATE MANAGEMENT ---
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

    // Close menu when route changes
    useEffect(() => setIsMobileOpen(false), [pathname])

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = isMobileOpen ? 'hidden' : 'unset'
    }, [isMobileOpen])

    // Helper to toggle dropdowns
    const toggleSubmenu = (name: string, e: React.MouseEvent) => {
        e.preventDefault(); 
        e.stopPropagation();
        setExpandedItems(prev => ({ ...prev, [name]: !prev[name] }));
    };

    // --- NAVIGATION CONFIG ---
    const navItems: NavItem[] = [
        { name: 'Dashboard', href: '/dashboard', icon: 'fa-chart-line' },
        { name: 'History', href: '/dashboard/history', icon: 'fa-clock-rotate-left' },
        { name: 'Connect', href: '/dashboard/connect', icon: 'fa-user-group' },
        { name: 'Physical Cards', href: '/dashboard/contacts', icon: 'fa-address-book' },
    ]

    if (!user.isInherited) {
        if (['GROUP', 'COMPANY', 'CORPORATE'].includes(user.plan)) {
            navItems.push({ name: 'My Team', href: '/dashboard/team', icon: 'fa-users-gear' })
        }
        if (['COMPANY', 'CORPORATE'].includes(user.plan)) {
            navItems.push({ name: 'Write Cards', href: '/dashboard/team/writer', icon: 'fa-pen-to-square' })
        }
    }

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

    if (user.role === 'ADMIN') {
        navItems.push(
            { name: 'NFC Writer', href: '/dashboard/admin/writer', icon: 'fa-wand-magic-sparkles' },
            { name: 'Manage Plans', href: '/dashboard/admin/plans', icon: 'fa-list-check' },
            { name: 'Promo Codes', href: '/dashboard/admin/promos', icon: 'fa-tags' },
            { name: 'Manage Users', href: '/dashboard/admin/users', icon: 'fa-users' },
            { name: 'Transactions', href: '/dashboard/admin/transactions', icon: 'fa-handshake', badge: newTxCount }
        )
    }

    const displayPlan = PLAN_LABELS[user.plan] || user.plan || 'Free';

    return (
        <>
            {/* ✅ MOBILE HEADER (Fixed Top) */}
            <div className="md:hidden w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center p-4 sticky top-0 z-40 shadow-sm">
                <Link href="/" className="flex items-center text-xl font-bold text-indigo-600 dark:text-indigo-500">
                    <i className="fa-solid fa-wifi mr-2"></i>
                    NFC Konekt
                </Link>
                <button 
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <i className="fa-solid fa-bars text-xl"></i>
                </button>
            </div>

            {/* ✅ MOBILE OVERLAY (Backdrop) */}
            <div 
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
                    isMobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                onClick={() => setIsMobileOpen(false)}
            />

            {/* ✅ SIDEBAR CONTAINER */}
            <aside className={`
                fixed md:sticky top-0 left-0 h-screen z-50 
                w-64 bg-white dark:bg-gray-900 
                border-r border-gray-200 dark:border-gray-800 
                flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                
                {/* Header (Desktop Logo / Mobile Close) */}
                <div className="flex-shrink-0 flex items-center justify-between h-16 px-6 border-b border-gray-100 dark:border-gray-800">
                    <Link href="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-500 flex items-center">
                        <i className="fa-solid fa-wifi mr-2"></i>
                        NFC Konekt
                    </Link>
                    <button 
                        onClick={() => setIsMobileOpen(false)} 
                        className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                    {navItems.map((item) => {
                        const hasChildren = item.children && item.children.length > 0;
                        const isExpanded = expandedItems[item.name];
                        
                        // Check active state
                        const isActive = hasChildren 
                            ? item.children?.some(child => pathname === child.href) 
                            : pathname === item.href;

                        // Shared styling classes for both Link and Button
                        const itemClasses = `flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                            isActive 
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`;

                        const iconClasses = `fa-solid ${item.icon} w-6 text-center text-lg mr-3 transition-colors ${
                            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        }`;

                        // ✅ BADGE LOGIC: Render circle ONLY if badge exists AND is > 0
                        const badgeElement = (typeof item.badge === 'number' && item.badge > 0) ? (
                            <span className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-full shadow-sm">
                                {item.badge}
                            </span>
                        ) : null;

                        return (
                            <div key={item.name} className="relative group">
                                
                                {/* 1. HAS CHILDREN? RENDER CLICKABLE TOGGLE BUTTON (No Navigation) */}
                                {hasChildren ? (
                                    <button 
                                        onClick={(e) => toggleSubmenu(item.name, e)}
                                        className={itemClasses}
                                    >
                                        <i className={iconClasses}></i>
                                        <span className="flex-1 text-left">{item.name}</span>
                                        {badgeElement}
                                        <i className={`fa-solid fa-chevron-down ml-auto text-xs opacity-50 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`}></i>
                                    </button>
                                ) : (
                                    
                                /* 2. NO CHILDREN? RENDER STANDARD LINK (Navigate) */
                                    <Link href={item.href} className={itemClasses}>
                                        <i className={iconClasses}></i>
                                        <span className="flex-1">{item.name}</span>
                                        {badgeElement}
                                    </Link>
                                )}

                                {/* ✅ SUBMENU (Accordion Style) */}
                                {hasChildren && (
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                        isExpanded ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'
                                    }`}>
                                        <div className="pl-9 space-y-1">
                                            {item.children!.map((child) => {
                                                const isChildActive = pathname === child.href;
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
        </>
    )
}