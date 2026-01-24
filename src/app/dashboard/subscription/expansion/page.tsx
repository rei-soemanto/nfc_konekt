import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ExpansionUpgradeForm from '@/components/ui/pages/subscription/ExpansionUpgradeForm'
import { DURATION_CONFIG } from '@/lib/plans'
import { PlanDuration } from '@prisma/client'

export default async function ExpansionPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: { include: { plan: true } } }
    });

    if (!user?.subscription || !user.subscription.plan) {
        return redirect('/dashboard/subscription/status');
    }

    const sub = user.subscription;
    const plan = sub.plan;

    // ✅ ROBUST DATE CALCULATION
    const now = new Date();
    const endDate = new Date(sub.endDate);
    
    // Ensure endDate is valid
    if (isNaN(endDate.getTime())) {
        console.error("Invalid Subscription End Date");
        return redirect('/dashboard/subscription/status');
    }

    const diffTime = Math.max(0, endDate.getTime() - now.getTime());
    const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (remainingDays <= 0) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Subscription Expired</h1>
                <p className="text-gray-500 mb-6">Please renew your plan before adding expansion packs.</p>
                <a href="/dashboard/subscription/status" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Renew First</a>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <div className="mb-8">
                <a href="/dashboard/subscription/status" className="text-sm text-gray-500 hover:text-indigo-600 mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-arrow-left"></i> Back
                </a>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Add Expansion Packs</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Add more seats to your existing <strong>{plan.name}</strong> subscription.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Current Capacity</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{(sub.expansionPacks * 10) + (plan.category === 'CORPORATE' ? 10 : 1)} Seats</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-500 uppercase">Current Packs</p>
                        <p className="text-xl font-bold text-indigo-600">{sub.expansionPacks}</p>
                    </div>
                </div>

                <ExpansionUpgradeForm 
                    planId={plan.id}
                    monthlyExpansionPrice={plan.expansionPrice || 0} // ✅ Safety fallback
                    remainingDays={remainingDays} 
                />
            </div>
        </div>
    )
}