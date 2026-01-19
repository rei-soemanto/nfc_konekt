import { Sidebar } from '@/components/ui/layout/Sidebar'
import { getAuthUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: { include: { plan: true } } }
    });

    if (!user) redirect('/auth/login');

    const userProps = {
        fullName: user.fullName,
        plan: user.subscription?.plan?.category || 'FREE',
        avatarUrl: user.avatarUrl,
        role: user.role,
        isInherited: !!user.parentId
    };

    // --- FETCH NEW TRANSACTION COUNT (ADMIN ONLY) ---
    let newTxCount = 0;
    if (user.role === 'ADMIN') {
        newTxCount = await prisma.transaction.count({
            where: {
                isNew: true,
                status: { in: ['PAID', 'PENDING'] },
            }
        });
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Pass the count to Sidebar */}
            <Sidebar user={userProps} newTxCount={newTxCount} />
            
            <main className="flex-1 transition-all duration-300 ease-in-out w-full p-4 md:p-8">
                {children}
            </main>
        </div>
    )
}