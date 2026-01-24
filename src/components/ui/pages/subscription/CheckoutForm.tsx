'use client'

import { useState } from 'react'
import AddressForm from '@/components/ui/pages/forms/AddressForm'
import { createTransaction, createExpansionTransaction, renewSubscription } from '@/actions/payment'
import Script from 'next/script'
import PromoCodeInput from './PromoCodeInput' 

type Props = {
    userAddress: any
    plan: any
    expansionPacks: number
    mode?: 'NEW' | 'EXPANSION' | 'RENEW'
    remainingDays?: number 
}

declare global { interface Window { snap: any; } }

export default function CheckoutForm({ userAddress, plan, expansionPacks, mode = 'NEW', remainingDays = 0 }: Props) {
    const [useSavedAddress, setUseSavedAddress] = useState(!!userAddress);
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [discount, setDiscount] = useState(0);
    const [activePromo, setActivePromo] = useState('');

    // --- PRICE CALCULATION LOGIC ---
    
    // 1. Standard Cost (Full Duration) - Used for NEW and RENEW
    const multiplier = plan.duration === 'YEARLY' ? 12 : (plan.duration === 'SIX_MONTHS' ? 6 : 1);
    const baseCost = plan.price;
    const standardExpansionCost = plan.expansionPrice * multiplier * expansionPacks;

    // 2. Pro-Rated Cost (Remaining Days) - Used for EXPANSION only
    const pricePerDay = plan.expansionPrice / 30;
    const proRatedExpansionCost = Math.ceil(pricePerDay * remainingDays) * expansionPacks;

    // 3. Determine Final Raw Price
    let rawPrice = 0;
    let expansionDisplayPrice = 0;

    if (mode === 'EXPANSION') {
        rawPrice = proRatedExpansionCost;
        expansionDisplayPrice = proRatedExpansionCost;
    } else {
        // NEW or RENEW
        rawPrice = baseCost + standardExpansionCost;
        expansionDisplayPrice = standardExpansionCost;
    }

    const finalPrice = Math.max(0, rawPrice - discount);

    const handlePayment = async () => {
        if (!window.snap) {
            setGlobalError("Payment Gateway is still loading... please try again in 3 seconds.");
            return;
        }

        setLoading(true);
        setGlobalError(''); 

        try {
            let result: any; 
            const addressToSubmit = mode === 'RENEW' ? userAddress : (useSavedAddress ? userAddress : null); 

            // ✅ FIX: Routing to specific actions based on mode
            if (mode === 'EXPANSION') {
                result = await createExpansionTransaction(plan.id, expansionPacks, addressToSubmit, activePromo);
            } else if (mode === 'RENEW') {
                // Renewals use the dedicated function (Auto-Arrived, Stacked Time)
                result = await renewSubscription(plan.id, activePromo);
            } else {
                // New subscriptions (Shipped)
                result = await createTransaction(plan.id, expansionPacks, addressToSubmit, activePromo);
            }

            if (result.error) {
                setGlobalError(result.error);
                setLoading(false); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
                return;
            }

            if (result.status === 'free_activated') {
                window.location.href = '/dashboard/subscription/status';
                return;
            }

            if (result.token) {
                window.snap.pay(result.token, {
                    onSuccess: () => window.location.href = '/dashboard/subscription/status',
                    onPending: () => window.location.href = '/dashboard/subscription/status',
                    onError: () => {
                        setGlobalError("Payment failed or was declined.");
                        setLoading(false);
                    },
                    onClose: () => {
                        setGlobalError("You closed the payment popup.");
                        setLoading(false); 
                    }
                });
            } else {
                setGlobalError("Unexpected response from server.");
                setLoading(false);
            }

        } catch (error: any) {
            console.error(error);
            setGlobalError("An unexpected error occurred. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className={`grid grid-cols-1 ${mode === 'RENEW' ? 'max-w-xl mx-auto' : 'md:grid-cols-3 gap-8'}`}>
            <Script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} strategy="lazyOnload" />

            {/* LEFT COLUMN (Hidden for RENEW) */}
            {mode !== 'RENEW' && (
                <div className="md:col-span-2 space-y-6">
                    {globalError && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                            <i className="fa-solid fa-circle-exclamation text-red-600 dark:text-red-400 mt-1"></i>
                            <div>
                                <h4 className="font-bold text-red-600 dark:text-red-400 text-sm">Notice</h4>
                                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{globalError}</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Address Selection */}
                    {userAddress && (
                        <div className={`p-4 border rounded-xl bg-white dark:bg-gray-900 flex items-center justify-between cursor-pointer transition-colors ${useSavedAddress ? 'border-indigo-600 bg-indigo-50/10' : 'border-gray-200 dark:border-gray-800'}`} onClick={() => setUseSavedAddress(true)}>
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

                    <div className={`p-4 border rounded-xl bg-white dark:bg-gray-900 ${!useSavedAddress ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-200 dark:border-gray-800'}`}>
                        <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => setUseSavedAddress(false)}>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${!useSavedAddress ? 'border-indigo-600' : 'border-gray-400'}`}>
                                {!useSavedAddress && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                            </div>
                            <p className="font-bold text-gray-900 dark:text-white">Use Different Address</p>
                        </div>

                        {!useSavedAddress && (
                            <AddressForm initialData={null} buttonText="Proceed" onSave={() => {}} />
                        )}
                    </div>

                    <PromoCodeInput 
                        planId={plan.id}
                        expansionPacks={expansionPacks}
                        mode={mode === 'EXPANSION' ? 'EXPANSION' : 'NEW'} 
                        onApply={(amt, code) => { setDiscount(amt); setActivePromo(code); }}
                        onRemove={() => { setDiscount(0); setActivePromo(''); }}
                    />
                </div>
            )}

            {/* ORDER SUMMARY */}
            <div className={`${mode === 'RENEW' ? 'col-span-1' : 'md:col-span-1'}`}>
                {mode === 'RENEW' && globalError && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                        <i className="fa-solid fa-circle-exclamation text-red-600 dark:text-red-400 mt-1"></i>
                        <p className="text-red-600 dark:text-red-400 text-sm">{globalError}</p>
                    </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                        {mode === 'RENEW' ? 'Renew Subscription' : mode === 'EXPANSION' ? 'Add Expansion Packs' : 'Order Summary'}
                    </h3>
                    
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>{plan.name}</span>
                            <span>IDR {mode === 'EXPANSION' ? '0' : baseCost.toLocaleString('id-ID')}</span>
                        </div>
                        
                        {expansionPacks > 0 && (
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Expansion (x{expansionPacks})</span>
                                <span>IDR {expansionDisplayPrice.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        
                        {mode === 'EXPANSION' && (
                            <div className="text-xs text-gray-500 italic text-right">
                                Pro-rated for {remainingDays} days
                            </div>
                        )}

                        {discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600 font-medium animate-pulse">
                                <span>Discount ({activePromo})</span>
                                <span>- IDR {discount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                    
                    <div className="flex justify-between items-end mb-6">
                        <span className="font-bold text-gray-900 dark:text-white">Total Pay</span>
                        <div className="text-right">
                            {discount > 0 && (
                                <span className="block text-xs text-gray-400 line-through">
                                    IDR {rawPrice.toLocaleString('id-ID')}
                                </span>
                            )}
                            <span className="font-bold text-2xl text-indigo-600">
                                IDR {finalPrice.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>

                    {mode === 'RENEW' && (
                        <div className="mb-6">
                            <PromoCodeInput 
                                planId={plan.id}
                                expansionPacks={expansionPacks}
                                mode={'NEW'} 
                                onApply={(amt, code) => { setDiscount(amt); setActivePromo(code); }}
                                onRemove={() => { setDiscount(0); setActivePromo(''); }}
                            />
                        </div>
                    )}
                    
                    <button 
                        onClick={handlePayment}
                        disabled={loading || (mode !== 'RENEW' && !useSavedAddress && !userAddress)} 
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-700 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <i className="fa-solid fa-circle-notch fa-spin"></i> Processing...
                            </span>
                        ) : (
                            `Pay IDR ${finalPrice.toLocaleString('id-ID')}`
                        )}
                    </button>
                    
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <i className="fa-solid fa-lock"></i>
                        <span>Secure Payment by Midtrans</span>
                    </div>
                </div>
            </div>
        </div>
    )
}