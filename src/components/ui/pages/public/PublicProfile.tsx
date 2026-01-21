'use client'

import { useEffect, useState } from 'react'
import { generateVCard } from '@/lib/vcard'
import { logScan, connectUser } from '@/actions/scan'
import Link from 'next/link'

type UserProfile = {
    id: string
    fullName: string
    email: string 
    companyName: string | null
    companyWebsite: string | null
    bio: string | null
    avatarUrl: string | null
    socialLinks: { platform: string; url: string }[]
}

// Ensure Props interface matches exactly what is passed from the server page
export default function PublicProfile({ 
    user, 
    slug, 
    isOwner, 
    initialIsFriend,
    viewerId,
    backLink 
}: { 
    user: UserProfile, 
    slug: string,
    isOwner: boolean,
    initialIsFriend: boolean,
    viewerId: string | null,
    backLink: string 
}) {
    const [isFriend, setIsFriend] = useState(initialIsFriend);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Only log scan if it's not the owner viewing their own card
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
            // Redirect to login if not authenticated, return to this profile after
            window.location.href = `/auth?redirect=/p/${slug}`;
            return;
        }

        setLoading(true);
        const result = await connectUser(user.id);
        setLoading(false);

        if (result.success) {
            setIsFriend(true);
        } else {
            alert(result.error);
        }
    };

    // Helper to format URL for display (removes https:// and trailing slash)
    const formatUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative">

            {/* --- BACK BUTTON (Positioned Absolute to Screen) --- */}
            <Link 
                href={backLink} 
                className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white/80 hover:text-white transition-all border border-white/10 group shadow-lg"
            >
                <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                <span className="text-sm font-medium">Back</span>
            </Link>

            <div className="w-full max-w-lg bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 relative mt-12 md:mt-0">
                
                {/* Header Banner */}
                <div className="h-40 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
                    {isOwner && (
                        <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                            <span className="text-xs font-bold text-white flex items-center">
                                <i className="fa-solid fa-eye mr-2"></i> Preview Mode
                            </span>
                        </div>
                    )}

                    <div className="absolute -bottom-24 left-1/2 -translate-x-1/2">
                        <div className="h-48 w-48 rounded-full border-4 border-gray-800 bg-gray-700 flex items-center justify-center overflow-hidden shadow-lg">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold text-white">{user.fullName.charAt(0)}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-32 pb-8 px-8 text-center">
                    {/* Name */}
                    <h1 className="text-2xl font-bold text-white mb-2">{user.fullName}</h1>
                    
                    {/* Company Info Section */}
                    <div className="flex flex-col items-center gap-1 mb-4">
                        {user.companyName && (
                            <p className="text-indigo-400 font-medium text-lg flex items-center">
                                <i className="fa-solid fa-building text-sm mr-2 opacity-75"></i>
                                {user.companyName}
                            </p>
                        )}
                        
                        {user.companyWebsite && (
                            <a 
                                href={user.companyWebsite.startsWith('http') ? user.companyWebsite : `https://${user.companyWebsite}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-gray-400 hover:text-indigo-300 text-sm transition-colors flex items-center"
                            >
                                <i className="fa-solid fa-link text-xs mr-2"></i>
                                {formatUrl(user.companyWebsite)}
                            </a>
                        )}
                    </div>

                    {/* Email Pill */}
                    {user.email && (
                        <div className="mb-6 flex justify-center">
                            <a href={`mailto:${user.email}`} className="flex items-center px-4 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-full text-sm text-gray-300 hover:text-white transition-all border border-gray-600 hover:border-gray-500">
                                <i className="fa-regular fa-envelope mr-2"></i>
                                {user.email}
                            </a>
                        </div>
                    )}
                    
                    {/* Bio */}
                    {user.bio && (
                        <div className="mb-8 relative">
                            <i className="fa-solid fa-quote-left absolute top-0 -left-2 text-gray-700 text-2xl opacity-50"></i>
                            <p className="text-gray-400 text-sm leading-relaxed px-4">
                                {user.bio}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button 
                            onClick={handleDownloadVCard}
                            className="bg-white text-gray-900 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center"
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

                    {/* Social Links */}
                    <div className="space-y-3">
                        {user.socialLinks.map((link, idx) => {
                            // Simple icon mapping
                            let icon = "fa-globe";
                            const platform = link.platform.toLowerCase();
                            if (platform.includes('linkedin')) icon = "fa-linkedin";
                            else if (platform.includes('instagram')) icon = "fa-instagram";
                            else if (platform.includes('twitter') || platform.includes('x')) icon = "fa-x-twitter";
                            else if (platform.includes('facebook')) icon = "fa-facebook";
                            else if (platform.includes('github')) icon = "fa-github";
                            else if (platform.includes('youtube')) icon = "fa-youtube";
                            else if (platform.includes('whatsapp')) icon = "fa-whatsapp";

                            return (
                                <a key={idx} href={link.url} target="_blank" className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/80 transition-all border border-gray-700 hover:border-indigo-500/50 group">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-lg bg-gray-600/50 flex items-center justify-center mr-3 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
                                            <i className={`fa-brands ${icon} text-lg`}></i>
                                        </div>
                                        <span className="text-gray-300 font-medium group-hover:text-white capitalize">{link.platform}</span>
                                    </div>
                                    <i className="fa-solid fa-arrow-up-right-from-square text-xs text-gray-500 group-hover:text-indigo-400"></i>
                                </a>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}