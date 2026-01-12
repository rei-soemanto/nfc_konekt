'use client'

import { useActionState } from 'react' // Use 'react-dom' if on Next.js 14
import { signup } from '@/actions/auth'
import { Input } from '@/components/common/Input'
import { SubmitButton } from '@/components/common/Button'

export default function RegisterForm() {
    const [state, action] = useActionState(signup, undefined)

    return (
        <form action={action} className="space-y-4 w-full max-w-md mx-auto">
            
            {state?.message && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
                    {state.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    name="fullName" 
                    label="Full Name" 
                    placeholder="John Doe"
                    error={state?.errors?.fullName}
                />
                <Input 
                    name="companyName" 
                    label="Company Name" 
                    placeholder="Acme Inc."
                    error={state?.errors?.companyName}
                />
            </div>

            <Input 
                name="email" 
                type="email" 
                label="Email Address" 
                placeholder="john@acme.com"
                error={state?.errors?.email}
            />
            
            <Input 
                name="password" 
                type="password" 
                label="Password" 
                placeholder="Create a strong password"
                error={state?.errors?.password}
            />

            <div className="pt-2">
                <SubmitButton>Create Account</SubmitButton>
            </div>
        </form>
    )
}