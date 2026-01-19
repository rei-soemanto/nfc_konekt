'use client'

import { useState } from 'react'
import { updateExpansionPrice } from '@/actions/admin-plans'

export default function ExpansionPricingCard({ currentPrice }: { currentPrice: number }) {
    const [price, setPrice] = useState(currentPrice)
    const [loading, setLoading] = useState(false)
    const [isDirty, setIsDirty] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateExpansionPrice(Number(price))
            setIsDirty(false)
        } catch (error) {
            alert("Failed to update expansion price")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <i className="fa-solid fa-layer-group"></i>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Monthly Rate</h3>
                        <p className="text-xs text-gray-500">Per 10-User Pack</p>
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={!isDirty || loading}
                    className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all ${
                        isDirty 
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-default'
                    }`}
                >
                    {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                </button>
            </div>

            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-amber-600">IDR</span>
                <input 
                    type="number"
                    value={price}
                    onChange={(e) => { setPrice(Number(e.target.value)); setIsDirty(true); }}
                    className="w-full pl-10 pr-16 py-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-white dark:bg-gray-900 text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">/ month</span>
            </div>
            
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-900/50 text-xs text-gray-500">
                <p><strong>Auto-Calculation:</strong></p>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>6-Month Plan: Rate × 6</li>
                    <li>Yearly Plan: Rate × 12</li>
                </ul>
            </div>
        </div>
    )
}