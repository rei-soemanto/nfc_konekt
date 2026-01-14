'use client'

import { useActionState, useState } from 'react'
import { login, signup } from '@/actions/auth'
import { Input } from '@/components/common/Input'
import { SubmitButton } from '@/components/common/Button'

// --- 1. Sub-Component: Sign Up Form ---
function SignUpForm({ isActive }: { isActive: boolean }) {
    const [state, action] = useActionState(signup, undefined)

    return (
        <div className={`absolute top-0 h-full transition-all duration-500 ease-in-out left-0 w-1/2 flex items-center justify-center ${
            isActive 
                ? 'opacity-100 z-50 translate-x-[100%]'  // Move to RIGHT side when active
                : 'opacity-0 z-10 translate-x-0'          // Hide on LEFT side when inactive
        }`}>
            <form 
                action={action} 
                className="bg-white flex flex-col items-center justify-center w-full h-full px-10 text-center"
            >
                <h1 className="text-3xl font-bold mb-4 text-gray-800">Create Account</h1>
                <div className="w-full space-y-3 text-left">
                    {state?.message && (
                        <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{state.message}</p>
                    )}
                    
                    <Input name="fullName" label="Name" placeholder="John Doe" error={state?.errors?.fullName} />
                    <Input name="email" label="Email" type="email" placeholder="john@example.com" error={state?.errors?.email} />
                    <Input name="password" label="Password" type="password" placeholder="••••••••" error={state?.errors?.password} />
                    <Input name="companyName" label="Company" placeholder="Acme Inc" error={state?.errors?.companyName} />
                    
                    <div className="pt-2">
                        <SubmitButton className="bg-blue-600 hover:bg-blue-700">Sign Up</SubmitButton>
                    </div>
                </div>
            </form>
        </div>
    )
}

// --- 2. Sub-Component: Sign In Form ---
function SignInForm({ isActive }: { isActive: boolean }) {
    const [state, action] = useActionState(login, undefined)

    return (
        <div className={`absolute top-0 h-full transition-all duration-500 ease-in-out left-0 w-1/2 flex items-center justify-center ${
            isActive 
                ? 'opacity-0 z-10 translate-x-[100%]'   // Fade out & Move Right (optional)
                : 'opacity-100 z-20 translate-x-0'       // Show on LEFT side
        }`}>
            <form 
                action={action} 
                className="bg-white flex flex-col items-center justify-center w-full h-full px-10 text-center"
            >
                <h1 className="text-3xl font-bold mb-4 text-gray-800">Sign In</h1>
                <div className="w-full space-y-4 text-left">
                    {state?.message && (
                        <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{state.message}</p>
                    )}

                    <Input name="email" label="Email" type="email" placeholder="john@example.com" error={state?.errors?.email} />
                    <Input name="password" label="Password" type="password" placeholder="••••••••" error={state?.errors?.password} />
                    
                    <div className="pt-2">
                        <SubmitButton className="bg-blue-600 hover:bg-blue-700">Sign In</SubmitButton>
                    </div>
                </div>
            </form>
        </div>
    )
}

// --- 3. Sub-Component: The Sliding Overlay ---
function Overlay({ isSignupMode, onToggle }: { isSignupMode: boolean, onToggle: () => void }) {
    return (
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-500 ease-in-out z-50 ${
            isSignupMode ? '-translate-x-full' : 'translate-x-0'
        }`}>
            <div className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white relative -left-full h-full w-[200%] transform transition-transform duration-500 ease-in-out ${
                isSignupMode ? 'translate-x-1/2' : 'translate-x-0'
            }`}>
                
                {/* Right Panel (Shown when on Login Form) - Calls to Sign Up */}
                <div className={`absolute top-0 flex flex-col items-center justify-center w-1/2 h-full px-8 text-center right-0 transform transition-transform duration-500 ease-in-out ${
                    isSignupMode ? 'translate-x-[20%]' : 'translate-x-0'
                }`}>
                    <h1 className="text-3xl font-bold mb-4">New Here?</h1>
                    <p className="mb-8 text-blue-100">Sign up and discover a great amount of new opportunities!</p>
                    <button 
                        onClick={onToggle}
                        className="border-2 border-white rounded-full px-10 py-2 font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                    >
                        Sign Up
                    </button>
                </div>

                {/* Left Panel (Shown when on Sign Up Form) - Calls to Sign In */}
                <div className={`absolute top-0 flex flex-col items-center justify-center w-1/2 h-full px-8 text-center left-0 transform transition-transform duration-500 ease-in-out ${
                    isSignupMode ? 'translate-x-0' : '-translate-x-[20%]'
                }`}>
                    <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
                    <p className="mb-8 text-blue-100">To keep connected with us please login with your personal info.</p>
                    <button 
                        onClick={onToggle}
                        className="border-2 border-white rounded-full px-10 py-2 font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    )
}

// --- 4. Main Component ---
export default function AuthCard() {
    const [isSignupMode, setIsSignupMode] = useState(false)

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="relative overflow-hidden w-full max-w-[850px] min-h-[550px] bg-white rounded-2xl shadow-2xl">
                
                {/* 1. Sign Up Form (Now moves to Right when active) */}
                <SignUpForm isActive={isSignupMode} />

                {/* 2. Sign In Form (Fades out when inactive) */}
                <SignInForm isActive={isSignupMode} />

                {/* 3. The Sliding Overlay */}
                <Overlay 
                    isSignupMode={isSignupMode} 
                    onToggle={() => setIsSignupMode(!isSignupMode)} 
                />
                
            </div>
        </div>
    )
}