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

export default function PublicProfile({ user, slug }: { user: UserProfile, slug: string }) {
    const [isFriend, setIsFriend] = useState(false);

    // 1. Log the scan on mount
    useEffect(() => {
        logScan(slug);
    }, [slug]);

    // 2. Handle "Save Contact" (VCF Download)
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

    // 3. Handle "Connect"
    const handleConnect = async () => {
        const result = await addFriend(user.id);
        if (result.success) setIsFriend(true);
        else alert("Could not add friend (Maybe not logged in?)");
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700">
                
                {/* Header Banner */}
                <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
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

                {/* Profile Info */}
                <div className="pt-16 pb-8 px-8 text-center">
                    <h1 className="text-2xl font-bold text-white mb-1">{user.fullName}</h1>
                    <p className="text-indigo-400 font-medium mb-4">{user.companyName}</p>
                    
                    {user.bio && (
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                            "{user.bio}"
                        </p>
                    )}

                    {/* Action Buttons */}
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
                            disabled={isFriend}
                            className={`py-3 rounded-xl font-bold text-sm transition-colors shadow-lg flex items-center justify-center ${
                                isFriend 
                                    ? 'bg-green-600 text-white cursor-default' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                        >
                            {isFriend ? (
                                <><i className="fa-solid fa-check mr-2"></i> Connected</>
                            ) : (
                                <><i className="fa-solid fa-user-plus mr-2"></i> Connect</>
                            )}
                        </button>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Social Profiles</h3>
                        {user.socialLinks.map((link, idx) => (
                            <a 
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-all border border-gray-700 hover:border-indigo-500/50 group"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-indigo-400 group-hover:text-white group-hover:bg-indigo-600 transition-colors">
                                    {/* Simple mapping for icons based on platform name */}
                                    <i className={`fa-brands fa-${link.platform.toLowerCase()} text-lg`}></i>
                                </div>
                                <span className="ml-4 text-gray-300 font-medium group-hover:text-white">{link.platform}</span>
                                <i className="fa-solid fa-arrow-up-right-from-square ml-auto text-gray-500 text-sm"></i>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-900 py-4 text-center border-t border-gray-800">
                    <p className="text-xs text-gray-600 flex items-center justify-center">
                        <i className="fa-solid fa-wifi mr-2"></i> Powered by NFC Konekt
                    </p>
                </div>
            </div>
        </div>
    )
}