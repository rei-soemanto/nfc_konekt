'use client'

import { useActionState, useState } from 'react'
import { login, signup } from '@/actions/auth'
import { Input } from '@/components/common/Input'
import { SubmitButton } from '@/components/common/Button'

// --- 1. Sub-Component: Sign Up Form ---
function SignUpForm({ isActive }: { isActive: boolean }) {
    const [state, action] = useActionState(signup, undefined)

    return (
        <div className={`
            absolute transition-all duration-500 ease-in-out flex items-center justify-center
            /* Mobile: Top half, full width */
            top-0 left-0 w-full h-1/2
            /* Desktop: Left side, full height */
            md:w-1/2 md:h-full
            ${isActive 
                /* Mobile: Slide Down | Desktop: Slide Right */
                ? 'opacity-100 z-50 translate-y-[100%] md:translate-y-0 md:translate-x-[100%]' 
                : 'opacity-0 z-10 translate-y-0 md:translate-x-0'
            }
        `}>
            <form action={action} className="bg-white dark:bg-gray-900 flex flex-col items-center justify-center w-full h-full px-10 text-center transition-colors duration-300">
                <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 dark:text-white">Create Account</h1>
                
                <div className="w-full space-y-3 text-left overflow-y-auto max-h-[80%] md:max-h-none py-2 px-1 custom-scrollbar">
                    {state?.message && (
                        <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">{state.message}</p>
                    )}
                    
                    <Input name="fullName" label="Name" placeholder="John Doe" error={state?.errors?.fullName} />
                    <Input name="email" label="Email" type="email" placeholder="john@example.com" error={state?.errors?.email} />
                    <Input name="password" label="Password" type="password" placeholder="••••••••" error={state?.errors?.password} />
                    <Input name="companyName" label="Company" placeholder="Acme Inc" error={state?.errors?.companyName} />
                    
                    <div className="pt-2 pb-2">
                        <SubmitButton className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors w-full">
                            Sign Up
                        </SubmitButton>
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
        <div className={`
            absolute transition-all duration-500 ease-in-out flex items-center justify-center
            /* Mobile: Top half, full width */
            top-0 left-0 w-full h-1/2
            /* Desktop: Left side, full height */
            md:w-1/2 md:h-full
            ${isActive 
                /* Mobile: Slide Down (and hide) */
                ? 'opacity-0 z-10 translate-y-[100%] md:translate-y-0 md:translate-x-[100%]' 
                : 'opacity-100 z-20 translate-y-0 md:translate-x-0'
            }
        `}>
            <form action={action} className="bg-white dark:bg-gray-900 flex flex-col items-center justify-center w-full h-full px-10 text-center transition-colors duration-300">
                <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 dark:text-white">Sign In</h1>
                <div className="w-full space-y-4 text-left overflow-y-auto max-h-[80%] md:max-h-none py-2 px-1 custom-scrollbar">
                    {state?.message && (
                        <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">{state.message}</p>
                    )}

                    <Input name="email" label="Email" type="email" placeholder="john@example.com" error={state?.errors?.email} />
                    <Input name="password" label="Password" type="password" placeholder="••••••••" error={state?.errors?.password} />
                    
                    <div className="pt-2">
                        <SubmitButton className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors w-full">
                            Sign In
                        </SubmitButton>
                    </div>
                </div>
            </form>
        </div>
    )
}

// --- 3. Sub-Component: The Sliding Overlay (FIXED) ---
function Overlay({ isSignupMode, onToggle }: { isSignupMode: boolean, onToggle: () => void }) {
    return (
        <div className={`
            absolute overflow-hidden transition-transform duration-500 ease-in-out z-50
            /* Mobile: Starts at bottom half, full width */
            top-1/2 left-0 w-full h-1/2
            /* Desktop: Starts at right half, full height */
            md:top-0 md:left-1/2 md:w-1/2 md:h-full
            ${isSignupMode 
                /* Mobile: Move Up | Desktop: Move Left */
                ? '-translate-y-full md:translate-y-0 md:-translate-x-full' 
                : 'translate-y-0 md:translate-x-0'
            }
        `}>
            <div className={`
                bg-gradient-to-r from-indigo-600 to-violet-600 text-white relative 
                transform transition-transform duration-500 ease-in-out
                /* Mobile: Double height, moved up */
                -top-full w-full h-[200%]
                /* Desktop: Double width, moved left */
                md:-top-0 md:-left-full md:w-[200%] md:h-full
                ${isSignupMode 
                    /* Mobile: Slide Down | Desktop: Slide Right */
                    ? 'translate-y-1/2 md:translate-y-0 md:translate-x-1/2' 
                    : 'translate-y-0 md:translate-x-0'
                }
            `}>
                
                {/* Panel 1: "New Here?" (Shown when Login form is visible) */}
                <div className={`
                    absolute flex flex-col items-center justify-center px-8 text-center transform transition-transform duration-500 ease-in-out
                    
                    /* Mobile: Stuck to bottom-left */
                    bottom-0 left-0 w-full h-1/2
                    
                    /* ✅ FIX: Reset mobile positioning for Desktop */
                    md:bottom-auto md:left-auto 
                    
                    /* Desktop: Stuck to top-right */
                    md:top-0 md:right-0 md:w-1/2 md:h-full
                    
                    ${isSignupMode 
                        ? 'translate-y-[20%] md:translate-y-0 md:translate-x-[20%]' 
                        : 'translate-y-0 md:translate-x-0'
                    }
                `}>
                    <h1 className="text-2xl md:text-3xl font-bold mb-4">New Here?</h1>
                    <p className="mb-8 text-indigo-100 text-sm md:text-base">Sign up and discover a great amount of new opportunities!</p>
                    <button 
                        onClick={onToggle}
                        className="border-2 border-white rounded-full px-10 py-2 font-semibold hover:bg-white hover:text-indigo-600 transition-colors"
                    >
                        Sign Up
                    </button>
                </div>

                {/* Panel 2: "Welcome Back!" (Shown when Signup form is visible) */}
                <div className={`
                    absolute flex flex-col items-center justify-center px-8 text-center transform transition-transform duration-500 ease-in-out
                    
                    /* Mobile: Top-left */
                    top-0 left-0 w-full h-1/2
                    
                    /* Desktop: Top-left */
                    md:top-0 md:left-0 md:w-1/2 md:h-full
                    
                    ${isSignupMode 
                        ? 'translate-y-0 md:translate-x-0' 
                        : '-translate-y-[20%] md:translate-y-0 md:-translate-x-[20%]'
                    }
                `}>
                    <h1 className="text-2xl md:text-3xl font-bold mb-4">Welcome Back!</h1>
                    <p className="mb-8 text-indigo-100 text-sm md:text-base">To keep connected with us please login with your personal info.</p>
                    <button 
                        onClick={onToggle}
                        className="border-2 border-white rounded-full px-10 py-2 font-semibold hover:bg-white hover:text-indigo-600 transition-colors"
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
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 px-4 py-8 transition-colors duration-300">
            <div className="relative overflow-hidden w-full max-w-[850px] h-[600px] md:min-h-[550px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-indigo-900/20">
                <SignUpForm isActive={isSignupMode} />
                <SignInForm isActive={isSignupMode} />
                <Overlay isSignupMode={isSignupMode} onToggle={() => setIsSignupMode(!isSignupMode)} />
            </div>
        </div>
    )
}