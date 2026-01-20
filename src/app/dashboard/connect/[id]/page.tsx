import { getAuthUserId } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import CorporateProfileCard from '@/components/ui/pages/shared/CorporateProfileCard'
import { ProfileDataService } from '@/services/ProfileDataService'

export default async function ConnectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const viewerId = await getAuthUserId();
    if (!viewerId) redirect('/auth/login');
    
    const { id } = await params;

    // 1. Initialize Service
    const profileService = new ProfileDataService(viewerId);

    // 2. Check Subscription
    const hasSubscription = await profileService.getViewerSubscriptionStatus();

    if (!hasSubscription) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-4 text-center">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 shadow-xl">
                    <i className="fa-solid fa-lock text-4xl text-indigo-600 mb-4"></i>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h1>
                    <p className="text-gray-500 mb-6">You need an active subscription to view full connection profiles.</p>
                    <Link href="/dashboard/subscription/payment" className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">
                        Upgrade Now
                    </Link>
                </div>
            </div>
        )
    }

    // 3. Fetch Data using Service
    const targetUser = await profileService.getTargetUserProfile(id);
    if (!targetUser) return notFound();

    // 4. Prepare Data for UI
    const companyDetails = ProfileDataService.getInheritedCompanyDetails(targetUser);
    const teamMembers = await profileService.getCompanyTeamMembers(targetUser);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Link href="/dashboard/connect" className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-2 transition-colors">
                    <i className="fa-solid fa-arrow-left"></i> Back to Connections
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                {/* Header Gradient */}
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                        <i className="fa-solid fa-link mr-2"></i> Connected
                    </div>
                </div>

                <div className="px-8 pb-8">
                    {/* User Header Info (Avatar/Name) */}
                    <div className="flex flex-col md:flex-row gap-6 items-start -mt-12 relative z-10">
                        <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-gray-900 bg-white shadow-md overflow-hidden flex-shrink-0">
                            {targetUser.avatarUrl ? (
                                <img src={targetUser.avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400 bg-gray-100">
                                    {targetUser.fullName.charAt(0)}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 pt-12 md:pt-14">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{targetUser.fullName}</h1>
                            <p className="text-gray-500 font-medium">
                                {targetUser.jobTitle} 
                                {targetUser.jobTitle && targetUser.companyName && ' at '}
                                <span className="text-indigo-600">{targetUser.companyName}</span>
                            </p>
                            
                            {/* Contact Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-gray-500 shadow-sm">
                                        <i className="fa-regular fa-envelope"></i>
                                    </div>
                                    <div className="overflow-hidden min-w-0">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Email</p>
                                        <p className="text-sm font-medium truncate" title={targetUser.email}>{targetUser.email}</p>
                                    </div>
                                </div>
                                {targetUser.companyWebsite && (
                                    <a href={targetUser.companyWebsite} target="_blank" className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-indigo-50 transition-colors group">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-gray-500 group-hover:text-indigo-600 shadow-sm">
                                            <i className="fa-solid fa-globe"></i>
                                        </div>
                                        <div className="overflow-hidden min-w-0">
                                            <p className="text-xs text-gray-400 uppercase font-bold">Website</p>
                                            <p className="text-sm font-medium truncate text-indigo-600">{targetUser.companyWebsite}</p>
                                        </div>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {targetUser.bio && (
                        <div className="mt-8">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">About</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                {targetUser.bio}
                            </p>
                        </div>
                    )}

                    {/* Corporate Profile Card (With Teams) */}
                    <CorporateProfileCard 
                        details={companyDetails}
                        teamMembers={teamMembers}
                        hasSubscription={true} 
                        variant="dashboard" // <--- CRITICAL UPDATE
                    />
                </div>
            </div>
        </div>
    )
}