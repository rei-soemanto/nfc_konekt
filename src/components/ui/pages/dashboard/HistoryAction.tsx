'use client'

import { useState } from 'react'
import { sendFriendRequest } from '@/actions/friend'

export default function HistoryAction({ targetUserId, isFriend, isPending }: { targetUserId: string, isFriend: boolean, isPending: boolean }) {
    const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'SENT'>(
        isFriend ? 'SENT' : isPending ? 'SENT' : 'IDLE'
    );

    const handleConnect = async () => {
        if (status !== 'IDLE') return;
        
        setStatus('PENDING');
        const res = await sendFriendRequest(targetUserId);
        
        if (res.success) {
            setStatus('SENT');
        } else {
            alert(res.error);
            setStatus('IDLE');
        }
    };

    if (isFriend) {
        return <span className="text-green-500 font-medium text-xs"><i className="fa-solid fa-check mr-1"></i> Connected</span>;
    }

    if (status === 'SENT' || isPending) {
        return <span className="text-gray-400 font-medium text-xs"><i className="fa-solid fa-clock mr-1"></i> Pending</span>;
    }

    return (
        <button 
            onClick={handleConnect}
            className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 hover:border-indigo-600 px-3 py-1 rounded-full transition-all"
        >
            {status === 'PENDING' ? 'Sending...' : '+ Connect'}
        </button>
    )
}