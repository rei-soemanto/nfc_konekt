'use client'

import { useState } from 'react'
import { Country, State, City }  from 'country-state-city'
import { saveUserAddress, AddressData } from '@/actions/address'
import { useRouter } from 'next/navigation'

type Props = {
    initialData?: AddressData | null
    onSave?: () => void
    redirectAfter?: string
    buttonText?: string
}

export default function AddressForm({ initialData, onSave, redirectAfter, buttonText = "Save Address" }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // State Initialization
    const [country, setCountry] = useState(initialData?.country || '');
    const [region, setRegion] = useState(initialData?.region || '');
    const [city, setCity] = useState(initialData?.city || '');
    const [street, setStreet] = useState(initialData?.street || '');
    const [postalCode, setPostalCode] = useState(initialData?.postalCode || '');

    // Data Sources
    const countries = Country.getAllCountries();
    const states = country ? State.getStatesOfCountry(country) : [];
    const cities = region ? City.getCitiesOfState(country, region) : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await saveUserAddress({ country, region, city, street, postalCode });
            
            if (onSave) onSave();
            
            if (redirectAfter) {
                router.push(redirectAfter);
            } else {
                // If no redirect, just show success (useful for Profile Settings)
                alert("Address updated successfully!");
                router.refresh(); // Refresh server data
            }
        } catch (error) {
            console.error(error);
            alert("Failed to save address");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Country */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Country</label>
                    <select 
                        value={country}
                        onChange={(e) => { setCountry(e.target.value); setRegion(''); setCity(''); }}
                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        required
                    >
                        <option value="">Select Country</option>
                        {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                    </select>
                </div>

                {/* Region */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State / Province</label>
                    <select 
                        value={region}
                        onChange={(e) => { setRegion(e.target.value); setCity(''); }}
                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        disabled={!country}
                        required
                    >
                        <option value="">Select Region</option>
                        {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                    </select>
                </div>

                {/* City */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                    <select 
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        disabled={!region}
                        required
                    >
                        <option value="">Select City</option>
                        {cities.length > 0 ? (
                            cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)
                        ) : (
                            <option value={region}>Same as Region</option> 
                        )}
                    </select>
                </div>

                {/* Zip */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Postal Code</label>
                    <input 
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        required
                    />
                </div>
            </div>

            {/* Street */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Street Address</label>
                <textarea 
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Unit, Building, Street Name..."
                    required
                />
            </div>

            <div className="flex justify-end pt-2">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-500/20"
                >
                    {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : buttonText}
                </button>
            </div>
        </form>
    )
}