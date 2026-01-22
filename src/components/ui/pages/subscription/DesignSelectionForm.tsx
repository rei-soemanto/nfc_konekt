'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveDesignChoice } from '@/actions/design'
import { CARD_TEMPLATES } from '@/lib/designs'
import DynamicCardPreview, { CardData } from '@/components/ui/pages/card-designer/DynamicCardPreview'

type Props = {
    planId: string
    packs: number
    mode?: string
    userData: CardData 
}

export default function DesignSelectionForm({ planId, packs, mode, userData }: Props) {
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState<'TEMPLATE' | 'CUSTOM'>('TEMPLATE');
    const [selectedTemplate, setSelectedTemplate] = useState(CARD_TEMPLATES[0].id);
    
    // Custom File State
    const [customFile, setCustomFile] = useState<string | null>(null);
    const [customFileName, setCustomFileName] = useState<string>("");
    const [isPdf, setIsPdf] = useState(false);
    
    const [loading, setLoading] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file type
            const fileType = file.type;
            const isPdfFile = fileType === 'application/pdf';
            setIsPdf(isPdfFile);
            setCustomFileName(file.name);

            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomFile(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleContinue = async () => {
        setLoading(true);
        try {
            const designValue = selectedTab === 'TEMPLATE' 
                ? `TEMPLATE:${selectedTemplate}` 
                : `CUSTOM:${customFile}`; // Sends Base64 (works for PDF data strings too)

            await saveDesignChoice(designValue);

            const modeParam = mode ? `&mode=${mode}` : '';
            router.push(`/dashboard/subscription/checkout?planId=${planId}&packs=${packs}${modeParam}`);
        } catch (error) {
            console.error(error);
            alert("Failed to save design selection");
        } finally {
            setLoading(false);
        }
    };

    // Helper to get current preview image (Only for Templates or Image files)
    const currentPreviewImage = selectedTab === 'TEMPLATE' 
        ? CARD_TEMPLATES.find(t => t.id === selectedTemplate)?.image 
        : (isPdf ? null : customFile); // Do not try to preview PDF as image

    // Active Layout ID
    const activeLayoutId = selectedTab === 'TEMPLATE' ? selectedTemplate : 'default';

    return (
        <div className="space-y-8">
            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit mx-auto md:mx-0">
                <button
                    onClick={() => setSelectedTab('TEMPLATE')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        selectedTab === 'TEMPLATE' 
                            ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white' 
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Premium Templates
                </button>
                <button
                    onClick={() => setSelectedTab('CUSTOM')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        selectedTab === 'CUSTOM' 
                            ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white' 
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Upload Custom Design
                </button>
            </div>

            {/* Template Grid */}
            {selectedTab === 'TEMPLATE' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {CARD_TEMPLATES.map((t) => (
                        <div 
                            key={t.id}
                            onClick={() => setSelectedTemplate(t.id)}
                            className={`cursor-pointer group relative rounded-xl overflow-hidden border-2 transition-all ${
                                selectedTemplate === t.id 
                                    ? 'border-indigo-600 ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-gray-900' 
                                    : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                            }`}
                        >
                            <div className="aspect-[1.58/1] bg-gray-200 dark:bg-gray-800 relative">
                                <img 
                                    src={t.image} 
                                    alt={t.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-2 text-center">
                                <span className="font-bold text-xs text-white block truncate shadow-sm">
                                    {t.name}
                                </span>
                            </div>
                            {selectedTemplate === t.id && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs shadow-lg border border-white/20">
                                    <i className="fa-solid fa-check"></i>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Custom Upload Area */}
            {selectedTab === 'CUSTOM' && (
                <div className="space-y-6">
                    {/* 1. CORPORATE WARNING */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3 items-start">
                        <div className="shrink-0 text-amber-600 dark:text-amber-500 mt-0.5">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <div>
                            <h4 className="text-md font-bold text-amber-800 dark:text-amber-200">
                                Design Requirement for Teams
                            </h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                                For custom design option, our team will <strong>only print</strong> directly provided design. <br></br>
                                Make sure <strong>all details</strong> you need on your physical card are included in the uploaded design file. <br></br>
                                If you are ordering for multiple members, please ensure your design ready for <strong>all registered users.</strong>
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 text-center space-y-4">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                            <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upload your custom design</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                                Upload your brand assets (JPG, PNG, PDF). Best ratio is 1.58:1.
                            </p>
                        </div>
                        
                        {!customFile ? (
                            <div className="relative inline-block">
                                <button className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    Select Design File
                                </button>
                                <input 
                                    type="file" 
                                    accept="image/png, image/jpeg, image/jpg, application/pdf" // <--- Allow PDF
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Preview Logic: Show Image or PDF Icon */}
                                {isPdf ? (
                                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-sm mx-auto">
                                        <i className="fa-solid fa-file-pdf text-4xl text-red-500 mb-2"></i>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[200px]">{customFileName}</p>
                                        <p className="text-xs text-gray-500">PDF Document</p>
                                    </div>
                                ) : (
                                    <div className="relative w-full max-w-sm mx-auto aspect-[1.58/1] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <img src={customFile} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-sm font-bold text-green-600">
                                        <i className="fa-solid fa-check mr-1"></i> File Selected
                                    </span>
                                    <button onClick={() => { setCustomFile(null); setIsPdf(false); }} className="text-xs text-red-500 underline">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- PREVIEW SECTION --- */}
            {/* Show Live Preview ONLY if we have an image (Template or Custom Image). 
                Hide for PDF because we can't easily overlay text on PDF in browser. */}
            {selectedTab === 'TEMPLATE' ? (
                currentPreviewImage && (
                    <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-8">
                        <div className="flex flex-col items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Live Preview
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                This is how your card will look with your profile data.
                            </p>
                            
                            <DynamicCardPreview 
                                data={userData}
                                templateUrl={currentPreviewImage}
                                templateId={activeLayoutId}
                                onGenerate={() => {}} 
                            />
                        </div>
                    </div>
                )
            ) : null}

            {/* Actions */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex justify-end gap-3">
                <button 
                    onClick={() => router.back()}
                    className="px-6 py-3 text-gray-500 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                    Back
                </button>
                <button 
                    onClick={handleContinue}
                    disabled={loading || (selectedTab === 'CUSTOM' && !customFile)}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : "Continue to Checkout"}
                </button>
            </div>
        </div>
    )
}