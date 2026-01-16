import { getAdminData } from '@/actions/admin'
import NFCWriter from '@/components/ui/pages/admin/NFCWriter'
import { redirect } from 'next/navigation'

export default async function AdminWriterPage() {
    try {
        const { cards } = await getAdminData();

        return (
            <div className="max-w-2xl mx-auto py-12 px-4">
                <div className="mb-8 text-center">
                    <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider border border-red-200 dark:border-red-800">
                        Admin Restricted Area
                    </span>
                </div>
                <NFCWriter cards={cards} />
            </div>
        )
    } catch (error) {
        // If unauthorized or not admin, redirect to main dashboard
        redirect('/dashboard');
    }
}