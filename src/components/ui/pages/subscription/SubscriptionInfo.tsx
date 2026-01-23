'use client'

import { useState } from 'react'
import { cancelSubscription } from '@/actions/subscription'
import Link from 'next/link'

type Props = {
    sub: {
        status: string
        startDate: string
        endDate: string
        expansionPacks: number
        planName: string
        planPrice: number
        planDurationLabel: string
        expansionPrice: number
        currency: string
        nextBillAmount: number
        nextBillDate: string
        remainingDays: number
        progressPercentage: number
    }
}

export default function SubscriptionInfo({ sub }: Props) {
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleCancel = async () => {
        setLoading(true);
        await cancelSubscription();
        setLoading(false);
        setIsCancelOpen(false);
    };

    const isCanceled = sub.status === 'CANCELED';
    const isExpired = sub.status === 'EXPIRED';

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900">
                {/* ✅ CHANGED: flex-col for mobile, md:flex-row for desktop */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{sub.planName}</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                isCanceled ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                isExpired ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                                {isCanceled ? 'Cancels Soon' : sub.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isCanceled 
                                ? `Access remains active until ${sub.endDate}.` 
                                : `Next billing cycle starts on ${sub.nextBillDate}.`
                            }
                        </p>
                    </div>
                    
                    {!isExpired && !isCanceled && (
                        <Link 
                            href="/dashboard/subscription/payment"
                            /* ✅ CHANGED: w-full for mobile tap target, md:w-auto for desktop */
                            className="w-full md:w-auto justify-center px-5 py-5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center"
                        >
                            <i className="fa-solid fa-arrow-up mr-2"></i>
                            Upgrade / Change Plan
                        </Link>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                
                {/* Left: Usage & Timeline */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 tracking-wider">Timeline</h3>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <span className="text-xs font-semibold inline-block text-indigo-600 dark:text-indigo-400">
                                    {sub.remainingDays} Days Left
                                </span>
                                <span className="text-xs font-semibold inline-block text-gray-500">
                                    {sub.endDate}
                                </span>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
                                <div 
                                    style={{ width: `${sub.progressPercentage}%` }} 
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-1000"
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-3 tracking-wider">Expansion Packs</h3>
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                    <i className="fa-solid fa-layer-group"></i>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{sub.expansionPacks} Active Pack(s)</p>
                                    <p className="text-xs text-gray-500">+{sub.expansionPacks * 10} Team Members</p>
                                </div>
                            </div>
                            <Link href="/dashboard/subscription/expansion" className="text-xs font-bold text-amber-700 hover:underline">
                                Buy More
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right: Billing Breakdown */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 tracking-wider">Next Bill Estimate</h3>
                    
                    {isCanceled ? (
                        <div className="text-center py-8">
                            <i className="fa-regular fa-circle-xmark text-3xl text-gray-300 mb-2"></i>
                            <p className="text-gray-500 font-medium">No future bill.</p>
                            <p className="text-xs text-gray-400">Subscription ends on {sub.endDate}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">{sub.planName} ({sub.planDurationLabel})</span>
                                <span className="font-mono font-medium dark:text-gray-300">
                                    {sub.currency} {sub.planPrice.toLocaleString('id-ID')}
                                </span>
                            </div>
                            
                            {sub.expansionPacks > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                        Expansion x {sub.expansionPacks} 
                                        <span className="text-xs block text-gray-400">({sub.currency} {sub.expansionPrice.toLocaleString('id-ID')} / pack)</span>
                                    </span>
                                    <span className="font-mono font-medium dark:text-gray-300">
                                        {sub.currency} {(sub.expansionPrice * sub.expansionPacks).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            )}

                            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>

                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900 dark:text-white">Total Due</span>
                                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                    {sub.currency} {sub.nextBillAmount.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <p className="text-xs text-right text-gray-400 mt-1">Due Date: {sub.nextBillDate}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Danger Zone */}
            {!isCanceled && !isExpired && (
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end">
                    <button 
                        onClick={() => setIsCancelOpen(true)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-2 rounded-lg transition-colors"
                    >
                        Cancel Subscription
                    </button>
                </div>
            )}

            {/* Confirmation Modal */}
            {isCancelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all scale-100">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cancel Subscription?</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Your subscription will remain active until <strong>{sub.endDate}</strong>. After that, your features will be locked immediately. There is no grace period.
                            </p>
                        </div>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsCancelOpen(false)}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-bold rounded-xl transition-colors"
                            >
                                Keep It
                            </button>
                            <button 
                                onClick={handleCancel}
                                disabled={loading}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center"
                            >
                                {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Yes, Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}