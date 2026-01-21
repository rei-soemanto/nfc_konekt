'use client'

import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { CARD_LAYOUTS, DEFAULT_LAYOUT, CardLayout } from '@/lib/card-layouts'

export type CardData = {
    fullName: string
    jobTitle: string
    email: string
    phone: string
    companyName: string
    scope: string
    specialty: string
    address: string
    companyLogoUrl: string | null
}

type Props = {
    data: CardData
    templateUrl: string
    templateId: string // <--- NEW PROP
    onGenerate: (blob: Blob) => void
}

export default function DynamicCardPreview({ data, templateUrl, templateId, onGenerate }: Props) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // 1. Get the layout config based on ID, or fall back to default
    const layout: CardLayout = CARD_LAYOUTS[templateId] || DEFAULT_LAYOUT;

    const handleGenerateImage = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);

        try {
            const canvas = await html2canvas(cardRef.current, { 
                scale: 3, 
                useCORS: true, 
                allowTaint: true,
                backgroundColor: null
            });
            
            canvas.toBlob((blob) => {
                if (blob) onGenerate(blob);
            }, 'image/png');
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6 w-full max-w-lg mx-auto">
            {/* --- VISUAL PREVIEW AREA --- */}
            {/* Aspect Ratio 1.586 (Credit Card ID-1 Standard) */}
            <div className="relative w-full aspect-[1.586/1] shadow-2xl rounded-xl overflow-hidden border border-gray-200">
                
                {/* We use a fixed font-size base on the parent container via standard Tailwind classes,
                   but the layout config handles specific positioning.
                */}
                <div 
                    ref={cardRef} 
                    className="relative w-full h-full bg-white overflow-hidden select-none"
                >
                    {/* 1. Background Template */}
                    <img 
                        src={templateUrl} 
                        alt="Card Template" 
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        crossOrigin="anonymous" 
                    />

                    {/* 2. Company Logo */}
                    {data.companyLogoUrl && (
                        <div 
                            className="absolute z-10 flex items-center justify-center overflow-hidden"
                            style={{
                                top: layout.logo.top,
                                left: layout.logo.left,
                                width: layout.logo.width,
                                height: layout.logo.height,
                            }}
                        >
                            <img 
                                src={data.companyLogoUrl} 
                                alt="Logo" 
                                className="w-full h-full object-contain" 
                                crossOrigin="anonymous"
                            />
                        </div>
                    )}

                    {/* 3. Company Name */}
                    <div 
                        className="absolute z-10"
                        style={{
                            ...layout.companyName,
                            // Convert rem to em or viewport units for scaling if needed, 
                            // but generic styling usually works fine in this fixed aspect ratio
                        }}
                    >
                        {data.companyName || 'COMPANY NAME'}
                    </div>

                    {/* 4. Full Name */}
                    <div 
                        className="absolute z-10 leading-tight"
                        style={layout.fullName}
                    >
                        {data.fullName || 'FULL NAME'}
                    </div>

                    {/* 5. Details Block (Job, Email, Phone) */}
                    <div 
                        className="absolute z-10 space-y-[0.3em] leading-snug"
                        style={layout.detailsBlock}
                    >
                        <p>
                            {layout.id === 'matte-black' && <i className="fa-solid fa-briefcase mr-2 text-sky-400"></i>}
                            {data.jobTitle || 'Job Title'}
                        </p>
                        <p>
                            {layout.id === 'matte-black' && <i className="fa-regular fa-envelope mr-2 text-sky-400"></i>}
                            {data.email || 'email@example.com'}
                        </p>
                        <p>
                            {layout.id === 'matte-black' && <i className="fa-solid fa-phone mr-2 text-sky-400"></i>}
                            {data.phone || '+62 812 3456 7890'}
                        </p>
                    </div>

                    {/* 6. Bottom Block (Scope, Specialty, Address) */}
                    <div 
                        className="absolute z-10 space-y-[0.2em] leading-snug"
                        style={layout.bottomBlock}
                    >
                        <div className={`flex gap-3 ${layout.bottomBlock.textAlign === 'center' ? 'justify-center' : (layout.bottomBlock.textAlign === 'right' ? 'justify-end' : 'justify-start')}`}>
                            {data.scope && (
                                <span className={layout.id === 'matte-black' ? "text-sky-200" : "font-bold"}>
                                    {data.scope}
                                </span>
                            )}
                            {data.scope && data.specialty && <span className="opacity-50">|</span>}
                            {data.specialty && (
                                <span className={layout.id === 'matte-black' ? "text-sky-200" : "font-bold"}>
                                    {data.specialty}
                                </span>
                            )}
                        </div>
                        <p className="opacity-80">
                            {data.address || 'Street Address, City, Country'}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- ACTION BUTTON --- */}
            <div className="flex justify-center pt-2">
                <button 
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-800"
                >
                    {isGenerating ? (
                        <>
                            <i className="fa-solid fa-circle-notch fa-spin"></i> Processing...
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-check"></i> Confirm Design & Pay
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}