'use client'

import { useState } from 'react'
import Link from 'next/link'
import { addToConnect } from '@/actions/connection'

type TeamMember = {
    id: string
    fullName: string
    avatarUrl: string | null
    jobTitle: string | null
    slug: string | null
    isConnected: boolean
    isViewer: boolean
}

type Props = {
    details: {
        scope: string | null
        speciality: string | null
        description: string | null
        logoUrl?: string | null // <--- Added logoUrl
    }
    teamMembers: TeamMember[]
    hasSubscription: boolean
    variant?: 'public' | 'dashboard'
}

export default function CorporateProfileCard({ 
    details, 
    teamMembers, 
    hasSubscription, 
    variant = 'public' 
}: Props) {
    const [membersState, setMembersState] = useState(teamMembers);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    if (!details.scope && !details.description && teamMembers.length === 0) return null;

    const handleConnect = async (memberId: string) => {
        setLoadingId(memberId);
        try {
            const result = await addToConnect(memberId);
            if (result.success) {
                setMembersState(prev => prev.map(m => 
                    m.id === memberId ? { ...m, isConnected: true } : m
                ));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm mt-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {/* Company Logo Display */}
                    {hasSubscription && details.logoUrl ? (
                        <div className="w-8 h-8 rounded-lg bg-white p-0.5 border border-gray-200 overflow-hidden">
                            <img src={details.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <i className="fa-solid fa-building text-indigo-600 text-lg"></i>
                    )}
                    <h3 className="font-bold text-gray-900 dark:text-white">
                        Corporate Overview
                    </h3>
                </div>
                
                {!hasSubscription && (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        <i className="fa-solid fa-lock mr-1"></i> Premium View
                    </span>
                )}
            </div>

            <div className="p-6">
                {hasSubscription ? (
                    <div className="space-y-8">
                        {/* 1. Company Details */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Industry</label>
                                    <p className="font-medium text-gray-900 dark:text-white">{details.scope || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Speciality</label>
                                    <p className="font-medium text-gray-900 dark:text-white">{details.speciality || 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">About</label>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {details.description || 'No description provided.'}
                                </p>
                            </div>
                        </div>

                        {/* 2. Team Members Grid */}
                        {membersState.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <i className="fa-solid fa-users mr-2 text-gray-400"></i>
                                    Meet the Team
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {membersState.map((member) => {
                                        const profileLink = variant === 'dashboard'
                                            ? `/dashboard/connect/${member.id}`
                                            : (member.slug ? `/p/${member.slug}` : '#');

                                        const canClick = variant === 'dashboard' || !!member.slug;

                                        return (
                                            <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors group">
                                                <Link 
                                                    href={profileLink} 
                                                    className={`flex items-center gap-3 flex-1 min-w-0 ${!canClick ? 'cursor-default pointer-events-none' : ''}`}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shadow-sm overflow-hidden border border-gray-200 dark:border-gray-600">
                                                        {member.avatarUrl ? (
                                                            <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            member.fullName.charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">{member.fullName}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.jobTitle || 'Member'}</p>
                                                    </div>
                                                </Link>

                                                {!member.isViewer && (
                                                    <div className="ml-2">
                                                        {member.isConnected ? (
                                                            <span className="text-green-600 text-lg" title="Connected">
                                                                <i className="fa-solid fa-circle-check"></i>
                                                            </span>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleConnect(member.id)}
                                                                disabled={loadingId === member.id}
                                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 dark:border-gray-600 shadow-sm transition-all"
                                                                title="Connect"
                                                            >
                                                                {loadingId === member.id ? (
                                                                    <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                                                                ) : (
                                                                    <i className="fa-solid fa-user-plus text-xs"></i>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Locked View (No changes here)
                    <div className="text-center py-8 relative">
                        {/* ... locked view content ... */}
                        <div className="filter blur-sm select-none opacity-50 space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="h-12 bg-gray-200 rounded"></div>
                                <div className="h-12 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/90 dark:bg-gray-900/90 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 text-center">
                                <p className="font-bold text-gray-900 dark:text-white mb-1">Corporate & Team Details Locked</p>
                                <p className="text-xs text-gray-500 mb-3">Upgrade to view company scope and team roster.</p>
                                <a href="/dashboard/subscription/payment" className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700">
                                    Upgrade Now
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}