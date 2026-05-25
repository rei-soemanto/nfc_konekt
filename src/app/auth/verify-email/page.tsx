import Link from 'next/link'

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const { status } = await searchParams

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 px-4 py-8 transition-colors duration-300">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-indigo-900/20 p-8 text-center">
                
                {status === 'success' && (
                    <>
                        {/* Success Icon */}
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                            Your email has been verified
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">
                            Your account is now active. Continue to login to start using NFC Konekt.
                        </p>

                        <Link
                            href="/auth"
                            className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            Continue to Login
                        </Link>
                    </>
                )}

                {status === 'expired' && (
                    <>
                        {/* Expired Icon */}
                        <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                            Verification Link Expired
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">
                            This verification link has expired. Please sign up again to receive a new verification email.
                        </p>

                        <Link
                            href="/auth"
                            className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            Back to Sign Up
                        </Link>
                    </>
                )}

                {(status === 'invalid' || !status) && (
                    <>
                        {/* Error Icon */}
                        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                            Invalid Verification Link
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">
                            This verification link is invalid or has already been used. Please sign up again to receive a new verification email.
                        </p>

                        <Link
                            href="/auth"
                            className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            Back to Sign Up
                        </Link>
                    </>
                )}
            </div>
        </div>
    )
}
