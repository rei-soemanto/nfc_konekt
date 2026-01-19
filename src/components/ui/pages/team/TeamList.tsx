'use client'

import { removeTeamMember } from '@/actions/team'

export default function TeamList({ members, isReadOnly = false }: { members: any[], isReadOnly?: boolean }) {
    if (members.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">No members found.</p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white">Team Members</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {members.map((member) => (
                    <div key={member.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                                {member.avatarUrl ? (
                                    <img src={member.avatarUrl} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    member.fullName.charAt(0)
                                )}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">{member.fullName}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                Active
                            </span>
                            
                            {/* Only show Delete button if NOT read-only */}
                            {!isReadOnly && (
                                <form action={removeTeamMember.bind(null, member.id)}>
                                    <button 
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                        title="Remove Member"
                                    >
                                        <i className="fa-solid fa-trash-can text-sm"></i>
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}