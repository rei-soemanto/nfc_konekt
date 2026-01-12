import LoginForm from '@/components/ui/pages/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 text-sm mt-1">Please enter your details to sign in.</p>
                </div>
                
                <LoginForm />

                <p className="text-center text-sm text-gray-500 mt-6">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-blue-600 font-medium hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}