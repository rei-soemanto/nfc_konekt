'use client'

import { useState } from 'react'
import Script from 'next/script'
import { createTransaction } from '@/actions/payment'

declare global {
    interface Window {
        snap: any;
    }
}

// Plan type matches Prisma model + optional features json
type Plan = {
    id: string
    name: string
    price: number
    description: string | null
    durationDays: number
}

export default function SubscriptionPlans({ plans, userId }: { plans: Plan[], userId: string }) {
    const [loading, setLoading] = useState<string | null>(null);

    const handleSelectPlan = async (plan: Plan) => {
        setLoading(plan.id);

        try {
            // FIX: Call correct function name
            const { token, status } = await createTransaction(plan.id);

            if (status === 'free_activated') {
                alert("Plan activated successfully!");
                window.location.href = '/dashboard/subscription/status';
                return;
            }

            if (token && window.snap) {
                window.snap.pay(token, {
                    onSuccess: function() {
                        alert("Payment Success!");
                        window.location.href = '/dashboard/subscription/status';
                    },
                    onPending: function() {
                        alert("Waiting for payment...");
                    },
                    onError: function() {
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
            <Script 
                src="https://app.sandbox.midtrans.com/snap/snap.js"
                data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
                strategy="lazyOnload"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div 
                        key={plan.id} 
                        className="relative p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-500 transition-all flex flex-col"
                    >
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                            <div className="flex items-baseline">
                                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                    {plan.price === 0 ? 'Free' : `IDR ${plan.price.toLocaleString()}`}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 ml-2">/ {plan.durationDays} days</span>
                            </div>
                            <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                        </div>

                        <div className="mt-auto">
                            <button 
                                onClick={() => handleSelectPlan(plan)}
                                disabled={loading !== null}
                                className="w-full py-3 px-4 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50"
                            >
                                {loading === plan.id ? <i className="fa-solid fa-circle-notch fa-spin"></i> : "Select Plan"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}