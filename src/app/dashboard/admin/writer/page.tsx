import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NFCWriter from '@/components/ui/pages/admin/NFCWriter'

export default async function AdminWriterPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') return redirect('/dashboard');

    const allCards = await prisma.card.findMany({
        where: { status: { not: 'LOST' } },
        include: { user: true },
        orderBy: { updatedAt: 'desc' }
    });

    // Pass email for search
    const cardOptions = allCards.map(card => ({
        id: card.id,
        slug: card.slug,
        owner: card.user.fullName,
        email: card.user.email 
    }));

    return (
        <div className="max-w-3xl mx-auto py-12">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        <i className="fa-solid fa-user-shield text-indigo-500 mr-2"></i>
                        Master Writer
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Admin Access: Write any user profile to any card.
                    </p>
                </div>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">
                    UNRESTRICTED
                </span>
            </div>

            <NFCWriter cards={cardOptions} />
        </div>
    )
}