'use client'

import { useActionState, useState } from 'react'
import { updateProfile } from '@/actions/profile'
import { Input } from '@/components/common/Input'
import { SubmitButton } from '@/components/common/Button'
import { SocialLinksEditor } from './SocialLinksEditor'

// We define the shape of the data we expect from the DB
interface UserProfileData {
    fullName: string
    companyName: string | null
    companyWebsite: string | null
    bio: string | null
    avatarUrl: string | null
    socialLinks: { platform: string; url: string }[]
}

export default function ProfileForm({ user }: { user: UserProfileData }) {
    const [state, action] = useActionState(updateProfile, undefined)
    
    // We need local state to hold the socials JSON string for the hidden input
    const [socialsJson, setSocialsJson] = useState(JSON.stringify(user.socialLinks))

    return (
        <form action={action} className="space-y-6 max-w-2xl bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            
            <div className="border-b pb-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                <p className="text-sm text-gray-500">Update your card information and public details.</p>
            </div>

            {state?.message && (
                <div className={`p-3 text-sm rounded-lg ${
                    state.message.includes('success') 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {state.message}
                </div>
            )}

            {/* Basic Info */}
            <Input 
                name="fullName" 
                label="Full Name" 
                defaultValue={user.fullName} 
                error={state?.errors?.fullName}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    name="companyName" 
                    label="Company Name" 
                    defaultValue={user.companyName || ''}
                    error={state?.errors?.companyName}
                />
                <Input 
                    name="companyWebsite" 
                    label="Company Website" 
                    defaultValue={user.companyWebsite || ''}
                    error={state?.errors?.companyWebsite}
                />
            </div>

            {/* Bio Field */}
            <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <textarea
                    name="bio"
                    rows={4}
                    defaultValue={user.bio || ''}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Tell us about yourself..."
                />
            </div>

            {/* Social Links Section */}
            <div className="border-t pt-4">
                <SocialLinksEditor 
                    initialData={user.socialLinks}
                    onChange={(newLinks) => setSocialsJson(JSON.stringify(newLinks))}
                />
                {/* Hidden input to pass the JSON string to the Server Action */}
                <input type="hidden" name="socials" value={socialsJson} />
            </div>

            <div className="pt-4">
                <SubmitButton>Save Changes</SubmitButton>
            </div>
        </form>
    )
}