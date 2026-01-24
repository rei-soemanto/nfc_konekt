import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SubscriptionTabs from '@/components/ui/pages/subscription/SubscriptionTabs' 
import CheckoutForm from '@/components/ui/pages/subscription/CheckoutForm'
import Link from 'next/link'

// --- HELPER FUNCTIONS FOR RANKING ---
const getDurationRank = (duration: string) => {
    switch (duration?.toUpperCase()) {
        case 'YEARLY': return 3;
        case 'SIX_MONTHS': return 2;
        case 'MONTHLY': return 1;
        default: return 0;
    }
};

const getTierRank = (category: string) => {
    switch (category?.toUpperCase()) {
        case 'CORPORATE': return 3;
        case 'PROFESSIONAL': return 2; // Adjust if you have this tier
        case 'PERSONAL': return 1;
        case 'BASIC': return 1;
        default: return 1;
    }
};

export default async function PaymentPage({ searchParams }: { searchParams: Promise<{ planId?: string, packs?: string, mode?: string }> }) {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    const { planId, packs, mode } = await searchParams;

    // --- STATE 1: NO PLAN SELECTED ---
    if (!planId) {
        const availablePlans = await prisma.plan.findMany({
            orderBy: { price: 'asc' }
        });
        
        return (
            <div className="max-w-6xl mx-auto py-12 px-4">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Plan</h1>
                    <p className="text-gray-500 dark:text-gray-400">Select the plan that fits your needs.</p>
                </div>
                <SubscriptionTabs plans={availablePlans} userId={userId} />
            </div>
        );
    }

    // --- STATE 2: PLAN SELECTED (CHECKOUT FLOW) ---
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
            address: true,
            subscription: { include: { plan: true } } 
        }
    });

    const selectedPlan = await prisma.plan.findUnique({ where: { id: planId } });
    
    if (!selectedPlan) {
        redirect('/dashboard/subscription/payment');
    }

    // Determine Mode
    let checkoutMode: 'NEW' | 'EXPANSION' | 'RENEW' = 'NEW';
    if (mode === 'expansion') checkoutMode = 'EXPANSION';
    else if (mode === 'renew') checkoutMode = 'RENEW';

    // 🛑 DOWNGRADE GUARD LOGIC 🛑
    // We only check this if:
    // 1. User has an active subscription
    // 2. This is NOT an expansion purchase (expansions are allowed on any active plan)
    // 3. This is NOT a renewal (renewals are for the same plan)
    const isActive = user?.subscription?.status === 'ACTIVE';

    if (isActive && user?.subscription && checkoutMode === 'NEW') {
        const currentPlan = user.subscription.plan;
        
        // Calculate Ranks
        const currentTierRank = getTierRank(currentPlan.category);
        const newTierRank = getTierRank(selectedPlan.category);
        
        const currentDurationRank = getDurationRank(currentPlan.duration);
        const newDurationRank = getDurationRank(selectedPlan.duration);

        // Check Conditions
        const isTierDowngrade = newTierRank < currentTierRank;
        
        // Strict Duration Check: You cannot switch to shorter duration unless upgrading Tier
        // e.g. Corporate Yearly -> Corporate Monthly (Blocked)
        // e.g. Personal Yearly -> Corporate Monthly (Allowed, technically an upgrade in Tier)
        const isSameTierButShorter = (newTierRank === currentTierRank) && (newDurationRank < currentDurationRank);

        if (isTierDowngrade || isSameTierButShorter) {
            return (
                <div className="max-w-2xl mx-auto py-24 px-4 text-center">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fa-solid fa-ban text-4xl"></i>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Plan Change Not Allowed</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                        You are currently on the <strong>{currentPlan.name} ({currentPlan.duration})</strong> plan.<br/>
                        You cannot switch to a lower tier or shorter duration until your current subscription expires.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link 
                            href="/dashboard/subscription/payment" 
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                        >
                            Choose Another Plan
                        </Link>
                        <Link 
                            href="/dashboard/subscription/status" 
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
                        >
                            Return to Dashboard
                        </Link>
                    </div>
                </div>
            );
        }
    }

    // ✅ FIX 1: DETERMINE PACK COUNT FROM DB IF RENEWING
    let finalExpansionPacks = Number(packs || 0);
    
    if (checkoutMode === 'RENEW' && user?.subscription) {
        if (!packs) {
            finalExpansionPacks = user.subscription.expansionPacks;
        }
    }

    // ✅ FIX 2: Calculate Remaining Days (For Expansion Mode)
    let remainingDays = 0;
    if (checkoutMode === 'EXPANSION' && user?.subscription?.endDate) {
        const now = new Date();
        const endDate = new Date(user.subscription.endDate);
        const diffTime = Math.max(0, endDate.getTime() - now.getTime());
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (remainingDays <= 0) remainingDays = 30; // Safety fallback
    }

    // Address Handling
    let userAddress = null;
    if (user?.address) {
        try {
            userAddress = typeof user.address === 'string' ? JSON.parse(user.address) : user.address;
        } catch (e) {
            userAddress = null;
        }
    }

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            <div className="mb-8">
                <Link href="/dashboard/subscription/payment" className="text-sm text-gray-500 hover:text-indigo-600 mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-arrow-left"></i> Back to Plans
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {checkoutMode === 'RENEW' ? 'Renew Subscription' : checkoutMode === 'EXPANSION' ? 'Add Expansion' : 'Checkout'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    {checkoutMode === 'RENEW' 
                        ? 'Extend your current plan validity.' 
                        : checkoutMode === 'EXPANSION' 
                        ? 'Add more capacity to your current active plan.'
                        : 'Review your details and complete payment securely.'}
                </p>
            </div>
            
            <CheckoutForm 
                userAddress={userAddress} 
                plan={selectedPlan}
                expansionPacks={finalExpansionPacks} 
                mode={checkoutMode}
                remainingDays={remainingDays} 
            />
        </div>
    )
}