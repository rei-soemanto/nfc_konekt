import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PLAN_CONFIG } from '@/lib/plans' 
import { PlanCategory } from '@prisma/client'

// Helper to format currency (IDR)
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price)
}

export async function PricingSection() {
    // 1. Fetch Monthly Plans from DB
    // We filter by 'MONTHLY' to show the base monthly rates
    const dbPlans = await prisma.plan.findMany({
        where: {
            duration: 'MONTHLY',
        },
        orderBy: {
            price: 'asc', // Personal (Cheaper) -> Corporate (Expensive)
        },
    })

    // 2. Merge DB Data with PLAN_CONFIG
    // The DB has the ID and Price. The Config has the Features.
    const plans = dbPlans.map(plan => {
        const config = PLAN_CONFIG[plan.category as PlanCategory];
        
        // Fallback description based on category
        let desc = "Perfect for individuals.";
        if (plan.category === 'CORPORATE') desc = "For growing businesses and teams.";

        return {
            id: plan.id,
            name: plan.name, // From DB
            price: formatPrice(plan.price), // From DB
            category: plan.category,
            desc: desc,
            // ✅ CRITICAL: Get features from your config file, not DB
            features: config?.features || [], 
            isPopular: plan.category === 'CORPORATE' // Highlight Corporate
        }
    })

    return (
        <section id="pricing" className="py-24 bg-white dark:bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Pricing</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-4">
                        Simple, transparent pricing. No hidden fees.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan, i) => (
                        <div key={plan.id} className={`relative p-8 rounded-2xl border flex flex-col ${
                            plan.isPopular
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 ring-4 ring-indigo-100 dark:ring-indigo-900/30' 
                                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                        }`}>
                            {plan.isPopular && (
                                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">
                                    BEST VALUE
                                </div>
                            )}

                            <div className="mb-4">
                                <h3 className={`text-xl font-bold ${
                                    plan.isPopular ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'
                                }`}>
                                    {plan.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.desc}</p>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                                    {plan.price}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">/month</span>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                                        <i className="fa-solid fa-check text-green-500 mt-0.5 mr-3 shrink-0"></i>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            
                            {/* Pass Plan ID to Register Page */}
                            <Link 
                                href={`/auth`} 
                                className={`block w-full py-3 px-4 rounded-xl text-center font-bold transition-all shadow-sm ${
                                    plan.isPopular
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/25' 
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                Choose {plan.name}
                            </Link>
                        </div>
                    ))}

                    {plans.length === 0 && (
                        <div className="col-span-2 text-center py-12 text-gray-500">
                            <p>No plans available at the moment.</p>
                            <p className="text-xs mt-2 opacity-70">(Did you seed the database?)</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}