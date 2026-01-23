'use client'

import { useState } from 'react'
import AddressForm from '@/components/ui/pages/forms/AddressForm'
import { createTransaction, createExpansionTransaction } from '@/actions/payment'
import Script from 'next/script'
import PromoCodeInput from './PromoCodeInput' 

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
    
    // 1. ADD ERROR STATE
    const [globalError, setGlobalError] = useState('');

    const [discount, setDiscount] = useState(0);
    const [activePromo, setActivePromo] = useState('');

    const multiplier = plan.duration === 'YEARLY' ? 12 : (plan.duration === 'SIX_MONTHS' ? 6 : 1);
    const expansionCost = plan.expansionPrice * multiplier * expansionPacks;
    const baseCost = plan.price;
    const rawPrice = mode === 'EXPANSION' ? expansionCost : (baseCost + expansionCost);
    const finalPrice = Math.max(0, rawPrice - discount);

    const handlePayment = async (addressSnapshot: any) => {
        // 🔒 SAFETY CHECK 1: Ensure Midtrans is ready
        if (!window.snap) {
            setGlobalError("Payment Gateway is still loading... please try again in 3 seconds.");
            return;
        }

        setLoading(true);
        setGlobalError(''); 

        try {
            // Explicitly type as 'any' to handle mixed return types
            let result: any; 
            
            if (mode === 'EXPANSION') {
                result = await createExpansionTransaction(plan.id, expansionPacks, addressSnapshot, activePromo);
            } else {
                result = await createTransaction(plan.id, expansionPacks, addressSnapshot, activePromo);
            }

            // 2. CHECK FOR SERVER ERROR
            if (result.error) {
                setGlobalError(result.error);
                setLoading(false); // Stop loading!
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
                return;
            }

            // 3. HANDLE FREE ACTIVATION
            if (result.status === 'free_activated') {
                window.location.href = '/dashboard/subscription/status';
                return;
            }

            // 4. HANDLE MIDTRANS POPUP
            if (result.token) {
                window.snap.pay(result.token, {
                    onSuccess: () => window.location.href = '/dashboard/subscription/status',
                    onPending: () => window.location.href = '/dashboard/subscription/status',
                    onError: () => {
                        setGlobalError("Payment failed or was declined.");
                        setLoading(false);
                    },
                    // 🔒 SAFETY CHECK 2: Handle Popup Close
                    onClose: () => {
                        setGlobalError("You closed the payment popup.");
                        setLoading(false); // Stop loading if they close it!
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} strategy="lazyOnload" />

            {/* LEFT COLUMN */}
            <div className="md:col-span-2 space-y-6">
                
                {/* 3. SHOW ERROR POP-UP / ALERT */}
                {globalError && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 animate-fade-in">
                        <i className="fa-solid fa-circle-exclamation text-red-600 dark:text-red-400 mt-1"></i>
                        <div>
                            <h4 className="font-bold text-red-600 dark:text-red-400 text-sm">Notice</h4>
                            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{globalError}</p>
                        </div>
                    </div>
                )}
                
                {/* --- ADDRESS SECTION --- */}
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
                        <AddressForm 
                            initialData={null}
                            buttonText="Proceed" 
                            onSave={() => {}} 
                        />
                    )}
                </div>

                {/* ✅ 5. PROMO CODE COMPONENT */}
                <PromoCodeInput 
                    planCategory={mode === 'EXPANSION' ? 'EXPANSION' : plan.category}
                    originalPrice={rawPrice}
                    onApply={(amt, code) => { setDiscount(amt); setActivePromo(code); }}
                    onRemove={() => { setDiscount(0); setActivePromo(''); }}
                />

            </div>

            {/* RIGHT COLUMN: Order Summary */}
            <div className="md:col-span-1">
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl sticky top-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Order Summary</h3>
                    
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>{mode === 'EXPANSION' ? 'Expansion Pack' : plan.name}</span>
                            <span>IDR {rawPrice.toLocaleString('id-ID')}</span>
                        </div>
                        
                        {/* ✅ 6. SHOW DISCOUNT IN SUMMARY */}
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
                    
                    <button 
                        onClick={() => handlePayment(userAddress)}
                        disabled={loading || (!useSavedAddress && !userAddress)} 
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
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