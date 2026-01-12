import Link from 'next/link'

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
            <div className="max-w-2xl text-center space-y-8">
                {/* Hero Text */}
                <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
                    Your Digital <span className="text-blue-600">Business Card</span>
                </h1>
                
                <p className="text-xl text-gray-500">
                    Share your professional identity with a single tap. 
                    Manage your profile, track scans, and connect instantly.
                </p>

                {/* Call to Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link 
                        href="/login" 
                        className="px-8 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        Sign In
                    </Link>
                    
                    <Link 
                        href="/register" 
                        className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        Get Started
                    </Link>
                </div>
            </div>

            {/* Footer / Copyright */}
            <div className="absolute bottom-8 text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} DigiCard. All rights reserved.
            </div>
        </div>
    )
}