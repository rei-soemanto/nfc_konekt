import RegisterForm from '@/components/ui/pages/auth/RegisterForm'
import Link from 'next/link'

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-gray-500 text-sm mt-1">Start your digital networking journey.</p>
                </div>
                
                <RegisterForm />

                <p className="text-center text-sm text-gray-500 mt-6">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-600 font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}