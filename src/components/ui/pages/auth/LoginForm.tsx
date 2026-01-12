'use client'

import { useActionState } from 'react' // Use 'react-dom' if on Next.js 14
import { login } from '@/actions/auth'
import { Input } from '@/components/common/Input'
import { SubmitButton } from '@/components/common/Button'

export default function LoginForm() {
    const [state, action] = useActionState(login, undefined)

    return (
        <form action={action} className="space-y-4 w-full max-w-md mx-auto">

            {/* Global Error Message (e.g. Invalid Credentials) */}
            {state?.message && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
                    {state.message}
                </div>
            )}

            <Input 
                name="email" 
                type="email" 
                label="Email Address" 
                placeholder="you@company.com"
                error={state?.errors?.email}
            />
            
            <Input 
                name="password" 
                type="password" 
                label="Password" 
                placeholder="••••••••"
                error={state?.errors?.password}
            />

            <div className="pt-2">
                <SubmitButton>Sign In</SubmitButton>
            </div>
        </form>
    )
}