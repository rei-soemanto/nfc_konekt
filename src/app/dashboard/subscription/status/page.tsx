import { prisma } from '@/lib/prisma'
import SubscriptionInfo from '@/components/ui/pages/dashboard/SubscriptionInfo'
import { redirect } from 'next/navigation'

async function getAuthUserId() {
    const user = await prisma.user.findFirst();
    return user?.id;
}

export default async function SubscriptionStatusPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth');

    // Fetch User Subscription
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
    });

    if (!user || !user.subscription) {
        // Fallback UI if no subscription exists
        return (
            <div className="max-w-3xl mx-auto p-8 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Active Subscription</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">You are currently on the free tier.</p>
                <a href="/dashboard/subscription/payment" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Upgrade Now
                </a>
            </div>
        )
    }

    const sub = user.subscription;
    
    // Calculate Date Logic
    const now = new Date();
    const start = new Date(sub.startDate);
    const end = new Date(sub.endDate);
    
    // Time calculations
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const remainingTime = end.getTime() - now.getTime();
    
    // Calculate percentage (clamped between 0 and 100)
    let percentage = (elapsed / totalDuration) * 100;
    percentage = Math.min(Math.max(percentage, 0), 100); // Clamp
    
    // Calculate days remaining
    const daysRemaining = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

    const subscriptionData = {
        planType: sub.planType, // e.g. "PERSONAL" or "COMPANY"
        status: sub.status,
        startDate: start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        dueDate: end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        remainingDays: Math.max(0, daysRemaining),
        progressPercentage: percentage
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Subscription Status</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">View your current plan details and usage.</p>
            
            <SubscriptionInfo sub={subscriptionData} />
        </div>
    )
}