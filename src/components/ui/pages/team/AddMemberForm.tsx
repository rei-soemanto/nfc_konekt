'use client'

import { useState } from 'react'
import { addMemberToTeam } from '@/actions/team'

export default function AddMemberForm({ disabled }: { disabled: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        writeMethod: 'SELF' as 'SELF' | 'ADMIN'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await addMemberToTeam(form);
            if (res?.success) {
                alert(res.message);
                setIsOpen(false);
                setForm({ fullName: '', email: '', writeMethod: 'SELF' });
            }
        } catch (error) {
            alert("Failed to add member.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                disabled={disabled}
                className="w-full py-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 font-bold hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <i className="fa-solid fa-plus mr-2"></i>
                Add Team Member
            </button>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-xl animate-fade-in">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Add New Member</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                    <input 
                        type="text" 
                        required
                        value={form.fullName}
                        onChange={e => setForm({...form, fullName: e.target.value})}
                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                    <input 
                        type="email" 
                        required
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                {/* Write Method Selection */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Card Writing Method</label>
                    
                    <div className="space-y-3">
                        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            form.writeMethod === 'SELF' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                        }`}>
                            <input 
                                type="radio" 
                                name="method" 
                                checked={form.writeMethod === 'SELF'} 
                                onChange={() => setForm({...form, writeMethod: 'SELF'})}
                                className="mt-1"
                            />
                            <div>
                                <span className="block font-bold text-sm text-gray-900 dark:text-indigo-600">Write it Myself</span>
                                <span className="text-xs text-gray-500">I will use my phone to write the card data. Instant activation.</span>
                            </div>
                        </label>

                        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            form.writeMethod === 'ADMIN' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                        }`}>
                            <input 
                                type="radio" 
                                name="method" 
                                checked={form.writeMethod === 'ADMIN'} 
                                onChange={() => setForm({...form, writeMethod: 'ADMIN'})}
                                className="mt-1"
                            />
                            <div>
                                <span className="block font-bold text-sm text-gray-900 dark:text-indigo-600">Write by Admin</span>
                                <span className="text-xs text-gray-500">
                                    Admin will write the card and ship it to your registered address. 
                                    <span className="block mt-1 font-bold text-indigo-600">Shipment Status will be reset.</span>
                                </span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button 
                        type="button" 
                        onClick={() => setIsOpen(false)}
                        className="flex-1 py-2.5 text-gray-500 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg"
                    >
                        {loading ? 'Processing...' : 'Add Member'}
                    </button>
                </div>
            </form>
        </div>
    )
}