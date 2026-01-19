import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ExpansionUpgradeForm from '@/components/ui/pages/subscription/ExpansionUpgradeForm'
import { DURATION_CONFIG, EXPANSION_PACK_SIZE } from '@/lib/plans'
import { PlanDuration } from '@prisma/client'

export default async function ExpansionPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            subscription: { include: { plan: true } }
        }
    });

    // 1. Validate Access
    if (!user || !user.subscription || !user.subscription.plan) {
        return redirect('/dashboard/subscription');
    }

    // 2. Only Corporate can expand
    if (user.subscription.plan.category !== 'CORPORATE') {
        return (
            <div className="max-w-2xl mx-auto py-12 text-center">
                <div className="bg-amber-50 text-amber-600 p-4 rounded-lg inline-block mb-4">
                    <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                    Expansion packs are only available for Corporate plans.
                </div>
                <div>
                    <a href="/dashboard/subscription" className="text-indigo-600 hover:underline">Go to Plans</a>
                </div>
            </div>
        )
    }

    const sub = user.subscription;
    const plan = sub.plan;
    
    // 3. Get Duration Config
    const durationInfo = DURATION_CONFIG[plan.duration as PlanDuration];

    return (
        <div className="max-w-2xl mx-auto py-8">
            <div className="mb-8">
                <a href="/dashboard/team" className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block">
                    <i className="fa-solid fa-arrow-left mr-1"></i> Back to Team
                </a>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expand Team Capacity</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Add more seats to your existing <strong>{plan.name}</strong> subscription.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Current Capacity</p>
                            <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                                {10 + (sub.expansionPacks * EXPANSION_PACK_SIZE)} Seats
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-500 uppercase">Current Packs</p>
                            <p className="font-mono text-lg font-bold text-indigo-600">
                                {sub.expansionPacks}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <ExpansionUpgradeForm 
                        planId={plan.id}
                        monthlyExpansionPrice={plan.expansionPrice}
                        durationMonths={durationInfo.months}
                        durationLabel={durationInfo.label}
                    />
                </div>
            </div>
        </div>
    )
}