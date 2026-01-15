import { Input } from '@/components/common/Input'

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
                        <form className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Name" placeholder="Your name" className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                                <Input label="Email" placeholder="your@email.com" className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-1 block">Message</label>
                                <textarea 
                                    rows={4} 
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="How can we help?"
                                />
                            </div>
                            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors">
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>
                
                <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} NFC Konekt. All rights reserved.
                </div>
            </div>
        </footer>
    )
}