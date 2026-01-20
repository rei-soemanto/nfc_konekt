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

    // 1. Team Member View
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

    // 2. No Subscription View
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

    // 3. FETCH LATEST ACTIVE SHIPMENT
    // We specifically look for Processing or Shipping states.
    const activeShipment = await prisma.transaction.findFirst({
        where: { 
            userId: userId,
            status: 'PAID',
            shipmentStatus: { in: ['PROCESSING', 'SHIPPING'] }
        },
        orderBy: { createdAt: 'desc' }
    });

    // 4. FETCH TRANSACTION HISTORY
    const history = await prisma.transaction.findMany({
        where: { 
            userId: userId,
            status: 'PAID' // Only confirmed
        },
        orderBy: { createdAt: 'desc' },
        include: { plan: true }
    });

    // Data Prep
    const sub = user.subscription;
    const plan = sub.plan;
    // @ts-ignore
    const durationInfo = DURATION_CONFIG[plan.duration] || { label: 'Unknown', months: 1 };

    // CALCULATE PROGRESS
    const now = new Date();
    const start = new Date(sub.startDate);
    const end = new Date(sub.endDate);
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    let percentage = 0;
    if (totalDuration > 0) {
        percentage = (elapsed / totalDuration) * 100;
    }
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

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Status</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your billing, plan details, and shipments.</p>
            </div>
            
            <SubscriptionInfo sub={formattedData} />

            {/* TRACKING SECTION */}
            <ShipmentTracker 
                // @ts-ignore
                status={activeShipment ? activeShipment.shipmentStatus : 'ARRIVED'} 
                trackingLink={activeShipment?.trackingLink}
                transactionId={activeShipment?.id}
            />

            {/* TRANSACTION HISTORY */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                        <i className="fa-solid fa-clock-rotate-left text-indigo-500 mr-2"></i>
                        Transaction History
                    </h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {history.length > 0 ? history.map((tx) => (
                        <div key={tx.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    tx.shipmentStatus === 'ARRIVED' ? 'bg-green-100 text-green-600' :
                                    tx.shipmentStatus === 'SHIPPING' ? 'bg-blue-100 text-blue-600' :
                                    'bg-indigo-100 text-indigo-600'
                                }`}>
                                    <i className={`fa-solid ${
                                        tx.shipmentStatus === 'ARRIVED' ? 'fa-check' :
                                        tx.shipmentStatus === 'SHIPPING' ? 'fa-truck-fast' :
                                        'fa-receipt'
                                    }`}></i>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                        {tx.type === 'NEW' ? 'Subscription Plan' : 
                                        tx.type === 'EXPANSION' ? 'Expansion Pack' : 'Shipment Request'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(tx.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })} • 
                                        ID: {tx.paymentId}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    tx.shipmentStatus === 'ARRIVED' ? 'bg-green-100 text-green-700' :
                                    tx.shipmentStatus === 'SHIPPING' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {tx.shipmentStatus}
                                </span>
                                <span className="font-mono font-bold text-gray-700 dark:text-gray-300">
                                    IDR {tx.amount.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    )) : (
                        <div className="p-8 text-center text-gray-500 text-sm italic">
                            No completed transactions found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}