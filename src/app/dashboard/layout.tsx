import { Sidebar } from '@/components/ui/layout/Sidebar'
import { DashboardFooter } from '@/components/ui/layout/DashboardFooter'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

// Mock Auth Helper (Replace with your actual auth session later)
async function getAuthUserId() {
    const user = await prisma.user.findFirst(); 
    return user?.id;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const userId = await getAuthUserId();

    if (!userId) {
        redirect('/auth');
    }

    // Fetch User AND Subscription to get the plan name
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
    });

    if (!user) {
        redirect('/auth');
    }

    // Format data for the Sidebar
    const sidebarUserData = {
        fullName: user.fullName,
        plan: user.subscription?.planType.toLowerCase() || 'free', // Defaults to 'free' if no sub
        avatarUrl: user.avatarUrl
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300 font-sans">
            {/* Pass the fetched data to the Client Component */}
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