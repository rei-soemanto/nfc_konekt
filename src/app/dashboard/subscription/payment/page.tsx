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
        // ✅ FIX: Removed 'isActive' filter because column does not exist in your DB
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
        include: { address: true }
    });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    
    if (!plan) {
        redirect('/dashboard/subscription/payment');
    }

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
                <a href="/dashboard/subscription/payment" className="text-sm text-gray-500 hover:text-indigo-600 mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-arrow-left"></i> Change Plan
                </a>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Checkout</h1>
                <p className="text-gray-500 dark:text-gray-400">Review your plan details and complete payment securely.</p>
            </div>
            
            <CheckoutForm 
                userAddress={userAddress} 
                plan={plan}
                expansionPacks={Number(packs || 0)}
                mode={mode === 'expansion' ? 'EXPANSION' : 'NEW'}
            />
        </div>
    )
}