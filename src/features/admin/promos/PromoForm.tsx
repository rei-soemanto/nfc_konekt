'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PromoData = {
    id?: string
    name: string
    code: string
    type: string
    value: number
    startDate: Date | string
    endDate: Date | string
    isActive: boolean
    applicablePlans: string[]
}

export default function PromoForm({ onClose, initialData }: { onClose: () => void, initialData?: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Pre-format dates for input value (YYYY-MM-DD)
    const formatDate = (date: any) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const formData = new FormData(e.currentTarget);
        const type = formData.get('type') as string;
        const value = Number(formData.get('value'));

        if (type === 'PERCENTAGE' && (value < 1 || value > 100)) {
            setError("Percentage must be between 1% and 100%");
            setLoading(false);
            return;
        }

        const payload = {
            name: formData.get('name'),
            code: formData.get('code'),
            type: type,
            value: value,
            startDate: new Date(formData.get('startDate') as string),
            endDate: new Date(formData.get('endDate') as string),
            isActive: formData.get('isActive') === 'on', // Checkbox logic
            applicablePlans: Array.from(formData.getAll('plans')) 
        };

        try {
            // Determine Method and URL based on Edit vs Create
            const method = initialData ? 'PUT' : 'POST';
            const url = initialData 
                ? `/api/admin/promos/${initialData.id}` 
                : '/api/admin/promos';

            const res = await fetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Operation failed");
            }

            router.refresh();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";
    const labelClass = "block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1";

    // Helper to check if a plan is selected (for edit mode)
    const hasPlan = (plan: string) => {
        if (!initialData) return true; // Default check all on create? Or none.
        const plans = initialData.applicablePlans as string[];
        return plans.includes(plan) || plans.includes('ALL');
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 transition-colors">
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {initialData ? 'Edit Promo' : 'Create New Promo'}
                    </h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                        <i className="fa-solid fa-circle-exclamation"></i> {error}
                    </div>
                )}
                
                <div className="space-y-4">
                    {/* Active Status Toggle (Important for Admin) */}
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Promo Status</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                name="isActive" 
                                defaultChecked={initialData ? initialData.isActive : true} 
                                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                            />
                            <span className="text-xs text-gray-500">Active</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Promo Name</label>
                            <input name="name" defaultValue={initialData?.name} placeholder="Summer Sale" required className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Code</label>
                            <input name="code" defaultValue={initialData?.code} placeholder="SUMMER50" required className={`${inputClass} uppercase font-mono`} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Type</label>
                            <select name="type" defaultValue={initialData?.type || 'PERCENTAGE'} className={inputClass}>
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FIXED">Fixed Amount (IDR)</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Value</label>
                            <input name="value" type="number" defaultValue={initialData?.value} placeholder="20" required className={inputClass} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Start Date</label>
                            <input name="startDate" type="date" defaultValue={formatDate(initialData?.startDate)} required className={`${inputClass} dark:[color-scheme:dark]`} />
                        </div>
                        <div>
                            <label className={labelClass}>End Date</label>
                            <input name="endDate" type="date" defaultValue={formatDate(initialData?.endDate)} required className={`${inputClass} dark:[color-scheme:dark]`} />
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wider">Applicable Plans</p>
                        <div className="flex flex-wrap gap-4">
                            {['PERSONAL', 'CORPORATE', 'EXPANSION'].map((plan) => (
                                <label key={plan} className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" name="plans" value={plan} defaultChecked={hasPlan(plan)} className="w-4 h-4 accent-indigo-600" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{plan.toLowerCase()}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                    <button disabled={loading} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all">
                        {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Promo')}
                    </button>
                </div>
            </form>
        </div>
    )
}