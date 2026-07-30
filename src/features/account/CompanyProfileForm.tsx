'use client'

import { useState } from 'react'
import { updateCompanyProfile } from '@/actions/corporate'
import Select from 'react-select'
import { INDUSTRY_OPTIONS, SPECIALITY_OPTIONS } from '@/config/company-options' // <--- Import from Lib
import { ACCEPTED_IMAGE_TYPES, ACCEPT_ATTR, MAX_UPLOAD_BYTES as MAX_LOGO_BYTES } from '@/lib/upload-limits'

type Props = {
    initialData: {
        scope: string | null
        speciality: string | null
        description: string | null
        logoUrl?: string | null
    }
}

export default function CompanyProfileForm({ initialData }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    // State for Logo
    const [logoPreview, setLogoPreview] = useState<string | null>(initialData.logoUrl || null);
    const [logoBase64, setLogoBase64] = useState<string | null>(null); // To store the actual string to send
    
    // State for Select components
    const [selectedScope, setSelectedScope] = useState(
        initialData.scope ? { value: initialData.scope, label: initialData.scope } : null
    );
    const [selectedSpeciality, setSelectedSpeciality] = useState(
        initialData.speciality ? { value: initialData.speciality, label: initialData.speciality } : null
    );

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Mirrors the server-side guard in updateCompanyProfile.
            // This check is a convenience only — the server re-validates.
            if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                setError(`"${file.type || 'that file type'}" is not supported. Please choose a JPEG, PNG, WebP or GIF image.`);
                return;
            }
            if (file.size > MAX_LOGO_BYTES) {
                setError(`Logo is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum size is 5MB.`);
                return;
            }
            setError(null);

            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setLogoPreview(result); // Show to user
                setLogoBase64(result);  // Prepare to save
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        
        const data = {
            scope: selectedScope?.value || '',
            speciality: selectedSpeciality?.value || '',
            description: formData.get('description') as string,
            logoUrl: logoBase64, // Send the Base64 string if it changed
        };

        setError(null);
        setSaved(false);

        try {
            const result = await updateCompanyProfile(data);
            if (!result.ok) {
                setError(result.message);
                return;
            }
            setSaved(true);
        } catch (error) {
            console.error('[CompanyProfileForm.handleSubmit]', error);
            setError("Could not reach the server. Your company profile was not saved — please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    // Custom styles for React Select
    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: 'transparent',
            borderColor: '#D1D5DB',
            borderRadius: '0.5rem',
            padding: '2px',
            boxShadow: 'none',
            '&:hover': { borderColor: '#9CA3AF' },
            '@media (prefers-color-scheme: dark)': { borderColor: '#374151' }
        }),
        menu: (base: any) => ({ 
            ...base, 
            zIndex: 50,
            backgroundColor: '#ffffff',
            '@media (prefers-color-scheme: dark)': {
                backgroundColor: '#1f2937', // gray-800
                border: '1px solid #374151',
            } 
        }),
        singleValue: (base: any) => ({ 
            ...base, 
            color: 'inherit',
            '@media (prefers-color-scheme: dark)': {
                color: '#ffffff',
            }
        }),
        input: (base: any) => ({ 
            ...base, 
            color: 'inherit',
            '@media (prefers-color-scheme: dark)': {
                color: '#ffffff',
            } 
        }),
        option: (base: any, state: { isFocused: boolean; isSelected: boolean }) => ({
            ...base,
            backgroundColor: state.isSelected 
                ? '#4F46E5'
                : state.isFocused 
                    ? '#E0E7FF'
                    : 'transparent',
            color: state.isSelected 
                ? 'white' 
                : 'inherit',
            cursor: 'pointer',
            '@media (prefers-color-scheme: dark)': {
                backgroundColor: state.isSelected 
                    ? '#4F46E5'
                    : state.isFocused 
                        ? '#374151'
                        : 'transparent',
                color: state.isSelected ? 'white' : '#D1D5DB',
            }
        })
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                <i className="fa-solid fa-building-user mr-2 text-indigo-600"></i>
                Corporate Profile
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Logo Upload Section */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Company Logo</label>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 relative">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                            ) : (
                                <i className="fa-regular fa-image text-gray-400 text-2xl"></i>
                            )}
                        </div>
                        <div className="flex-1">
                            <input
                                type="file"
                                accept={ACCEPT_ATTR}
                                onChange={handleLogoChange}
                                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-200 dark:file:bg-indigo-900/30 dark:file:text-indigo-400"
                            />
                            <p className="mt-1 text-xs text-gray-400">PNG, JPG, WebP, or GIF up to 5MB</p>
                        </div>
                    </div>
                </div>

                {/* Dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Industry / Scope</label>
                        <Select
                            instanceId="scope-select"
                            options={INDUSTRY_OPTIONS}
                            value={selectedScope}
                            onChange={(option: any) => setSelectedScope(option)}
                            placeholder="Select Industry..."
                            styles={selectStyles}
                            className="text-sm"
                            classNamePrefix="react-select"
                            isClearable
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Speciality</label>
                        <Select
                            instanceId="speciality-select"
                            options={SPECIALITY_OPTIONS}
                            value={selectedSpeciality}
                            onChange={(option: any) => setSelectedSpeciality(option)}
                            placeholder="Select Speciality..."
                            styles={selectStyles}
                            className="text-sm"
                            classNamePrefix="react-select"
                            isClearable
                            isSearchable
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">About Company</label>
                    <textarea 
                        name="description" 
                        defaultValue={initialData.description || ''} 
                        rows={4}
                        placeholder="Describe your company..."
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>

                {error && (
                    <p
                        role="alert"
                        className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
                    >
                        <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                        <span>{error}</span>
                    </p>
                )}

                {saved && (
                    <p
                        role="status"
                        className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400"
                    >
                        <i className="fa-solid fa-circle-check mt-0.5"></i>
                        <span>Company profile saved.</span>
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-500/30 flex items-center"
                >
                    {loading ? (
                        <>
                            <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Saving...
                        </>
                    ) : (
                        'Save Company Details'
                    )}
                </button>
            </form>
        </div>
    )
}