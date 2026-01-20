import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { addToConnect } from '@/actions/connection'
// Removed CorporateProfileCard import - strictly strictly kept for dashboard

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    
    // 1. Fetch Basic User Data Only
    const card = await prisma.card.findUnique({
        where: { slug },
        include: {
            user: { include: { socialLinks: true } }
        }
    });

    if (!card || card.status !== 'ACTIVE') {
        return notFound();
    }

    const targetUser = card.user;
    const viewerId = await getAuthUserId();
    
    // Check Connection & Subscription
    let isConnected = false;
    let hasSubscription = false;

    if (viewerId) {
        const viewer = await prisma.user.findUnique({
            where: { id: viewerId },
            include: { subscription: true, parent: { include: { subscription: true } } }
        });
        const sub = viewer?.subscription || viewer?.parent?.subscription;
        hasSubscription = !!(sub && sub.status === 'ACTIVE');

        const connection = await prisma.connection.findUnique({
            where: { userId_targetId: { userId: viewerId, targetId: targetUser.id } }
        });
        isConnected = !!connection;
    }

    async function handleConnect() {
        'use server'
        if (!viewerId) return; 
        await addToConnect(targetUser.id);
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex justify-center items-center py-12 px-4">
            <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                
                {/* Simplified Header */}
                <div className="relative h-40 bg-indigo-600 flex flex-col items-center justify-center text-white">
                    <div className="absolute inset-0 bg-black/10"></div>
                    
                    <div className="relative z-10 w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden mb-[-48px] translate-y-8">
                        {targetUser.avatarUrl ? (
                            <img src={targetUser.avatarUrl} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400">
                                {targetUser.fullName.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{targetUser.fullName}</h1>
                    <p className="text-gray-500 text-sm mt-1">{targetUser.jobTitle || 'NFC Konekt User'}</p>
                    
                    {/* Simplified Bio */}
                    {targetUser.bio && (
                        <p className="text-gray-400 text-sm mt-4 line-clamp-3">
                            "{targetUser.bio}"
                        </p>
                    )}

                    {/* Action Area */}
                    <div className="mt-8 space-y-3">
                        {viewerId && viewerId !== targetUser.id ? (
                            isConnected ? (
                                <button disabled className="w-full py-3 rounded-xl bg-green-50 text-green-600 font-bold text-sm border border-green-100">
                                    <i className="fa-solid fa-check mr-2"></i> Connected
                                </button>
                            ) : (
                                <form action={handleConnect}>
                                    <button 
                                        disabled={!hasSubscription}
                                        className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${
                                            hasSubscription 
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30' 
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <i className={`fa-solid ${hasSubscription ? 'fa-user-plus' : 'fa-lock'} mr-2`}></i>
                                        {hasSubscription ? 'Connect to View Full Profile' : 'Subscribe to Connect'}
                                    </button>
                                </form>
                            )
                        ) : null}

                         {/* Socials (Basic) */}
                        <div className="flex justify-center gap-4 mt-6">
                            {targetUser.socialLinks.slice(0, 3).map(link => (
                                <a key={link.id} href={link.url} target="_blank" className="text-gray-400 hover:text-indigo-600 transition-colors text-xl">
                                    <i className={`fa-brands fa-${link.platform.toLowerCase()}`}></i>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}