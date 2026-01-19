import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
// Ensure this path matches exactly where you created the file. 
// If it's in src/components/dashboard/SubscriptionTabs.tsx, update it here.
import SubscriptionTabs from '@/components/ui/pages/subscription/SubscriptionTabs' 

export default async function PaymentPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth');

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { parentId: true }
    });

    // --- LOGIC: BLOCK TEAM MEMBERS ---
    if (user?.parentId) {
        return (
            <div className="max-w-xl mx-auto py-16 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                    <i className="fa-solid fa-shield-halved text-3xl"></i>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Billing Managed by Admin</h1>
                {/* FIX: Escaped apostrophe here */}
                <p className="text-gray-500 mb-8">
                    Your account is part of a Team Plan. Subscription and billing are handled by your organization&apos;s administrator.
                </p>
                <a href="/dashboard/subscription/status" className="text-indigo-600 hover:underline">
                    View Subscription Status
                </a>
            </div>
        )
    }

    // Fetch active plans for normal users
    const plans = await prisma.plan.findMany({
        orderBy: { price: 'asc' }
    });

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Upgrade Your Plan</h1>
            <p className="text-gray-500 mb-8">Choose the plan that fits your needs.</p>
            <SubscriptionTabs plans={plans} userId={userId} />
        </div>
    )
}