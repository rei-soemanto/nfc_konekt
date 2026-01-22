'use client'

import { useState } from 'react'
import { updateShipmentStatus, updateTrackingLink, markTransactionAsRead } from '@/actions/admin-transactions'
import { getDesignById } from '@/lib/designs'

type Member = { fullName: string, email: string }
type Transaction = {
    id: string
    isNew: boolean
    shipmentStatus: string
    trackingLink: string | null
    shippingAddress: string | null
    pendingTeamData: string | null 
    amount: number
    cardDesign: string | null
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
        if (tx.isNew) await markTransactionAsRead(tx.id);
    };

    const handleStatusUpdate = async (subId: string, newStatus: string) => {
        setLoading(subId);
        await updateShipmentStatus(subId, newStatus);
        setLoading(null);
    };

    const handleSaveTracking = async () => {
        if (!selectedTx) return;
        await updateTrackingLink(selectedTx.id, trackingInput);
        setSelectedTx({ ...selectedTx, trackingLink: trackingInput });
        alert("Tracking link saved!");
    };

    // --- NEW: CSV DOWNLOAD LOGIC ---
    const handleDownloadCSV = () => {
        if (!selectedTx || !selectedTx.pendingTeamData) return;

        try {
            const data = JSON.parse(selectedTx.pendingTeamData);
            
            // 1. Create CSV Header and Rows
            const csvRows = [];
            csvRows.push(['Full Name', 'Email', 'Job Title', 'Note']); // Header

            data.forEach((member: any) => {
                const row = [
                    `"${member.fullName}"`, // Quote strings to handle commas in names
                    `"${member.email}"`,
                    `"${member.jobTitle || ''}"`,
                    `"${member.note || ''}"`
                ];
                csvRows.push(row.join(','));
            });

            // 2. Create Blob and Link
            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.href = url;
            a.download = `manifest-${selectedTx.id}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Failed to generate CSV", error);
            alert("Error generating CSV file.");
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase font-bold text-xs border-b border-gray-100 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-4 w-4"></th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Plan</th>
                            <th className="px-6 py-4">Design</th>
                            <th className="px-6 py-4">Address</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {transactions.map((tx: Transaction) => {
                            // ... (Existing mapping logic remains exactly the same) ...
                            const address = tx.shippingAddress ? JSON.parse(tx.shippingAddress) : {};
                            
                            let designPreview = null;
                            let designName = "Standard";

                            if (tx.cardDesign) {
                                if (tx.cardDesign.startsWith('TEMPLATE:')) {
                                    const templateId = tx.cardDesign.split(':')[1];
                                    const template = getDesignById(templateId);
                                    if (template) {
                                        designName = template.name;
                                        designPreview = template.image;
                                    }
                                } else if (tx.cardDesign.startsWith('CUSTOM:')) {
                                    designName = "Custom Upload";
                                    const designData = tx.cardDesign.substring(7);
                                    if (designData.startsWith('data:image')) {
                                        designPreview = designData;
                                    }
                                }
                            }

                            return (
                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        {tx.isNew && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm animate-pulse"></div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{tx.user.fullName}</div>
                                        <div className="text-xs text-gray-400">{tx.user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{tx.plan?.name || "N/A"}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-6 rounded border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                                                {designPreview ? (
                                                    <img src={designPreview} alt="Design" className="w-full h-full object-cover" />
                                                ) : (
                                                    <i className="fa-solid fa-file-arrow-up text-gray-400"></i>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{designName}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-[120px] truncate text-xs text-gray-500" title={address.city}>
                                            {address.city ? `${address.city}, ${address.country}` : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300 text-xs">
                                        {tx.amount === 0 ? (
                                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">FREE</span>
                                        ) : (
                                            `IDR ${tx.amount.toLocaleString('id-ID')}`
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <select 
                                            value={tx.shipmentStatus}
                                            onChange={(e) => handleStatusUpdate(tx.id, e.target.value)}
                                            disabled={loading === tx.id}
                                            className={`border rounded px-2 py-1 text-xs font-bold w-24 ${
                                                tx.shipmentStatus === 'ARRIVED' ? 'bg-green-100 text-green-700 border-green-200' :
                                                tx.shipmentStatus === 'SHIPPING' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                tx.shipmentStatus === 'PROCESSING' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                                'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="PROCESSING">Process</option>
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
            </div>

            {/* DETAIL MODAL */}
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
                            
                            {/* SHIPMENT MANIFEST (WITH DOWNLOAD BUTTON) */}
                            {selectedTx.pendingTeamData && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-4 rounded-xl">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center">
                                            <i className="fa-solid fa-box-open mr-2"></i>
                                            Pending Shipment Request
                                        </h3>
                                        
                                        {/* --- DOWNLOAD CSV BUTTON --- */}
                                        <button 
                                            onClick={handleDownloadCSV}
                                            className="text-xs bg-white dark:bg-blue-900 text-blue-600 dark:text-blue-200 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700 font-bold hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center"
                                        >
                                            <i className="fa-solid fa-file-csv mr-2"></i>
                                            Download CSV
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
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
                                </div>
                            )}

                            {/* Rest of the Modal (Plan, Design, Address, Tracking) */}
                            {/* ... (This part remains exactly the same as your previous code) ... */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Plan</label>
                                        <p className="font-bold text-lg text-indigo-600">{selectedTx.plan?.name || "Deleted Plan"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Purchaser</label>
                                        <p className="font-bold text-gray-900 dark:text-white">{selectedTx.user.fullName}</p>
                                        <p className="text-xs text-gray-400">{selectedTx.user.email}</p>
                                    </div>
                                </div>

                                {/* Design Info */}
                                {(() => {
                                    let modalDesignPreview = null;
                                    let modalDesignName = "Standard";
                                    let modalDownloadUrl = null;

                                    if (selectedTx.cardDesign) {
                                        if (selectedTx.cardDesign.startsWith('TEMPLATE:')) {
                                            const templateId = selectedTx.cardDesign.split(':')[1];
                                            const template = getDesignById(templateId);
                                            if (template) {
                                                modalDesignName = template.name;
                                                modalDesignPreview = template.image;
                                                modalDownloadUrl = template.image;
                                            }
                                        } else if (selectedTx.cardDesign.startsWith('CUSTOM:')) {
                                            modalDesignName = "Custom Upload";
                                            const designData = selectedTx.cardDesign.substring(7);
                                            if (designData.startsWith('data:image')) {
                                                modalDesignPreview = designData;
                                                modalDownloadUrl = designData;
                                            }
                                        }
                                    }

                                    return (
                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col gap-3">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase">Selected Design</h3>
                                            <div className="flex items-start gap-4">
                                                <div className="w-24 h-16 bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm flex-shrink-0 flex items-center justify-center">
                                                    {modalDesignPreview ? (
                                                        <img src={modalDesignPreview} alt="Design" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <i className="fa-solid fa-image text-gray-400"></i>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{modalDesignName}</p>
                                                    {modalDownloadUrl ? (
                                                        <a 
                                                            href={modalDownloadUrl} 
                                                            download={`design-${selectedTx.id}.png`}
                                                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                        >
                                                            <i className="fa-solid fa-download"></i> Download Asset
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic mt-1 block">No asset available</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Shipping Address */}
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

                            {/* Tracking Link */}
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
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}