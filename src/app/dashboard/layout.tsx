import { Sidebar } from '@/components/ui/layout/Sidebar' // Check your import path
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

    let newTxCount = 0;
    if (user.role === 'ADMIN') {
        newTxCount = await prisma.transaction.count({
            where: { isNew: true, status: { in: ['PAID', 'PENDING'] } }
        });
    }

    return (
        // ✅ FIX: 'flex-col' for mobile (vertical), 'md:flex-row' for desktop (side-by-side)
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
            
            <Sidebar user={userProps} newTxCount={newTxCount} />
            
            <main className="flex-1 w-full p-4 md:p-8 transition-all duration-300 ease-in-out">
                {children}
            </main>
        </div>
    )
}