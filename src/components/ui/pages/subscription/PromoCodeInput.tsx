'use client'

import { useState } from 'react'
import { verifyPromoCode } from '@/actions/promo' 

type Props = {
    planCategory: string
    originalPrice: number
    onApply: (discount: number, code: string) => void
    onRemove: () => void
}

export default function PromoCodeInput({ planCategory, originalPrice, onApply, onRemove }: Props) {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'Applied' | 'Error'>('IDLE');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleApply = async () => {
        if (!code) return;
        
        setLoading(true);
        setMsg('');
        
        try {
            // Call Server Action
            const res = await verifyPromoCode(code, planCategory, originalPrice);

            if (res.success) {
                setStatus('Applied');
                // Ensure we handle the potentially undefined value safely
                const amount = res.discountAmount || 0; 
                setMsg(`Saved IDR ${amount.toLocaleString()}`);
                onApply(amount, code);
            } else {
                setStatus('Error');
                setMsg(res.message || "Invalid Code");
                onRemove();
            }
        } catch (err) {
            setStatus('Error');
            setMsg("Failed to verify code");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setStatus('IDLE');
        setCode('');
        setMsg('');
        onRemove();
    };

    // Handle "Enter" key press
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
        }
    };

    return (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 mt-4 transition-colors">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <i className="fa-solid fa-tag text-indigo-500"></i> 
                Promo Code
            </h4>
            
            <div className="flex gap-2">
                <input 
                    className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 uppercase font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="ENTER CODE"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={status === 'Applied' || loading}
                />
                
                {status === 'Applied' ? (
                    <button 
                        onClick={handleReset} 
                        className="px-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        title="Remove Promo"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                ) : (
                    <button 
                        onClick={handleApply} 
                        disabled={loading || !code}
                        className="px-4 py-2 bg-gray-900 dark:bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[80px]"
                    >
                        {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Apply'}
                    </button>
                )}
            </div>
            
            {/* Feedback Message */}
            {msg && (
                <p className={`text-xs mt-2 font-medium flex items-center gap-1 animate-fade-in ${
                    status === 'Applied' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-500 dark:text-red-400'
                }`}>
                    <i className={`fa-solid ${status === 'Applied' ? 'fa-check-circle' : 'fa-circle-exclamation'}`}></i>
                    {msg}
                </p>
            )}
        </div>
    )
}