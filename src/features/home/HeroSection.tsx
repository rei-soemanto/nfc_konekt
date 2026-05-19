import Link from 'next/link'

export function HeroSection() {
    return (
        <section id="home" className="min-h-screen flex items-center pt-16 bg-gradient-to-br from-white via-indigo-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-20">
                <div className="space-y-8">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                        Networking, <br/>
                        <span className="text-indigo-600 dark:text-indigo-500">Reimagined.</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-lg">
                        The last business card you will ever need. Tap to share your contact info, social profiles, and company details instantly.
                    </p>
                    <div className="flex gap-4">
                        <Link href="/auth" className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
                            Get Your Card
                        </Link>
                        <Link href="#features" className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                            Learn More
                        </Link>
                    </div>
                </div>
                {/* Hero Image Placeholder */}
                <div className="relative h-[500px] w-full bg-gray-200 dark:bg-gray-800 rounded-2xl shadow-2xl animate-pulse flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-500 text-xl font-bold">Hero Image</span>
                </div>
            </div>
        </section>
    )
}