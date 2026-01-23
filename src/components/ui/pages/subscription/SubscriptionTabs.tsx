'use client'

import { useState } from 'react'
import { PLAN_CONFIG, EXPANSION_PACK_SIZE, DURATION_CONFIG } from '@/lib/plans'
import { PlanDuration } from '@prisma/client'
import { useRouter } from 'next/navigation'

export default function SubscriptionTabs({ plans, userId }: { plans: any[], userId: string }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('PERSONAL');
    const [billingCycle, setBillingCycle] = useState<PlanDuration>('MONTHLY');
    const [expansionPacks, setExpansionPacks] = useState(0);
    const [loading, setLoading] = useState<string | null>(null);

    const currentCategoryPlans = plans.filter(p => p.category === activeTab);
    const selectedPlan = currentCategoryPlans.find(p => p.duration === billingCycle);
    
    const config = PLAN_CONFIG[activeTab as keyof typeof PLAN_CONFIG];
    const durationInfo = DURATION_CONFIG[billingCycle] || DURATION_CONFIG['MONTHLY']; 

    const monthlyRate = selectedPlan?.expansionPrice || 0;
    const accumulatedRate = monthlyRate * durationInfo.months;
    const totalExpansionCost = accumulatedRate * expansionPacks;
    const basePrice = selectedPlan?.price || 0;
    const grandTotal = basePrice + totalExpansionCost;

    const handleContinue = () => {
        if (!selectedPlan) return;
        setLoading(selectedPlan.id);
        
        // CASE A: Corporate (Go to Team Setup first)
        if (activeTab === 'CORPORATE') {
            router.push(`/dashboard/subscription/team-setup?planId=${selectedPlan.id}&packs=${expansionPacks}`);
        } 
        // CASE B: Personal (Stay on PAYMENT page, but add params to trigger CheckoutForm)
        else {
            // ✅ FIX: Point this to 'payment', not 'checkout'
            router.push(`/dashboard/subscription/payment?planId=${selectedPlan.id}&packs=${expansionPacks}`);
        }
    };

    if (!config || !durationInfo) return <div className="p-8 text-center text-gray-500">Loading plans...</div>;

    return (
        <div>
            {/* Category Switcher */}
            <div className="flex justify-center mb-8">
                <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl inline-flex gap-1">
                    {['PERSONAL', 'CORPORATE'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setActiveTab(cat); setExpansionPacks(0); }}
                            className={`px-8 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === cat ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {cat === 'CORPORATE' ? 'Corporate' : 'Personal'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Duration Switcher */}
            <div className="flex justify-center gap-4 mb-8">
                {Object.entries(DURATION_CONFIG).map(([key, info]) => (
                    <button
                        key={key}
                        onClick={() => setBillingCycle(key as PlanDuration)}
                        className={`border px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                            billingCycle === key ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-500'
                        }`}
                    >
                        {info.label}
                    </button>
                ))}
            </div>

            {/* Pricing Card */}
            <div className="max-w-md mx-auto bg-white dark:bg-gray-900 border-2 border-indigo-500 dark:border-indigo-600 rounded-2xl p-8 shadow-xl">
                
                <div className="text-center mb-8">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{config.label} Plan</h2>
                    <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
                        IDR {grandTotal.toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-gray-500 uppercase font-bold mt-1">Total Billed {durationInfo.label}</p>
                </div>

                {activeTab === 'CORPORATE' && selectedPlan && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-100 dark:border-amber-800 mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-bold text-amber-800 dark:text-amber-500">
                                <i className="fa-solid fa-layer-group mr-2"></i>
                                Expansion Pack
                            </span>
                            <span className="text-xs font-mono text-gray-500">
                                +{expansionPacks * EXPANSION_PACK_SIZE} Profiles
                            </span>
                        </div>
                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-1 border border-amber-200 dark:border-amber-800/50">
                            <button onClick={() => setExpansionPacks(Math.max(0, expansionPacks - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                <i className="fa-solid fa-minus text-gray-500"></i>
                            </button>
                            <span className="font-bold text-gray-700 dark:text-gray-300">{expansionPacks}</span>
                            <button onClick={() => setExpansionPacks(expansionPacks + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                <i className="fa-solid fa-plus text-indigo-600"></i>
                            </button>
                        </div>
                        <div className="mt-2 text-right">
                            <span className="text-xs text-amber-700 dark:text-amber-500 font-medium">
                                + IDR {totalExpansionCost.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">What you'll get</p>
                    <ul className="space-y-3">
                        {config.features.map((feat: string, i: number) => (
                            <li key={i} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                <i className="fa-solid fa-check text-green-500 mt-0.5 mr-3"></i>
                                <span className="flex-1">{feat}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <button
                    onClick={handleContinue}
                    disabled={loading !== null || !selectedPlan}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                    {loading ? 'Processing...' : (activeTab === 'CORPORATE' ? 'Setup Team & Continue' : 'Continue to Checkout')}
                </button>
            </div>
        </div>
    )
}