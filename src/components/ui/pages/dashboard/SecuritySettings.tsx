'use client'

import { useActionState, useState } from 'react'
import { changePassword, deleteAccount } from '@/actions/account'
import { Input } from '@/components/common/Input'
import { SubmitButton } from '@/components/common/Button'

export default function SecuritySettings() {
    const [pwdState, pwdAction] = useActionState(changePassword, undefined);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    return (
        <div className="space-y-8">
            {/* 1. Change Password Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i className="fa-solid fa-lock text-indigo-500 mr-2"></i>
                    Change Password
                </h2>

                {pwdState?.message && (
                    <div className={`mb-4 p-3 rounded-lg text-sm border ${
                        pwdState.success ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                        {pwdState.message}
                    </div>
                )}

                <form action={pwdAction} className="space-y-4 max-w-md">
                    <Input 
                        name="currentPassword" 
                        label="Current Password" 
                        type="password" 
                        required 
                    />
                    <Input 
                        name="newPassword" 
                        label="New Password" 
                        type="password" 
                        required 
                    />
                    <div className="pt-2">
                        <SubmitButton className="bg-indigo-600 hover:bg-indigo-700 text-white px-6">
                            Update Password
                        </SubmitButton>
                    </div>
                </form>
            </div>

            {/* 2. Danger Zone (Delete Account) */}
            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 p-6 md:p-8">
                <h2 className="text-lg font-bold text-red-700 dark:text-red-500 mb-2 flex items-center">
                    <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                    Danger Zone
                </h2>
                <p className="text-sm text-red-600 dark:text-red-400 mb-6">
                    Deleting your account is permanent. If you are a Team Manager, your team members will be unlinked and lose their premium benefits, but their accounts will remain active.
                </p>

                {!isDeleteOpen ? (
                    <button 
                        onClick={() => setIsDeleteOpen(true)}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                        Delete Account
                    </button>
                ) : (
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-red-100 dark:border-red-900/50 max-w-md">
                        <p className="font-semibold text-gray-900 dark:text-white mb-4">
                            Are you absolutely sure? This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <form action={deleteAccount}>
                                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg">
                                    Yes, Delete My Account
                                </button>
                            </form>
                            <button 
                                onClick={() => setIsDeleteOpen(false)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}