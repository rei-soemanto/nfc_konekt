import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SubscriptionInfo from '@/components/ui/pages/subscription/SubscriptionInfo'
import ShipmentTracker from '@/components/ui/pages/subscription/ShipmentTracker'
import { DURATION_CONFIG } from '@/lib/plans'

export default async function SubscriptionStatusPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
            subscription: { include: { plan: true } },
            parent: {
                include: { subscription: { include: { plan: true } } }
            }
        }
    });

    if (!user) return redirect('/auth/login');

    // 1. Team Member View (Unchanged)
    if (user.parentId && user.parent?.subscription) {
        return (
            <div className="max-w-4xl mx-auto py-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Subscription Status</h1>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-indigo-200 dark:border-indigo-900 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <i className="fa-solid fa-users-viewfinder text-xl"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Team Plan Active</h2>
                            <p className="text-sm text-gray-500">Managed by {user.parent.fullName}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 2. No Subscription View (Unchanged)
    if (!user.subscription || !user.subscription.plan) {
        return (
            <div className="max-w-3xl mx-auto p-12 text-center mt-10 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <i className="fa-regular fa-credit-card text-2xl"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Active Subscription</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Upgrade to unlock digital cards and team features.</p>
                <a href="/dashboard/subscription/payment" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
                    View Plans
                </a>
            </div>
        )
    }

    // 3. FETCH LATEST SHIPMENT TRANSACTION
    // Instead of user.subscription.shipmentStatus, we look for the latest Transaction record
    const latestShipment = await prisma.transaction.findFirst({
        where: { 
            userId: userId,
            shippingAddress: { not: null }, // Only transactions with shipping
            status: 'PAID' // Only paid ones
        },
        orderBy: { createdAt: 'desc' }
    });

    // Prepare Display Data
    const sub = user.subscription;
    const plan = sub.plan;
    // @ts-ignore
    const durationInfo = DURATION_CONFIG[plan.duration] || { label: 'Unknown', months: 1 };
    
    const now = new Date();
    const start = new Date(sub.startDate);
    const end = new Date(sub.endDate);
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    let percentage = 0;
    if (totalDuration > 0) {
        percentage = (elapsed / totalDuration) * 100;
    }
    // Clamp between 0 and 100
    percentage = Math.min(Math.max(percentage, 0), 100);

    const formattedData = {
        status: sub.status,
        startDate: new Date(sub.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        endDate: new Date(sub.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        expansionPacks: sub.expansionPacks,
        planName: plan.name,
        planPrice: plan.price,
        planDurationLabel: durationInfo.label,
        expansionPrice: plan.expansionPrice * durationInfo.months,
        currency: 'IDR',
        nextBillAmount: plan.price + (plan.expansionPrice * durationInfo.months * sub.expansionPacks),
        nextBillDate: new Date(sub.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        remainingDays: Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
        progressPercentage: percentage
    };

    // Determine Shipment Status to Show
    // If we have a recent transaction, use its status. Otherwise fallback to subscription (legacy)
    const shipmentStatus = latestShipment ? latestShipment.shipmentStatus : sub.shipmentStatus;
    const trackingLink = latestShipment ? latestShipment.trackingLink : sub.trackingLink;
    const showTracker = shipmentStatus !== 'PENDING' && shipmentStatus !== null;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Status</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your billing, plan details, and shipments.</p>
            </div>
            
            <SubscriptionInfo sub={formattedData} />

            {showTracker && (
                <ShipmentTracker 
                    // @ts-ignore
                    status={shipmentStatus} 
                    trackingLink={trackingLink}
                />
            )}
        </div>
    )
}