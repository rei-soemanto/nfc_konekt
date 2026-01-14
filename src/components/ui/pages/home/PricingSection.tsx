import Link from 'next/link'

export function PricingSection() {
    const plans = [
        { name: 'Personal', price: '$10', desc: 'Perfect for individuals.', feat: ['1 Digital Profile', 'Basic Analytics', '2 Free Cards'] },
        { name: 'Group', price: '$30', desc: 'For small teams.', feat: ['5 Digital Profiles', 'Team Analytics', '2 Free Cards/Profile'] },
        { name: 'Company', price: '$75', desc: 'For growing businesses.', feat: ['Unlimited Profiles', 'Admin Dashboard', '2 Free Cards/Profile + 10 Spare'] },
    ]

    return (
        <section id="pricing" className="py-24 bg-white dark:bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Pricing</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-4">Choose the plan that fits your needs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, i) => (
                        <div key={i} className={`p-8 rounded-2xl border ${
                            i === 1 
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-4 ring-blue-100 dark:ring-blue-900/40' 
                                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                        }`}>
                            <h3 className={`text-xl font-bold ${i === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                {plan.name}
                            </h3>
                            <div className="mt-4 mb-6">
                                <span className={`text-4xl font-extrabold ${i === 1 ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {plan.price}
                                </span>
                                {plan.price !== 'Free' && <span className="text-gray-500 dark:text-gray-400">/month</span>}
                            </div>
                            <ul className="space-y-4 mb-8">
                                {plan.feat.map((f, idx) => (
                                    <li key={idx} className="flex items-center text-gray-600 dark:text-gray-300">
                                        <span className="w-5 h-5 mr-3 text-green-500">✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link 
                                href="/auth" 
                                className={`block w-full py-3 px-4 rounded-xl text-center font-semibold transition-colors ${
                                    i === 1 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                Choose {plan.name}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}