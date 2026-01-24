import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CheckoutForm from '@/components/ui/pages/subscription/CheckoutForm' 

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ planId: string, packs?: string, mode?: string }> }) {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    const { planId, packs, mode } = await searchParams;
    if (!planId) redirect('/dashboard/subscription/payment');

    // 1. Fetch User & Subscription
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
            address: true,
            subscription: true // ✅ Needed to get current expansion packs
        }
    });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) redirect('/dashboard/subscription/payment');

    // 2. Determine Mode
    let checkoutMode: 'NEW' | 'EXPANSION' | 'RENEW' = 'NEW';
    if (mode === 'expansion') checkoutMode = 'EXPANSION';
    else if (mode === 'renew') checkoutMode = 'RENEW';

    // 3. Determine Expansion Packs Count
    let finalExpansionPacks = Number(packs || 0);

    // ✅ FIX: If Renewing, and no specific pack count provided in URL, 
    // inherit the count from the existing subscription.
    if (checkoutMode === 'RENEW' && user?.subscription) {
        if (!packs || Number(packs) === 0) {
            finalExpansionPacks = user.subscription.expansionPacks;
        }
    }

    // 4. Calculate Remaining Days (Only for Expansion Mode)
    let remainingDays = 0;
    if (checkoutMode === 'EXPANSION' && user?.subscription?.endDate) {
        const now = new Date();
        const endDate = new Date(user.subscription.endDate);
        const diffTime = Math.max(0, endDate.getTime() - now.getTime());
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (remainingDays <= 0) remainingDays = 30; // Fallback
    }

    // 5. Address Handling
    let userAddress = null;
    if (user?.address) {
        try {
            userAddress = typeof user.address === 'string' ? JSON.parse(user.address) : user.address;
        } catch (e) {
            userAddress = null;
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {checkoutMode === 'RENEW' ? 'Renew Subscription' : checkoutMode === 'EXPANSION' ? 'Add Expansion' : 'Checkout'}
            </h1>
            <p className="text-gray-500 mb-8">
                {checkoutMode === 'RENEW' 
                    ? 'Extend your plan validity and keep your current team capacity.' 
                    : 'Review your order and complete payment.'}
            </p>
            
            <CheckoutForm 
                userAddress={userAddress} 
                plan={plan}
                expansionPacks={finalExpansionPacks} // ✅ Now passes the correct DB value for renewals
                mode={checkoutMode}
                remainingDays={remainingDays}
            />
        </div>
    )
}