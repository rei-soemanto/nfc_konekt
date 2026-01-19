'use client'

import { useState } from 'react'
import AddressForm from '@/components/ui/pages/forms/AddressForm'
import { createTransaction, createExpansionTransaction } from '@/actions/payment'
import Script from 'next/script'

type Props = {
    userAddress: any
    plan: any
    expansionPacks: number
    mode?: 'NEW' | 'EXPANSION'
}

declare global { interface Window { snap: any; } }

export default function CheckoutForm({ userAddress, plan, expansionPacks, mode = 'NEW' }: Props) {
    const [useSavedAddress, setUseSavedAddress] = useState(!!userAddress);
    const [loading, setLoading] = useState(false);

    // HELPER: Duration Multiplier
    const isYearly = plan.duration === 'YEARLY';
    const months = isYearly ? 12 : 1; // Adjust based on your DURATION_CONFIG logic if needed
    // Or better, rely on what passed in plan if formatted, but raw plan usually needs helper.
    // Assuming simple logic for now:
    const multiplier = plan.duration === 'YEARLY' ? 12 : (plan.duration === 'SIX_MONTHS' ? 6 : 1);

    // 1. CALCULATE CORRECT PRICE
    const expansionCost = plan.expansionPrice * multiplier * expansionPacks;
    const baseCost = plan.price;
    
    const displayPrice = mode === 'EXPANSION' 
        ? expansionCost 
        : baseCost + expansionCost;

    const handlePayment = async (addressSnapshot: any) => {
        setLoading(true);
        try {
            let result;
            
            if (mode === 'EXPANSION') {
                // Charge ONLY Expansion
                result = await createExpansionTransaction(plan.id, expansionPacks, addressSnapshot);
            } else {
                // Charge Base + Expansion
                result = await createTransaction(plan.id, expansionPacks, addressSnapshot);
            }

            if (result.token && window.snap) {
                window.snap.pay(result.token, {
                    onSuccess: () => window.location.href = '/dashboard/subscription/status',
                    onPending: () => window.location.href = '/dashboard/subscription/status',
                    onError: () => alert("Payment failed")
                });
            }
        } catch (error) {
            console.error(error);
            alert("Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} strategy="lazyOnload" />

            <div className="md:col-span-2 space-y-6">
                {/* Toggle Address Logic */}
                {userAddress && (
                    <div className="p-4 border rounded-xl bg-white dark:bg-gray-900 flex items-center justify-between cursor-pointer" onClick={() => setUseSavedAddress(true)}>
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${useSavedAddress ? 'border-indigo-600' : 'border-gray-400'}`}>
                                {useSavedAddress && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">Use Registered Address</p>
                                <p className="text-sm text-gray-500">{userAddress.street}, {userAddress.city}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`p-4 border rounded-xl bg-white dark:bg-gray-900 ${!useSavedAddress ? 'ring-2 ring-indigo-500' : ''}`}>
                    <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => setUseSavedAddress(false)}>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${!useSavedAddress ? 'border-indigo-600' : 'border-gray-400'}`}>
                            {!useSavedAddress && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white">Use Different Address</p>
                    </div>

                    {!useSavedAddress && (
                        <AddressForm 
                            initialData={null}
                            buttonText="Proceed to Payment"
                            onSave={() => { /* Handled by parent logic usually or internal state */ }}
                        />
                    )}
                </div>
            </div>

            {/* SUMMARY SECTION */}
            <div className="md:col-span-1">
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl sticky top-6">
                    <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                    
                    {/* 2. DYNAMIC LABEL & PRICE */}
                    <div className="flex justify-between mb-2">
                        <span className="font-medium">
                            {mode === 'EXPANSION' ? 'Additional Packs' : plan.name}
                        </span>
                        <span className="font-bold text-indigo-600">
                            IDR {displayPrice.toLocaleString('id-ID')}
                        </span>
                    </div>

                    {/* Breakdown Details */}
                    {mode !== 'EXPANSION' && expansionPacks > 0 && (
                        <div className="flex justify-between mb-2 text-sm text-gray-500">
                            <span>Includes Expansion x{expansionPacks}</span>
                            <span>Included</span>
                        </div>
                    )}
                    
                    {mode === 'EXPANSION' && (
                        <div className="text-xs text-gray-500 mt-2 border-t pt-2">
                            Adding <strong>{expansionPacks} pack(s)</strong> to your existing plan.
                        </div>
                    )}

                    <div className="border-t my-4"></div>
                    
                    {useSavedAddress ? (
                        <button 
                            onClick={() => handlePayment(userAddress)}
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg"
                        >
                            {loading ? 'Processing...' : `Pay IDR ${displayPrice.toLocaleString('id-ID')}`}
                        </button>
                    ) : (
                        <p className="text-xs text-center text-gray-500">
                            Select an address to continue.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}