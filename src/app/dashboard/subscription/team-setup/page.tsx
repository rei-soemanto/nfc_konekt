import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TeamSetupForm from '@/components/ui/pages/subscription/TeamSetupForm'
import { PLAN_CONFIG, EXPANSION_PACK_SIZE } from '@/lib/plans'

export default async function TeamSetupPage({ searchParams }: { searchParams: Promise<{ planId: string, packs?: string, mode?: string }> }) {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    const { planId, packs, mode } = await searchParams;
    if (!planId) redirect('/dashboard/subscription/payment');

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) redirect('/dashboard/subscription/payment');

    // Security Check: Only for Corporate
    if (plan.category !== 'CORPORATE') {
        redirect(`/dashboard/subscription/checkout?planId=${planId}&packs=${packs}`);
    }

    const numPacks = Number(packs || 0);
    const isExpansion = mode === 'expansion';

    // Calculation:
    // If Expansion: Seats = Packs * 10 (All are available for new members)
    // If New Plan: Seats = 10 + (Packs * 10) (1 is reserved for Admin)
    const totalSeats = isExpansion 
        ? (numPacks * EXPANSION_PACK_SIZE) 
        : PLAN_CONFIG['CORPORATE'].baseUsers + (numPacks * EXPANSION_PACK_SIZE);

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isExpansion ? 'Add New Team Members' : 'Setup Your Team'}
            </h1>
            <p className="text-gray-500 mb-8">
                {isExpansion 
                    ? `You are adding ${totalSeats} new seats. Register them now or later.` 
                    : 'Register your initial team members. You can also do this later from the dashboard.'}
            </p>
            
            <TeamSetupForm 
                planId={plan.id} 
                packs={numPacks}
                maxSeats={totalSeats}
                isExpansion={isExpansion} // Pass the flag
            />
        </div>
    )
}