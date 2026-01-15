'use client'

import { useActionState, useState } from 'react'
import { updateProfile } from '@/actions/profile'
import { Input } from '@/components/common/Input'
import { SubmitButton } from '@/components/common/Button'
import { SocialLinksEditor } from './SocialLinksEditor'

interface UserProfileData {
    fullName: string
    email: string
    companyName: string | null
    companyWebsite: string | null
    bio: string | null
    avatarUrl: string | null
    socialLinks: { platform: string; url: string }[]
}

export default function ProfileForm({ user }: { user: UserProfileData }) {
    const [state, action] = useActionState(updateProfile, undefined)
    const [socialsJson, setSocialsJson] = useState(JSON.stringify(user.socialLinks))

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your personal profile and account details.</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8 transition-colors duration-300">
                <form action={action} className="space-y-8">
                    {/* Status Message */}
                    {state?.message && (
                        <div className={`p-4 text-sm rounded-lg flex items-center ${
                            state.message.includes('success') 
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                        }`}>
                            <i className={`fa-solid ${state.message.includes('success') ? 'fa-check-circle' : 'fa-triangle-exclamation'} mr-2`}></i>
                            {state.message}
                        </div>
                    )}

                    {/* Avatar Section */}
                    <div className="flex items-center space-x-6 pb-8 border-b border-gray-100 dark:border-gray-800">
                        <div className="shrink-0">
                            <div className="h-24 w-24 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-400 border-4 border-white dark:border-gray-800 shadow-lg">
                                {user.avatarUrl || user.fullName.charAt(0)}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Profile Photo</label>
                            <div className="flex gap-3">
                                <button type="button" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-indigo-200 dark:shadow-none">
                                    Change Photo
                                </button>
                                <button type="button" className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    Remove
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">JPG, GIF or PNG. Max size of 800K</p>
                        </div>
                    </div>

                    {/* Main Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                            name="fullName" 
                            label="Full Name" 
                            placeholder="John Doe" 
                            defaultValue={user.fullName} 
                            error={state?.errors?.fullName}
                        />
                        <Input 
                            name="email" 
                            label="Email Address" 
                            type="email" 
                            placeholder="john@example.com" 
                            defaultValue={user.email} 
                            // Usually email is read-only or handled separately
                            // readOnly 
                        />
                        
                        <Input 
                            name="companyName" 
                            label="Company Name" 
                            placeholder="Acme Inc." 
                            defaultValue={user.companyName || ''} 
                            error={state?.errors?.companyName}
                        />
                        <Input 
                            name="companyWebsite" 
                            label="Company Website" 
                            placeholder="https://..." 
                            defaultValue={user.companyWebsite || ''} 
                            error={state?.errors?.companyWebsite}
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                        <textarea 
                            name="bio"
                            rows={4}
                            defaultValue={user.bio || ''}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                            placeholder="Tell us a little about yourself..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">0/500 characters</p>
                    </div>

                    {/* Social Links Integration */}
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
                        <SocialLinksEditor 
                            initialData={user.socialLinks}
                            onChange={(newLinks) => setSocialsJson(JSON.stringify(newLinks))}
                        />
                        <input type="hidden" name="socials" value={socialsJson} />
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                        <SubmitButton className="w-full md:w-auto px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                            Save Changes
                        </SubmitButton>
                    </div>
                </form>
            </div>
        </div>
    )
}