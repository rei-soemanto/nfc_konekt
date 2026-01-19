'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveTeamSetupDraft, TeamMemberDraft } from '@/actions/team'

type Props = {
    planId: string
    packs: number
    maxSeats: number
    isExpansion?: boolean
}

// FIX: Added 'isExpansion' to the destructured props below
export default function TeamSetupForm({ planId, packs, maxSeats, isExpansion = false }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // Logic: If expansion, Admin is already seated, so all seats are available.
    // If new plan, 1 seat is reserved for Admin.
    const availableSlots = isExpansion ? maxSeats : maxSeats - 1;

    const [members, setMembers] = useState<TeamMemberDraft[]>([
        { fullName: '', email: '' }
    ]);

    const addField = () => {
        if (members.length < availableSlots) {
            setMembers([...members, { fullName: '', email: '' }]);
        }
    };

    const removeField = (index: number) => {
        const newMembers = [...members];
        newMembers.splice(index, 1);
        setMembers(newMembers);
    };

    const handleChange = (index: number, field: keyof TeamMemberDraft, value: string) => {
        const newMembers = [...members];
        newMembers[index][field] = value;
        setMembers(newMembers);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Filter out empty rows
        const validMembers = members.filter(m => m.fullName.trim() !== '' && m.email.trim() !== '');

        try {
            await saveTeamSetupDraft(validMembers);
            // Now 'isExpansion' is defined and this line will work
            const modeParam = isExpansion ? '&mode=expansion' : '';
            router.push(`/dashboard/subscription/checkout?planId=${planId}&packs=${packs}${modeParam}`);
        } catch (error) {
            alert("Failed to save team data");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                <i className="fa-solid fa-users-viewfinder text-amber-600 mt-1"></i>
                <div>
                    <h3 className="font-bold text-amber-900 dark:text-amber-500 text-sm">Corporate Seat Management</h3>
                    <p className="text-xs text-amber-800/70 dark:text-amber-400">
                        You have <strong>{maxSeats} Total Seats</strong>. 
                        <br/>
                        {isExpansion 
                            ? "All new seats are available for team members."
                            : "1 Seat is reserved for you (Admin)."} 
                        You can register up to <strong>{availableSlots} Team Members</strong> now.
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {members.map((member, idx) => (
                    <div key={idx} className="flex gap-3 items-start p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 mt-1">
                            {idx + 1}
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={member.fullName}
                                    onChange={(e) => handleChange(idx, 'fullName', e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                                    placeholder="Employee Name"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email Address</label>
                                <input 
                                    type="email" 
                                    required
                                    value={member.email}
                                    onChange={(e) => handleChange(idx, 'email', e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                                    placeholder="employee@company.com"
                                />
                            </div>
                        </div>
                        {members.length > 1 && (
                            <button 
                                type="button" 
                                onClick={() => removeField(idx)}
                                className="mt-7 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <i className="fa-solid fa-trash"></i>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center">
                <button
                    type="button"
                    onClick={addField}
                    disabled={members.length >= availableSlots}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <i className="fa-solid fa-plus mr-2"></i>
                    Add Another Member
                </button>
                <span className="text-xs text-gray-400">
                    {members.length} / {availableSlots} Slots Used
                </span>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex justify-end gap-3">
                <button 
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 text-gray-500 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                    Back
                </button>
                <button 
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                >
                    {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : "Continue to Checkout"}
                </button>
            </div>
        </form>
    )
}