import { Sidebar } from '@/components/ui/layout/Sidebar'
import { DashboardFooter } from '@/components/ui/layout/DashboardFooter'
import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth' // <--- IMPORT THE REAL AUTH HELPER
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    // 1. Use the REAL auth helper (checks cookies)
    const userId = await getAuthUserId();

    // 2. If no valid login, kick them out
    if (!userId) {
        redirect('/');
    }

    // 3. Fetch the logged-in user's specific data
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
    });

    if (!user) {
        redirect('/');
    }

    // 4. Format data for the Sidebar
    const sidebarUserData = {
        fullName: user.fullName,
        plan: user.subscription?.planType.toLowerCase() || 'free',
        avatarUrl: user.avatarUrl,
        role: user.role // Pass role for the Admin check
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300 font-sans">
            {/* Pass the REAL user data to the Sidebar */}
            <Sidebar user={sidebarUserData} />

            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
                <DashboardFooter />
            </div>
        </div>
    )
}