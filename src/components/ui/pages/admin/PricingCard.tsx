'use client'

import { useState } from 'react'
import { updatePlanPrice } from '@/actions/admin-plans'
import { DURATION_CONFIG } from '@/lib/plans'

// Using 'any' for plan to avoid strict Prisma Enum import issues on client
type Props = {
    plan: any 
}

export default function PricingCard({ plan }: Props) {
    const [price, setPrice] = useState(plan.price)
    const [loading, setLoading] = useState(false)
    const [isDirty, setIsDirty] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        try {
            await updatePlanPrice(plan.id, Number(price))
            setIsDirty(false)
        } catch (error) {
            alert("Failed to update price")
        } finally {
            setLoading(false)
        }
    }

    // Safe label access
    // @ts-ignore
    const label = DURATION_CONFIG[plan.duration]?.label || plan.duration;

    return (
        <div className="flex flex-col gap-3 p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 mr-3">
                        <i className="fa-regular fa-clock text-xs"></i>
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                        {label}
                    </span>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={!isDirty || loading}
                    className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${
                        isDirty 
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-default'
                    }`}
                >
                    {loading ? <i className="fa-solid fa-circle-notch fa-spin text-xs"></i> : <i className="fa-solid fa-check text-xs"></i>}
                </button>
            </div>

            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold uppercase">Base</span>
                <input 
                    type="number"
                    value={price}
                    onChange={(e) => { setPrice(Number(e.target.value)); setIsDirty(true); }}
                    className="w-full pl-12 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>
        </div>
    )
}