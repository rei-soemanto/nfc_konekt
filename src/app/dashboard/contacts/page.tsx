import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ContactTable from '@/components/ui/pages/contacts/ContactTable'
import Link from 'next/link'

export default async function ContactsPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    // Fetch contacts for this user
    const contacts = await prisma.contact.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Physical Card Contacts</h1>
                    <p className="text-gray-500 mt-1">Manage people you have scanned from physical business cards.</p>
                </div>
                <Link 
                    href="/dashboard/contacts/scan"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center"
                >
                    <i className="fa-solid fa-camera mr-2"></i>
                    Scan New Card
                </Link>
            </div>

            <ContactTable contacts={contacts} />
        </div>
    )
}