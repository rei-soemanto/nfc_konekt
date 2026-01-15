'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import { createSubscriptionToken } from '@/actions/payment'

// Add Midtrans to Window type
declare global {
    interface Window {
        snap: any;
    }
}

type Plan = {
    id: string
    name: string
    price: string
    numericPrice: number
    features: string[]
    recommended?: boolean
}

export default function SubscriptionPlans({ userId }: { userId: string }) {
    const [loading, setLoading] = useState<string | null>(null);

    const plans: Plan[] = [
        {
            id: 'PERSONAL',
            name: 'Personal',
            price: 'Free',
            numericPrice: 0,
            features: ['1 Digital Profile', 'Basic Analytics', 'Standard Support']
        },
        {
            id: 'GROUP',
            name: 'Group',
            price: 'IDR 290k',
            numericPrice: 290000,
            features: ['5 Digital Profiles', 'Team Analytics', 'Priority Support', 'Custom Branding'],
            recommended: true
        },
        {
            id: 'COMPANY',
            name: 'Company',
            price: 'IDR 990k',
            numericPrice: 990000,
            features: ['Unlimited Profiles', 'Admin Dashboard', 'API Access', 'Dedicated Manager']
        }
    ];

    const handleSelectPlan = async (plan: Plan) => {
        setLoading(plan.id);

        try {
            // 1. Call Server Action
            const { token, status } = await createSubscriptionToken(plan.id, userId);

            if (status === 'free_activated') {
                alert("Free plan activated!");
                window.location.reload();
                return;
            }

            // 2. Trigger Midtrans Snap Popup
            if (token && window.snap) {
                window.snap.pay(token, {
                    onSuccess: function(result: any) {
                        // TODO: Call an action to update DB status to ACTIVE
                        alert("Payment Success!");
                        window.location.href = '/dashboard/subscription/status';
                    },
                    onPending: function(result: any) {
                        alert("Waiting for payment...");
                    },
                    onError: function(result: any) {
                        alert("Payment failed!");
                    },
                    onClose: function() {
                        alert('You closed the popup without finishing the payment');
                    }
                });
            }
        } catch (error) {
            console.error(error);
            alert("Failed to process transaction.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <>
            {/* Midtrans Script - Replace client-key with your env variable */}
            <Script 
                src="https://app.sandbox.midtrans.com/snap/snap.js"
                data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "YOUR_CLIENT_KEY"}
                strategy="lazyOnload"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div 
                        key={plan.id} 
                        className={`relative p-8 rounded-2xl border transition-all duration-300 flex flex-col ${
                            plan.recommended 
                                ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/10 ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/10' 
                                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                    >
                        {plan.recommended && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                                Recommended
                            </div>
                        )}

                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                            <div className="flex items-baseline">
                                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                                {plan.numericPrice > 0 && <span className="text-gray-500 dark:text-gray-400 ml-2">/month</span>}
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start">
                                    <div className="shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                                        <i className="fa-solid fa-check text-xs text-green-600 dark:text-green-400"></i>
                                    </div>
                                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button 
                            onClick={() => handleSelectPlan(plan)}
                            disabled={loading !== null}
                            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${
                                plan.recommended 
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                            } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading === plan.id ? (
                                <i className="fa-solid fa-circle-notch fa-spin"></i>
                            ) : (
                                "Select Plan"
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </>
    )
}