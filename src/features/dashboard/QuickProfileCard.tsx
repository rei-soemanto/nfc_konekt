'use client'

import { useRouter } from 'next/navigation'

type ProfileCardProps = {
    user: {
        fullName: string
        companyName: string | null
        avatarUrl: string | null
    }
    card: {
        slug: string
        status: string
    } | null
}

export default function QuickProfileCard({ user, card }: ProfileCardProps) {
    const router = useRouter()

    // 1. Handle Card Click (View Public Profile)
    const handleCardClick = () => {
        if (card?.slug) {
            // Open in new tab to "preview" the card
            window.open(`/p/${card.slug}`, '_blank')
        }
    }

    // 2. Handle Edit (Go to Account Page)
    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent parent click
        router.push('/dashboard/account')
    }

    // 3. Handle Share (Web Share API)
    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent parent click
        
        if (!card?.slug) return

        const url = `${window.location.origin}/p/${card.slug}`
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${user.fullName}'s Digital Card`,
                    text: 'Check out my digital business card!',
                    url: url
                })
            } catch (err) {
                console.error("Share failed:", err)
            }
        } else {
            // Fallback: Copy to clipboard
            await navigator.clipboard.writeText(url)
            alert('Profile link copied to clipboard!')
        }
    }

    if (!card) {
        return (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 text-center border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 mb-4">No active card found.</p>
                <button 
                    onClick={handleEdit}
                    className="text-indigo-600 font-bold text-sm hover:underline"
                >
                    Create One
                </button>
            </div>
        )
    }

    return (
        <div 
            onClick={handleCardClick}
            className="group relative bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
        >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all"></div>
            
            <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-6">
                    {/* Dynamic Avatar */}
                    <div className="h-14 w-14 shrink-0 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold border-2 border-white/30 shadow-inner overflow-hidden">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                        ) : (
                            user.fullName.charAt(0).toUpperCase()
                        )}
                    </div>
                    
                    {/* Dynamic Info */}
                    <div className="overflow-hidden">
                        <h3 className="font-bold text-lg truncate leading-tight">{user.fullName}</h3>
                        <p className="text-indigo-100 text-sm truncate opacity-90">{user.companyName || 'NFC Konekt User'}</p>
                        
                        <div className="flex items-center mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                                {card.status} • Public
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleShare}
                        className="flex-1 bg-white text-indigo-600 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-share-nodes"></i>
                        Share
                    </button>
                    <button 
                        onClick={handleEdit}
                        className="flex-1 bg-indigo-500/40 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-500/60 transition-colors border border-indigo-400/30 backdrop-blur-sm flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-pen"></i>
                        Edit
                    </button>
                </div>
            </div>
            
            {/* Hover Hint */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fa-solid fa-arrow-up-right-from-square text-white/50 text-xs"></i>
            </div>
        </div>
    )
}