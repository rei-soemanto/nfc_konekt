'use client'

import { useState } from 'react'
import { updateCompanyProfile } from '@/actions/corporate'

type Props = {
    initialData: {
        scope: string | null
        speciality: string | null
        description: string | null
    }
}

export default function CompanyProfileForm({ initialData }: Props) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            scope: formData.get('scope') as string,
            speciality: formData.get('speciality') as string,
            description: formData.get('description') as string,
        };

        try {
            await updateCompanyProfile(data);
            alert("Company profile updated!");
        } catch (error) {
            alert("Failed to update.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                <i className="fa-solid fa-building-user mr-2 text-indigo-600"></i>
                Corporate Profile
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Industry / Scope</label>
                        <input 
                            name="scope" 
                            defaultValue={initialData.scope || ''} 
                            placeholder="e.g. Technology, Logistics"
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Speciality</label>
                        <input 
                            name="speciality" 
                            defaultValue={initialData.speciality || ''} 
                            placeholder="e.g. Web Development, Supply Chain"
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">About Company</label>
                    <textarea 
                        name="description" 
                        defaultValue={initialData.description || ''} 
                        rows={4}
                        placeholder="Describe your company..."
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm"
                    />
                </div>
                <button 
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors"
                >
                    {loading ? 'Saving...' : 'Save Company Details'}
                </button>
            </form>
        </div>
    )
}