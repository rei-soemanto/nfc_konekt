import { prisma } from '@/lib/prisma'
// FIX: Import both functions
import { initializePlans, seedPlans } from '@/actions/admin-plans'
import { getAdminData } from '@/actions/admin'
import { redirect } from 'next/navigation'
import PricingCard from '@/components/ui/pages/admin/PricingCard'
import ExpansionPricingCard from '@/components/ui/pages/admin/ExpansionPricingCard'

export default async function AdminPlansPage() {
    try { await getAdminData(); } catch { redirect('/dashboard'); }
    
    // FIX: Use seedPlans() instead of initializePlans()
    // This creates data if missing but DOES NOT trigger revalidatePath during render
    await seedPlans();

    const plans = await prisma.plan.findMany({ orderBy: { duration: 'asc' } });
    
    const personalPlans = plans.filter(p => p.category === 'PERSONAL');
    const corporatePlans = plans.filter(p => p.category === 'CORPORATE');

    const expansionMonthlyRate = corporatePlans[0]?.expansionPrice || 0;

    return (
        <div className="max-w-[1600px] mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plan Pricing</h1>
                {/* This button still uses the revalidating action */}
                <form action={initializePlans}>
                    <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg transition-colors">
                        <i className="fa-solid fa-rotate-right mr-2"></i>
                        Force Refresh Plans
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COL 1: PERSONAL */}
                <div className="space-y-4">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <h2 className="font-bold text-indigo-900 dark:text-indigo-400">Personal</h2>
                        <p className="text-xs text-indigo-500">Single user subscriptions.</p>
                    </div>
                    {personalPlans.map(plan => (
                        <PricingCard key={plan.id} plan={plan} />
                    ))}
                </div>

                {/* COL 2: CORPORATE */}
                <div className="space-y-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900">
                        <h2 className="font-bold text-purple-900 dark:text-purple-400">Corporate</h2>
                        <p className="text-xs text-purple-500">Price for the initial 10 seats.</p>
                    </div>
                    {corporatePlans.length > 0 ? (
                        corporatePlans.map(plan => (
                            <PricingCard key={plan.id} plan={plan} />
                        ))
                    ) : (
                        <div className="p-4 text-center text-red-500 text-sm border border-red-200 rounded-lg">
                            No Corporate Plans found. Try refreshing.
                        </div>
                    )}
                </div>

                {/* COL 3: EXPANSION */}
                <div className="space-y-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                        <h2 className="font-bold text-amber-800 dark:text-amber-500">Expansion Configuration</h2>
                        <p className="text-xs text-amber-600">Set the <strong>Monthly Rate</strong> per 10-user pack. <br/>Total is calculated automatically by duration.</p>
                    </div>
                    
                    <ExpansionPricingCard currentPrice={expansionMonthlyRate} />
                </div>

            </div>
        </div>
    )
}