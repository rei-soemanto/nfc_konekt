'use client'

import Link from 'next/link'

interface ContactDetailViewProps {
    contact: {
        id: string
        name: string
        email: string | null
        phone: string | null
        company: string | null
        website: string | null
        jobTitle: string | null
        notes: string | null
    }
    registeredProfile: {
        id: string
        fullName: string
        avatarUrl: string | null
        cards: { slug: string }[]
    } | null
}

export default function ContactDetailView({ contact, registeredProfile }: ContactDetailViewProps) {
    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Link href="/dashboard/contacts" className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-2 transition-colors">
                    <i className="fa-solid fa-arrow-left"></i> Back to Contacts
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-indigo-900 dark:to-purple-900 p-8 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold">{contact.name}</h1>
                                
                                {/* Registered Member Badge */}
                                {registeredProfile && (
                                    <Link 
                                        href={registeredProfile.cards[0] ? `/p/${registeredProfile.cards[0].slug}` : '#'}
                                        className="group flex items-center gap-1.5 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-400/50 rounded-full transition-all cursor-pointer"
                                        title="This person is a registered NFC Konekt user"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-green-100 uppercase tracking-wide group-hover:text-white">
                                            Member
                                        </span>
                                        {registeredProfile.cards.length > 0 && (
                                            <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-green-200 ml-1"></i>
                                        )}
                                    </Link>
                                )}
                            </div>

                            <p className="text-gray-300 text-lg mt-1">{contact.jobTitle}</p>
                            
                            {contact.company && (
                                <div className="mt-4 inline-flex items-center bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium border border-white/10">
                                    <i className="fa-solid fa-building mr-2 text-indigo-300"></i>
                                    {contact.company}
                                </div>
                            )}
                        </div>

                        {/* Avatar Display Logic */}
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl border border-white/10 overflow-hidden shadow-inner">
                            {registeredProfile?.avatarUrl ? (
                                <img 
                                    src={registeredProfile.avatarUrl} 
                                    alt={contact.name} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="font-bold">{contact.name.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Details Body */}
                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Information</h3>
                            
                            {/* Email */}
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <i className="fa-solid fa-envelope"></i>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Email Address</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{contact.email || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <i className="fa-solid fa-phone"></i>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Phone Number</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{contact.phone || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Website */}
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <i className="fa-solid fa-globe"></i>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Website</p>
                                    {contact.website ? (
                                        <a href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} target="_blank" className="font-medium text-indigo-600 hover:underline break-all">
                                            {contact.website}
                                        </a>
                                    ) : (
                                        <p className="font-medium text-gray-400">N/A</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scanned Notes</h3>
                            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800 min-h-[160px]">
                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {contact.notes || "No additional text was extracted from the card."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}