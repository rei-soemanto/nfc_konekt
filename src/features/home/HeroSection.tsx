import Link from 'next/link'
import Image from 'next/image'

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
                {/* Hero Image — aspect-square matches the source's 1:1 ratio, so
                    object-cover never actually crops it. A fixed height would. */}
                <div className="relative w-full aspect-square rounded-2xl shadow-2xl overflow-hidden">
                    <Image
                        src="/hero-image.png"
                        alt="A professional holding a phone showing an NFC Konekt digital business card, next to a physical NFC card"
                        fill
                        // Above the fold and almost certainly the LCP element, so
                        // preload it rather than letting it lazy-load.
                        priority
                        sizes="(min-width: 1280px) 608px, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                    />
                </div>
            </div>
        </section>
    )
}