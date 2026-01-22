'use client'

import { useState, useEffect } from 'react'

type Member = { id: string, name: string, slug: string }

export default function NFCWriterClient({ members }: { members: Member[] }) {
    // Fallback to first member's slug if available
    const [selectedSlug, setSelectedSlug] = useState(members[0]?.slug || '')
    
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE')
    const [errorMsg, setErrorMsg] = useState('')
    const [isAndroid, setIsAndroid] = useState(true) 
    const [previewUrl, setPreviewUrl] = useState('') 

    // 1. Security Check: Enforce Android for Corporate
    useEffect(() => {
        const checkDevice = () => {
            if (typeof navigator !== 'undefined') {
                const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
                if (!/android/i.test(userAgent)) {
                    setIsAndroid(false);
                }
            }
        };
        checkDevice();
    }, []);

    // 2. Preview URL (Visual only - Actual payload comes from API)
    useEffect(() => {
        if (typeof window !== 'undefined' && selectedSlug) {
            setPreviewUrl(`${window.location.origin}/p/${selectedSlug}`);
        }
    }, [selectedSlug]);

    const handleWrite = async () => {
        // 1. Validate Selection
        if (!selectedSlug) {
            alert("Please select a profile first.");
            return;
        }

        // 2. Check Browser Support
        if (!('NDEFReader' in window)) {
            setStatus('ERROR');
            setErrorMsg("Web NFC is missing. Ensure you are using Chrome on Android.");
            return;
        }

        setStatus('SCANNING');
        setErrorMsg('');

        try {
            // 3. FETCH SECURE PAYLOAD FROM API
            // This ensures the user actually has permission to write this card
            const res = await fetch('/api/cards/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: selectedSlug })
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error || "Failed to generate write payload");
            }

            const secureUrl = json.data.payload;
            console.log("Writing Secure URL:", secureUrl);

            // 4. Write to NFC Tag
            // @ts-ignore
            const ndef = new NDEFReader();
            await ndef.write({
                records: [{ recordType: "url", data: secureUrl }]
            });

            setStatus('SUCCESS');
        } catch (error: any) {
            console.error(error);
            setStatus('ERROR');
            setErrorMsg(error.message || "Failed to write.");
        }
    };

    // --- ACCESS DENIED VIEW ---
    if (!isAndroid) {
        return (
            <div className="text-center p-8 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-300">
                    <i className="fa-brands fa-android text-3xl"></i>
                </div>
                <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Device Restriction</h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-2">
                    Corporate Policy: You can only write cards using an <strong>Android Device</strong>.
                </p>
                <p className="text-xs text-red-500/70 mt-4">
                    Please log in from a compatible smartphone to proceed.
                </p>
            </div>
        )
    }

    // --- NORMAL VIEW ---
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Select Profile</label>
                <div className="relative">
                    <select
                        value={selectedSlug}
                        onChange={(e) => {
                            setSelectedSlug(e.target.value);
                            setStatus('IDLE');
                        }}
                        className="w-full pl-4 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="" disabled>-- Choose Profile --</option>
                        {members.map(m => (
                            <option key={m.id} value={m.slug}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                </div>
            </div>

            {/* Preview Box */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="overflow-hidden">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Target URL</p>
                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 truncate block">
                        {previewUrl || "No profile selected"}
                    </span>
                </div>
                <i className="fa-solid fa-link text-gray-300"></i>
            </div>

            <div className="text-center pt-4">
                {status === 'IDLE' && (
                    <button
                        onClick={handleWrite}
                        disabled={!selectedSlug}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <i className="fa-solid fa-wifi mr-2"></i>
                        Tap to Write
                    </button>
                )}

                {status === 'SCANNING' && (
                    <div className="w-full py-4 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-indigo-500 border-dashed animate-pulse flex flex-col items-center justify-center">
                        <i className="fa-solid fa-mobile-screen-button text-3xl text-indigo-500 mb-2"></i>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">Bring Card Near Device...</span>
                    </div>
                )}

                {status === 'SUCCESS' && (
                    <div className="w-full py-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex flex-col items-center justify-center">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-green-600 mb-2">
                            <i className="fa-solid fa-check text-xl"></i>
                        </div>
                        <span className="font-bold text-green-700 dark:text-green-400">Successfully Written!</span>
                        <div className="mt-1 text-xs text-gray-500">{previewUrl}</div>
                        <button onClick={() => setStatus('IDLE')} className="mt-3 text-xs text-green-600 hover:underline font-bold">Write another</button>
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="w-full py-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex flex-col items-center justify-center">
                        <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500 mb-2"></i>
                        <span className="font-bold text-red-700 dark:text-red-400">Writing Failed</span>
                        <p className="text-xs text-red-600 mt-1 max-w-xs px-4 text-center">{errorMsg}</p>
                        <button onClick={() => setStatus('IDLE')} className="mt-3 text-xs text-red-600 hover:underline font-bold">Try Again</button>
                    </div>
                )}
            </div>
        </div>
    )
}