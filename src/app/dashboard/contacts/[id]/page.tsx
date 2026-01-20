import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');
    
    const { id } = await params;

    const contact = await prisma.contact.findUnique({
        where: { id },
    });

    if (!contact || contact.userId !== userId) {
        return redirect('/dashboard/contacts');
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Link href="/dashboard/contacts" className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-2 transition-colors">
                    <i className="fa-solid fa-arrow-left"></i> Back to Contacts
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xl">
                {/* Card Header Style */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-indigo-900 dark:to-purple-900 p-8 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">{contact.name}</h1>
                            <p className="text-gray-300 text-lg mt-1">{contact.jobTitle}</p>
                            {contact.company && (
                                <div className="mt-4 inline-flex items-center bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium border border-white/10">
                                    <i className="fa-solid fa-building mr-2 text-indigo-300"></i>
                                    {contact.company}
                                </div>
                            )}
                        </div>
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl border border-white/10">
                            {contact.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
                
                {/* Card Details */}
                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Contact Info Column */}
                        <div className="space-y-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Information</h3>
                            
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <i className="fa-solid fa-envelope"></i>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Email Address</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{contact.email || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <i className="fa-solid fa-phone"></i>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Phone Number</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{contact.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <i className="fa-solid fa-globe"></i>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Website</p>
                                    {contact.website ? (
                                        <a href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} target="_blank" className="font-medium text-indigo-600 hover:underline break-all">
                                            {contact.website}
                                        </a>
                                    ) : (
                                        <p className="font-medium text-gray-400">N/A</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notes Column */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scanned Notes</h3>
                            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800 min-h-[160px]">
                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {contact.notes || "No additional text was extracted from the card."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}