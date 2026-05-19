export function FeaturesSection() {
    const features = [
        { title: 'NFC Technology', desc: 'Tap to share instantly. No apps required for the receiver.' },
        { title: 'Analytics', desc: 'Track who scanned your card and when.' },
        { title: 'Fully Customizable', desc: 'Update your details anytime without reprinting.' },
        { title: 'Eco-Friendly', desc: 'One card replaces thousands of paper business cards.' },
    ]

    return (
        <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="mb-16">
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold uppercase">Why Choose Us</span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Features that Empower You</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((f, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mb-6 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 text-xl font-bold">
                                {i + 1}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{f.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}