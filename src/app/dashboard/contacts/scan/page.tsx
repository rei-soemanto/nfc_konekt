'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { scanBusinessCard, saveContact } from '@/actions/scan-physical'

export default function ScanCardPage() {
    const router = useRouter();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedData, setScannedData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show Preview
        setImagePreview(URL.createObjectURL(file));
        setScannedData(null);
        setIsScanning(true);

        // Perform Scan
        const formData = new FormData();
        formData.append('file', file);

        const result = await scanBusinessCard(formData);
        
        if (result.success) {
            setScannedData(result.data);
        } else {
            alert("Could not scan card. Please try again.");
        }
        setIsScanning(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        // Collect form data manually to allow user edits
        const form = e.target as HTMLFormElement;
        const formData = {
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            email: (form.elements.namedItem('email') as HTMLInputElement).value,
            company: (form.elements.namedItem('company') as HTMLInputElement).value,
            website: (form.elements.namedItem('website') as HTMLInputElement).value,
            jobTitle: (form.elements.namedItem('jobTitle') as HTMLInputElement).value,
            phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
        };

        await saveContact(formData);
        router.push('/dashboard/friends'); // Redirect to list
    };

    return (
        <div className="max-w-xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Scan Business Card</h1>

            {/* Upload Area */}
            {!scannedData && (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-900">
                    {imagePreview ? (
                        <div className="mb-4">
                            <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fa-solid fa-camera text-2xl"></i>
                        </div>
                    )}

                    {isScanning ? (
                        <div className="flex flex-col items-center gap-3">
                            <i className="fa-solid fa-circle-notch fa-spin text-indigo-600 text-2xl"></i>
                            <p className="font-bold text-gray-900 dark:text-white">Analyzing Card...</p>
                            <p className="text-xs text-gray-500">Extracting details with AI</p>
                        </div>
                    ) : (
                        <label className="cursor-pointer inline-block">
                            <span className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg">
                                {imagePreview ? "Retake Photo" : "Take Photo / Upload"}
                            </span>
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" // Opens back camera on mobile
                                onChange={handleFileChange} 
                                className="hidden" 
                            />
                        </label>
                    )}
                </div>
            )}

            {/* Edit Form */}
            {scannedData && (
                <form onSubmit={handleSave} className="space-y-4 mt-6 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Verify Details</h3>
                        <button type="button" onClick={() => setScannedData(null)} className="text-sm text-gray-500 hover:underline">Rescan</button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                        <input name="name" defaultValue={scannedData.name} required className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company</label>
                            <input name="company" defaultValue={scannedData.company} className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Job Title</label>
                            <input name="jobTitle" defaultValue={scannedData.jobTitle} className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                        <input name="email" defaultValue={scannedData.email} className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Website</label>
                        <input name="website" defaultValue={scannedData.website} className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                        <input name="phone" defaultValue={scannedData.phone} className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="w-full py-4 mt-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-colors"
                    >
                        {isSaving ? "Saving..." : "Save to Contacts"}
                    </button>
                </form>
            )}
        </div>
    )
}