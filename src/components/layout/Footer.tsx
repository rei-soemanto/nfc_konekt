import ContactForm from '@/features/home/ContactForm'

export function Footer() {
    return (
        <footer id="contact" className="bg-gray-900 text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                    
                    {/* Left Side: Contact Info */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold">Get in Touch</h3>
                        <p className="text-gray-400 max-w-sm">
                            Ready to upgrade your networking game? Reach out to us for enterprise solutions or general inquiries.
                        </p>
                        
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400">📍</div>
                                <div>
                                    <p className="text-sm text-gray-400">Visit Us</p>
                                    <p className="font-medium">Surabaya, East Java, Indonesia</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400">📧</div>
                                <div>
                                    <p className="text-sm text-gray-400">Email Us</p>
                                    <p className="font-medium">nfckonekt@gmail.com</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Contact Form */}
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                        <h4 className="text-lg font-semibold mb-4">Send a Message</h4>
                        {/* Client component: the form itself is interactive, but
                            the rest of the footer stays a Server Component. */}
                        <ContactForm />
                    </div>
                </div>
                
                <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} NFC Konekt. All rights reserved.
                </div>
            </div>
        </footer>
    )
}