'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EXPANSION_PACK_SIZE } from '@/lib/plans'

type Props = {
    planId: string
    monthlyExpansionPrice: number
    durationMonths: number
    durationLabel: string
}

export default function ExpansionUpgradeForm({ planId, monthlyExpansionPrice, durationMonths, durationLabel }: Props) {
    const router = useRouter();
    const [packsToAdd, setPacksToAdd] = useState(1);
    const [loading, setLoading] = useState(false);

    // Calculate Total Cost
    const pricePerPack = monthlyExpansionPrice * durationMonths;
    const totalCost = pricePerPack * packsToAdd;
    const addedSeats = packsToAdd * EXPANSION_PACK_SIZE;

    const handleContinue = () => {
        setLoading(true);
        // Redirect to Team Setup with 'expansion' mode
        router.push(`/dashboard/subscription/team-setup?planId=${planId}&packs=${packsToAdd}&mode=expansion`);
    };

    return (
        <div className="space-y-8">
            {/* Selection */}
            <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-4">
                    How many additional packs do you need?
                </label>
                
                <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                    <button 
                        onClick={() => setPacksToAdd(Math.max(1, packsToAdd - 1))}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg text-indigo-600 hover:shadow-md transition-all"
                    >
                        <i className="fa-solid fa-minus"></i>
                    </button>

                    <div className="text-center">
                        <span className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">{packsToAdd}</span>
                        <p className="text-xs text-indigo-600/70 font-bold uppercase mt-1">Pack{packsToAdd > 1 ? 's' : ''}</p>
                    </div>

                    <button 
                        onClick={() => setPacksToAdd(packsToAdd + 1)}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg text-indigo-600 hover:shadow-md transition-all"
                    >
                        <i className="fa-solid fa-plus"></i>
                    </button>
                </div>
                
                <p className="text-center text-sm text-gray-500 mt-3">
                    You will get <strong>+{addedSeats} Team Profiles</strong> immediately.
                </p>
            </div>

            {/* Bill Details */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-dashed border-gray-300 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Bill Summary</h3>
                
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Monthly Rate</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300">IDR {monthlyExpansionPrice.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Duration Multiplier</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300">x {durationMonths} ({durationLabel})</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Quantity</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300">x {packsToAdd}</span>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2 flex justify-between items-center">
                        <span className="font-bold text-gray-900 dark:text-white">Total Charge</span>
                        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                            IDR {totalCost.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>
            </div>

            <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : `Continue to Team Setup`}
            </button>
        </div>
    )
}