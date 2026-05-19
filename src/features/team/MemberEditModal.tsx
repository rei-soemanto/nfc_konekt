'use client'

import { useState } from 'react'
import { updateEmployeeRole } from '@/actions/corporate'

type Props = {
    member: {
        id: string
        fullName: string
        jobTitle: string | null
        isCompanyPublic: boolean
    }
    onClose: () => void
}

export default function MemberEditModal({ member, onClose }: Props) {
    const [loading, setLoading] = useState(false);
    const [jobTitle, setJobTitle] = useState(member.jobTitle || '');
    const [isPublic, setIsPublic] = useState(member.isCompanyPublic);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateEmployeeRole(member.id, jobTitle, isPublic);
            onClose(); // Close modal on success (page will revalidate)
        } catch (error) {
            alert("Failed to update member.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit Team Member</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                        <p className="font-medium text-gray-900 dark:text-white">{member.fullName}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role in Company</label>
                        <input 
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g. Marketing Manager"
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                            <span className="font-bold text-sm text-gray-900 dark:text-white">Public Visibility</span>
                            <p className="text-xs text-gray-500">Show this member on the corporate profile?</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold text-sm">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}