'use client'

import { useState } from 'react'
import { addMemberToTeam } from '@/actions/team'

export default function AddMemberForm({ disabled }: { disabled: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [handoff, setHandoff] = useState<{ message: string; password: string; email: string } | null>(null);

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        writeMethod: 'SELF' as 'SELF' | 'ADMIN'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setHandoff(null);

        try {
            const res = await addMemberToTeam(form);

            if (!res?.success) {
                // The action now returns a specific reason (seat limit, duplicate
                // email, no subscription) instead of throwing a bare Error.
                setError(res?.message ?? `Could not add ${form.fullName || 'that member'} to your team. Please try again.`);
                return;
            }

            if (res.temporaryPassword) {
                // Email delivery failed. Show the password once so the admin can
                // pass it on — otherwise the new member can never sign in.
                setHandoff({ message: res.message, password: res.temporaryPassword, email: res.email ?? form.email });
                setForm({ fullName: '', email: '', writeMethod: 'SELF' });
                return;
            }

            alert(res.message);
            setIsOpen(false);
            setForm({ fullName: '', email: '', writeMethod: 'SELF' });
        } catch (error) {
            console.error('[AddMemberForm.handleSubmit]', error);
            setError(`Could not reach the server, so ${form.fullName || 'that member'} was not added. Check your connection and try again.`);
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

    // The account exists but the credentials email bounced. This is the only
    // place the temporary password is ever shown, so it stays on screen until
    // the admin explicitly dismisses it.
    if (handoff) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-amber-300 dark:border-amber-800 p-4 sm:p-6 shadow-xl">
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                    <i className="fa-solid fa-triangle-exclamation text-amber-500 mr-2"></i>
                    Pass on these details
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{handoff.message}</p>

                <dl className="space-y-2 rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm">
                    <div className="flex min-w-0 items-start gap-2">
                        <dt className="w-20 shrink-0 font-bold text-gray-500">Email</dt>
                        <dd className="min-w-0 flex-1 truncate font-mono text-gray-900 dark:text-white">{handoff.email}</dd>
                    </div>
                    <div className="flex min-w-0 items-start gap-2">
                        <dt className="w-20 shrink-0 font-bold text-gray-500">Password</dt>
                        <dd className="min-w-0 flex-1 font-mono break-all text-gray-900 dark:text-white">{handoff.password}</dd>
                    </div>
                </dl>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(`Email: ${handoff.email}\nPassword: ${handoff.password}`)}
                        className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                        <i className="fa-regular fa-copy mr-2"></i>Copy
                    </button>
                    <button
                        type="button"
                        onClick={() => { setHandoff(null); setIsOpen(false); }}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        I&apos;ve saved these
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 shadow-xl animate-fade-in">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Add New Member</h3>

            {error && (
                <p role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                    <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0"></i>
                    <span>{error}</span>
                </p>
            )}

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