import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CheckoutForm from '@/components/ui/pages/subscription/CheckoutForm'
import Link from 'next/link'

// ✅ FIX: Normalize inputs toUpperCase to prevent mismatch
const getDurationRank = (duration: string) => {
    switch (duration?.toUpperCase()) {
        case 'YEARLY': return 3;
        case 'SIX_MONTHS': return 2;
        case 'MONTHLY': return 1;
        default: return 0;
    }
};

// ✅ FIX: Add all your Plan Categories here. 
// Ensure 'CORPORATE' is highest and 'PERSONAL'/'BASIC' is lowest.
const getTierRank = (category: string) => {
    switch (category?.toUpperCase()) {
        case 'CORPORATE': return 3;
        case 'PERSONAL': return 1;
        default: return 1; // Default to lowest
    }
};

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ planId: string, packs?: string, mode?: string }> }) {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    const { planId, packs, mode } = await searchParams;
    if (!planId) redirect('/dashboard/subscription/payment');

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
            address: true,
            subscription: { include: { plan: true } } 
        }
    });

    const newPlan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!newPlan) redirect('/dashboard/subscription/payment');

    // --- DOWNGRADE GUARD LOGIC ---
    // Check if user has an active subscription AND isn't just adding expansion packs
    const isActive = user?.subscription?.status === 'ACTIVE';
    
    if (isActive && user?.subscription && mode !== 'expansion') {
        const currentPlan = user.subscription.plan;
        
        // 1. Calculate Ranks
        const currentTierRank = getTierRank(currentPlan.category);
        const newTierRank = getTierRank(newPlan.category);
        
        const currentDurationRank = getDurationRank(currentPlan.duration);
        const newDurationRank = getDurationRank(newPlan.duration);

        // 2. Define Downgrade Scenarios
        // A. Tier Downgrade: Switching from Corporate (3) to Personal (1)
        const isTierDowngrade = newTierRank < currentTierRank;
        
        // B. Duration Downgrade: Same Tier, but switching from Yearly (3) to Monthly (1)
        // Note: We only block duration changes if it's NOT a Renewal.
        const isDurationDowngrade = (newTierRank === currentTierRank) && (newDurationRank < currentDurationRank);

        // 3. Execution
        // If it is a downgrade AND not explicitly a renewal flow
        if ((isTierDowngrade || isDurationDowngrade) && mode !== 'renew') {
            return (
                <div className="max-w-2xl mx-auto py-20 px-4 text-center">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fa-solid fa-ban text-4xl"></i>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Action Not Allowed</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        You are currently active on the <strong>{currentPlan.name} ({currentPlan.duration})</strong> plan. <br/>
                        Downgrading to a lower tier or shorter duration is not allowed while your current plan is active.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link 
                            href="/dashboard/subscription/status" 
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                        >
                            Back to Status
                        </Link>
                        {/* Optional: Add a contact button if they really need to downgrade manually */}
                        <a 
                            href="mailto:support@nfckonekt.com"
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
                        >
                            Contact Support
                        </a>
                    </div>
                </div>
            )
        }
    }

    // --- STANDARD CHECKOUT LOGIC ---
    
    let userAddress = null;
    if (user?.address) {
        try {
            userAddress = typeof user.address === 'string' ? JSON.parse(user.address) : user.address;
        } catch (e) {
            userAddress = null;
        }
    }

    let checkoutMode: 'NEW' | 'EXPANSION' | 'RENEW' = 'NEW';
    if (mode === 'expansion') checkoutMode = 'EXPANSION';
    else if (mode === 'renew') checkoutMode = 'RENEW';

    // Pack Logic
    let finalExpansionPacks = Number(packs || 0);
    if (checkoutMode === 'RENEW' && user?.subscription) {
        if (!packs || Number(packs) === 0) {
            finalExpansionPacks = user.subscription.expansionPacks;
        }
    }

    // Remaining Days Logic
    let remainingDays = 0;
    if (checkoutMode === 'EXPANSION' && user?.subscription?.endDate) {
        const now = new Date();
        const endDate = new Date(user.subscription.endDate);
        const diffTime = Math.max(0, endDate.getTime() - now.getTime());
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (remainingDays <= 0) remainingDays = 30; 
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <Link href="/dashboard/subscription/payment" className="text-sm text-gray-500 hover:text-indigo-600 mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-arrow-left"></i> Back to Plans
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {checkoutMode === 'RENEW' ? 'Renew Subscription' : checkoutMode === 'EXPANSION' ? 'Add Expansion' : 'Checkout'}
                </h1>
                <p className="text-gray-500">
                    {checkoutMode === 'RENEW' 
                        ? 'Extend your plan validity and keep your current team capacity.' 
                        : 'Review your order and complete payment.'}
                </p>
            </div>
            
            <CheckoutForm 
                userAddress={userAddress} 
                plan={newPlan}
                expansionPacks={finalExpansionPacks} 
                mode={checkoutMode}
                remainingDays={remainingDays}
            />
        </div>
    )
}