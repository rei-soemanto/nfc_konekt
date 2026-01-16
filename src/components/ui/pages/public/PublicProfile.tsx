'use client'

import { useEffect, useState } from 'react'
import { generateVCard } from '@/lib/vcard'
import { logScan, addFriend } from '@/actions/scan'

type UserProfile = {
    id: string
    fullName: string
    companyName: string | null
    companyWebsite: string | null
    bio: string | null
    avatarUrl: string | null
    socialLinks: { platform: string; url: string }[]
}

export default function PublicProfile({ 
    user, 
    slug, 
    isOwner, 
    initialIsFriend,
    viewerId
}: { 
    user: UserProfile, 
    slug: string,
    isOwner: boolean,
    initialIsFriend: boolean,
    viewerId: string | null
}) {
    const [isFriend, setIsFriend] = useState(initialIsFriend);
    const [loading, setLoading] = useState(false);

    // Only log scan if it's NOT the owner
    useEffect(() => {
        if (!isOwner) {
            logScan(slug);
        }
    }, [slug, isOwner]);

    const handleDownloadVCard = () => {
        const vcardData = generateVCard(user);
        const blob = new Blob([vcardData], { type: 'text/vcard' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${user.fullName.replace(' ', '_')}.vcf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleConnect = async () => {
        if (!viewerId) {
            // Redirect to login if anonymous
            window.location.href = `/auth?redirect=/p/${slug}`;
            return;
        }

        setLoading(true);
        const result = await addFriend(user.id);
        setLoading(false);

        if (result.success) {
            setIsFriend(true);
        } else {
            alert(result.error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 relative">
                
                {/* Header Banner */}
                <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
                    {/* OWNER BADGE - Visual feedback */}
                    {isOwner && (
                        <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                            <span className="text-xs font-bold text-white flex items-center">
                                <i className="fa-solid fa-eye mr-2"></i> Preview Mode
                            </span>
                        </div>
                    )}

                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                        <div className="h-24 w-24 rounded-full border-4 border-gray-800 bg-gray-700 flex items-center justify-center overflow-hidden">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold text-white">{user.fullName.charAt(0)}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8 text-center">
                    <h1 className="text-2xl font-bold text-white mb-1">{user.fullName}</h1>
                    <p className="text-indigo-400 font-medium mb-4">{user.companyName}</p>
                    
                    {user.bio && (
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">"{user.bio}"</p>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button 
                            onClick={handleDownloadVCard}
                            className="bg-white text-gray-900 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg"
                        >
                            <i className="fa-solid fa-address-book mr-2"></i>
                            Save Contact
                        </button>
                        
                        <button 
                            onClick={handleConnect}
                            disabled={isFriend || isOwner || loading}
                            className={`py-3 rounded-xl font-bold text-sm transition-colors shadow-lg flex items-center justify-center ${
                                isOwner 
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' 
                                    : isFriend 
                                        ? 'bg-green-600 text-white cursor-default' 
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                        >
                            {loading ? (
                                <i className="fa-solid fa-circle-notch fa-spin"></i>
                            ) : isOwner ? (
                                <><i className="fa-solid fa-user mr-2"></i> It's You</>
                            ) : isFriend ? (
                                <><i className="fa-solid fa-check mr-2"></i> Connected</>
                            ) : (
                                <><i className="fa-solid fa-user-plus mr-2"></i> Connect</>
                            )}
                        </button>
                    </div>

                    {/* Social Links... (Keep existing code) */}
                    <div className="space-y-3">
                        {user.socialLinks.map((link, idx) => (
                            <a key={idx} href={link.url} target="_blank" className="flex items-center p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-all border border-gray-700 hover:border-indigo-500/50 group">
                                <span className="text-gray-300 font-medium">{link.platform}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}