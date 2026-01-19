'use client'

import { useState, useMemo } from 'react'

type CardOption = {
    id: string
    slug: string
    owner: string
    email: string
}

export default function NFCWriter({ cards }: { cards: CardOption[] }) {
    const [selectedSlug, setSelectedSlug] = useState<string>('')
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE')
    const [message, setMessage] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    // Filter cards based on search
    const filteredCards = useMemo(() => {
        if (!searchTerm) return cards;
        const lower = searchTerm.toLowerCase();
        return cards.filter(c => 
            c.owner.toLowerCase().includes(lower) || 
            c.email.toLowerCase().includes(lower) ||
            c.slug.toLowerCase().includes(lower)
        );
    }, [cards, searchTerm]);

    const handleWrite = async () => {
        if (!selectedSlug) {
            alert("Please select a card first");
            return;
        }
        if (!('NDEFReader' in window)) {
            const proceed = confirm("Web NFC not detected. Attempt writing anyway?");
            if (!proceed) return;
        }

        try {
            setStatus('SCANNING');
            setMessage("Tap an NFC tag to write...");

            // @ts-ignore
            const ndef = new NDEFReader();
            const fullUrl = `${window.location.origin}/p/${selectedSlug}`.trim();

            await ndef.write({
                records: [{ recordType: "url", data: fullUrl }]
            });

            setStatus('SUCCESS');
            setMessage(`Successfully wrote: ${fullUrl}`);
        } catch (error: any) {
            console.error(error);
            setStatus('ERROR');
            setMessage(error.message || "Writing failed.");
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-xl">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Profile</label>
                    
                    {/* Search Input */}
                    <div className="relative mb-2">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input 
                            type="text" 
                            placeholder="Search Name or Email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="relative">
                        <select 
                            value={selectedSlug}
                            onChange={(e) => setSelectedSlug(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none"
                            disabled={status === 'SCANNING'}
                        >
                            <option value="">-- Select a User --</option>
                            {filteredCards.map(card => (
                                <option key={card.id} value={card.slug}>
                                    {card.owner} ({card.email})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg text-sm text-center font-medium ${
                        status === 'ERROR' ? 'bg-red-50 text-red-700' : 
                        status === 'SUCCESS' ? 'bg-green-50 text-green-700' : 
                        'bg-blue-50 text-blue-700'
                    }`}>
                        {message}
                    </div>
                )}

                <button
                    onClick={handleWrite}
                    disabled={status === 'SCANNING' || !selectedSlug}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                        status === 'SCANNING' ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                    {status === 'SCANNING' ? 'Ready to Tap...' : 'Write to Tag'}
                </button>
            </div>
        </div>
    )
}