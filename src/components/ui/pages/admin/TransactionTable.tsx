'use client'

import { useState } from 'react'
import { updateShipmentStatus, updateTrackingLink, markTransactionAsRead } from '@/actions/admin-transactions'

// Helper Types matching your Prisma Transaction + Relations
type Member = { fullName: string, email: string }
type Transaction = {
    id: string
    isNew: boolean
    shipmentStatus: string
    trackingLink: string | null
    shippingAddress: string | null
    pendingTeamData: string | null 
    plan: { name: string } | null
    user: { 
        fullName: string, 
        email: string, 
        members: Member[] 
    }
}

export default function TransactionTable({ transactions }: { transactions: any[] }) {
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState<string | null>(null);
    const [trackingInput, setTrackingInput] = useState('');

    // --- ACTIONS ---

    const handleOpenDetail = async (tx: Transaction) => {
        setSelectedTx(tx);
        setTrackingInput(tx.trackingLink || '');
        
        // Mark as Read immediately if it's new
        if (tx.isNew) {
            await markTransactionAsRead(tx.id);
        }
    };

    const handleStatusUpdate = async (subId: string, newStatus: string) => {
        setLoading(subId);
        await updateShipmentStatus(subId, newStatus);
        setLoading(null);
    };

    const handleSaveTracking = async () => {
        if (!selectedTx) return;
        await updateTrackingLink(selectedTx.id, trackingInput);
        // Update local state to reflect change without reload
        setSelectedTx({ ...selectedTx, trackingLink: trackingInput });
        alert("Tracking link saved!");
    };

    // --- RENDER ---

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase font-bold text-xs">
                    <tr>
                        <th className="px-6 py-4 w-10"></th> 
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Plan</th>
                        <th className="px-6 py-4">Address</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {transactions.map((tx: Transaction) => {
                        const address = tx.shippingAddress ? JSON.parse(tx.shippingAddress) : {};
                        return (
                            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    {tx.isNew && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm animate-pulse" title="New Transaction"></div>
                                    )}
                                </td>
                                
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900 dark:text-white">{tx.user.fullName}</div>
                                    <div className="text-xs text-gray-400">{tx.user.email}</div>
                                </td>
                                
                                <td className="px-6 py-4">{tx.plan?.name || 'Unknown Plan'}</td>
                                
                                <td className="px-6 py-4">
                                    <div className="max-w-xs truncate text-xs text-gray-500">
                                        {address.city ? `${address.city}, ${address.country}` : 'No Address'}
                                    </div>
                                </td>
                                
                                <td className="px-6 py-4">
                                    <select 
                                        value={tx.shipmentStatus}
                                        onChange={(e) => handleStatusUpdate(tx.id, e.target.value)}
                                        disabled={loading === tx.id}
                                        className={`border rounded px-2 py-1 text-xs font-bold ${
                                            tx.shipmentStatus === 'ARRIVED' ? 'bg-green-100 text-green-700 border-green-200' :
                                            tx.shipmentStatus === 'SHIPPING' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                            tx.shipmentStatus === 'PROCESSING' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                            'bg-gray-100 text-gray-600 border-gray-200'
                                        }`}
                                    >
                                        <option value="PENDING">Pending (Unpaid)</option>
                                        <option value="PROCESSING">Processing</option>
                                        <option value="SHIPPING">Shipping</option>
                                        <option value="ARRIVED">Arrived</option>
                                    </select>
                                </td>
                                
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleOpenDetail(tx)}
                                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        Details
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            {/* --- DETAIL MODAL --- */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900 sticky top-0">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction Details</h2>
                                <p className="text-xs text-gray-500 font-mono mt-1">ID: {selectedTx.id}</p>
                            </div>
                            <button onClick={() => setSelectedTx(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-gray-200 text-gray-500 shadow-sm border border-gray-200">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            
                            {/* SHIPMENT MANIFEST (The Request) */}
                            {selectedTx.pendingTeamData && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-4 rounded-xl">
                                    <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                                        <i className="fa-solid fa-box-open mr-2"></i>
                                        Pending Shipment Request
                                    </h3>
                                    <div className="space-y-2">
                                        {JSON.parse(selectedTx.pendingTeamData).map((item: any, idx: number) => (
                                            <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-800/50 flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{item.fullName}</p>
                                                    <p className="text-xs text-gray-500">{item.email}</p>
                                                    {item.note && <p className="text-xs text-indigo-600 mt-1 italic">{item.note}</p>}
                                                </div>
                                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                    NEEDS CARD
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-blue-600/70 mt-3">
                                        These items are requested for shipment in this transaction batch.
                                    </p>
                                </div>
                            )}

                            {/* 1. Plan & User Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Plan</label>
                                    <p className="font-bold text-lg text-indigo-600">{selectedTx.plan?.name || "Deleted Plan"}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Purchaser (Parent)</label>
                                    <p className="font-bold text-gray-900 dark:text-white">{selectedTx.user.fullName}</p>
                                    <p className="text-xs text-gray-400">{selectedTx.user.email}</p>
                                </div>
                            </div>

                            {/* 2. Shipping Address */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                                    <i className="fa-solid fa-location-dot mr-2 text-gray-400"></i>
                                    Shipping Address
                                </h3>
                                {selectedTx.shippingAddress ? (() => {
                                    const addr = JSON.parse(selectedTx.shippingAddress);
                                    return (
                                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                            <p>{addr.street}</p>
                                            <p>{addr.city}, {addr.region}, {addr.postalCode}</p>
                                            <p className="font-bold">{addr.country}</p>
                                        </div>
                                    )
                                })() : (
                                    <p className="text-sm text-gray-400 italic">No address provided.</p>
                                )}
                            </div>

                            {/* 3. Tracking Link (Editable) */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Tracking Information</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={trackingInput} 
                                        onChange={(e) => setTrackingInput(e.target.value)}
                                        placeholder="Paste courier tracking URL here..."
                                        className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <button 
                                        onClick={handleSaveTracking}
                                        className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    User will see this link in their dashboard if shipment status is 'SHIPPING'.
                                </p>
                            </div>

                            {/* 4. Member List (Reference) */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                                    Account Members
                                </h3>
                                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                                    <table className="w-full text-sm text-left">
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {/* Parent */}
                                            <tr className="bg-gray-50 dark:bg-gray-800">
                                                <td className="px-4 py-2 font-medium">{selectedTx.user.fullName}</td>
                                                <td className="px-4 py-2 text-gray-500">{selectedTx.user.email}</td>
                                                <td className="px-4 py-2"><span className="text-xs font-bold text-indigo-600">Admin</span></td>
                                            </tr>
                                            {/* Children */}
                                            {selectedTx.user.members.map((member, i) => (
                                                <tr key={i}>
                                                    <td className="px-4 py-2">{member.fullName}</td>
                                                    <td className="px-4 py-2 text-gray-500">{member.email}</td>
                                                    <td className="px-4 py-2"><span className="text-xs text-gray-400">Member</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}