import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CheckoutForm from '@/components/ui/pages/subscription/CheckoutForm'

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ planId: string, packs?: string, mode?: string }> }) {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    const { planId, packs, mode } = await searchParams;
    if (!planId) redirect('/dashboard/subscription/payment');

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { address: true }
    });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) redirect('/dashboard/subscription/payment');

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Checkout</h1>
            <p className="text-gray-500 mb-8">Review your order and complete payment.</p>
            
            <CheckoutForm 
                userAddress={userAddress} 
                plan={plan}
                expansionPacks={Number(packs || 0)}
                mode={mode === 'expansion' ? 'EXPANSION' : 'NEW'}
            />
        </div>
    )
}