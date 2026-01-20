'use client'

import { useState } from 'react'
import { addToConnect } from '@/actions/connection' // <--- CHANGED IMPORT

// Simplified props: no more 'isPending'
export default function HistoryAction({ targetUserId, isConnected, hasSubscription }: { targetUserId: string, isConnected: boolean, hasSubscription: boolean }) {
    const [status, setStatus] = useState<'IDLE' | 'CONNECTED'>('IDLE');
    const [loading, setLoading] = useState(false);

    // If already connected from server props, show that state
    if (isConnected || status === 'CONNECTED') {
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <i className="fa-solid fa-check mr-1"></i> Connected
            </span>
        )
    }

    const handleConnect = async () => {
        if (!hasSubscription) {
            alert("You need an active subscription to connect with people.");
            return;
        }

        setLoading(true);
        try {
            const result = await addToConnect(targetUserId);
            if (result.success) {
                setStatus('CONNECTED');
            } else {
                alert(result.error || "Failed to connect");
            }
        } catch (error) {
            alert("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={handleConnect}
            disabled={loading || !hasSubscription}
            className={`flex items-center px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                hasSubscription 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
            }`}
            title={hasSubscription ? "Add to connections" : "Subscription required"}
        >
            {loading ? (
                <i className="fa-solid fa-circle-notch fa-spin"></i>
            ) : (
                <>
                    <i className={`fa-solid ${hasSubscription ? 'fa-user-plus' : 'fa-lock'} mr-2`}></i>
                    {hasSubscription ? 'Connect' : 'Locked'}
                </>
            )}
        </button>
    )
}