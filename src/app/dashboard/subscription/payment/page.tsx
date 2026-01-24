import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SubscriptionTabs from '@/components/ui/pages/subscription/SubscriptionTabs' 
import CheckoutForm from '@/components/ui/pages/subscription/CheckoutForm' 

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

    // --- STATE 2: PLAN SELECTED ---
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
            address: true,
            subscription: true 
        }
    });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    
    if (!plan) {
        redirect('/dashboard/subscription/payment');
    }

    // Determine Mode
    let checkoutMode: 'NEW' | 'EXPANSION' | 'RENEW' = 'NEW';
    if (mode === 'expansion') checkoutMode = 'EXPANSION';
    else if (mode === 'renew') checkoutMode = 'RENEW';

    // ✅ FIX 1: DETERMINE PACK COUNT FROM DB IF RENEWING
    let finalExpansionPacks = Number(packs || 0);
    
    if (checkoutMode === 'RENEW' && user?.subscription) {
        // If URL doesn't have packs (which is standard for renewal links), use the current active amount
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
                <a href="/dashboard/subscription/status" className="text-sm text-gray-500 hover:text-indigo-600 mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-arrow-left"></i> Back
                </a>
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
                plan={plan}
                expansionPacks={finalExpansionPacks} // ✅ NOW USES DB VALUE FOR RENEWALS
                mode={checkoutMode}
                remainingDays={remainingDays} 
            />
        </div>
    )
}