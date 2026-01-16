'use client'

import { useState } from 'react'

type CardOption = {
    id: string
    slug: string
    owner: string
}

export default function NFCWriter({ cards }: { cards: CardOption[] }) {
    const [selectedCard, setSelectedCard] = useState<string>('')
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE')
    const [message, setMessage] = useState('')

    const handleWrite = async () => {
        if (!selectedCard) {
            alert("Please select a card first");
            return;
        }

        // Check Browser Support (Only works on Chrome Android usually)
        if (!('NDEFReader' in window)) {
            setStatus('ERROR');
            setMessage("Web NFC is not supported on this device. Try Chrome on Android.");
            return;
        }

        try {
            setStatus('SCANNING');
            setMessage("Tap an NFC tag to write...");

            // @ts-ignore - TypeScript doesn't know NDEFReader yet
            const ndef = new NDEFReader();
            
            // FIX: Construct and Sanitize the URL
            // We use window.location.origin to get the current domain/IP
            const baseUrl = window.location.origin;
            const fullUrl = `${baseUrl}/p/${selectedCard}`.trim();

            await ndef.write({
                records: [{ 
                    recordType: "url", 
                    data: fullUrl 
                }]
            });

            setStatus('SUCCESS');
            setMessage(`Successfully wrote: ${fullUrl}`);

        } catch (error: any) {
            console.error(error);
            setStatus('ERROR');
            setMessage(error.message || "Failed to write. Ensure tag is formatted.");
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-lg mx-auto shadow-xl">
            <div className="text-center mb-8">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 transition-colors duration-500 ${
                    status === 'SCANNING' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                    status === 'SUCCESS' ? 'bg-green-100 text-green-600' :
                    status === 'ERROR' ? 'bg-red-100 text-red-600' :
                    'bg-indigo-100 text-indigo-600'
                }`}>
                    <i className={`fa-solid ${
                        status === 'SCANNING' ? 'fa-wifi' :
                        status === 'SUCCESS' ? 'fa-check' :
                        status === 'ERROR' ? 'fa-triangle-exclamation' :
                        'fa-pen-to-square'
                    }`}></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">NFC Writer</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                    Select a digital card and tap a physical tag to link them.
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Card Profile</label>
                    <div className="relative">
                        <select 
                            value={selectedCard}
                            onChange={(e) => setSelectedCard(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
                            disabled={status === 'SCANNING'}
                        >
                            <option value="">-- Select a User --</option>
                            {cards.map(card => (
                                <option key={card.id} value={card.slug}>
                                    {card.owner} ({card.slug})
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                            <i className="fa-solid fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                </div>

                {/* Status Box */}
                {message && (
                    <div className={`p-4 rounded-lg text-sm text-center font-medium ${
                        status === 'ERROR' ? 'bg-red-50 text-red-700 border border-red-100' : 
                        status === 'SUCCESS' ? 'bg-green-50 text-green-700 border border-green-100' : 
                        'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                        {message}
                    </div>
                )}

                <button
                    onClick={handleWrite}
                    disabled={status === 'SCANNING' || !selectedCard}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] ${
                        status === 'SCANNING' 
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/25'
                    }`}
                >
                    {status === 'SCANNING' ? 'Ready to Tap...' : 'Write to Tag'}
                </button>
                
                <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
                    <i className="fa-brands fa-chrome mr-1"></i> Use Chrome on Android with HTTPS (or localhost)
                </p>
            </div>
        </div>
    )
}