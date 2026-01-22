import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import HistoryTable from '@/components/ui/pages/history/HistoryTable'

export default async function HistoryPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    // 1. Check Subscription
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true, parent: { include: { subscription: true } } }
    });
    
    const sub = user?.subscription || user?.parent?.subscription;
    const hasSubscription = !!(sub && sub.status === 'ACTIVE');

    // 2. Fetch "Scanned By Me" (Outbound)
    const scansMade = await prisma.scan.findMany({
        where: { scannerId: userId },
        include: { 
            card: { 
                include: { 
                    user: {
                        select: { id: true, fullName: true, email: true, jobTitle: true, companyName: true, avatarUrl: true }
                    }
                } 
            } 
        },
        orderBy: { scannedAt: 'desc' }
    });

    // 3. Fetch "Scanned Me" (Inbound)
    const scansReceived = await prisma.scan.findMany({
        where: { card: { userId: userId } },
        include: { 
            scanner: {
                select: { id: true, fullName: true, email: true, jobTitle: true, companyName: true, avatarUrl: true }
            }
        },
        orderBy: { scannedAt: 'desc' }
    });

    // 4. Check Connection Status for ALL unique people involved
    const myConnections = await prisma.connection.findMany({
        where: { userId },
        select: { targetId: true }
    });
    const connectedIds = new Set(myConnections.map(c => c.targetId));

    // 5. Transform Data
    const outboundHistory = scansMade.map(scan => ({
        id: scan.id,
        scannedAt: scan.scannedAt,
        person: scan.card.user,
        isConnected: connectedIds.has(scan.card.user.id)
    }));

    const inboundHistory = scansReceived.map(scan => ({
        id: scan.id,
        scannedAt: scan.scannedAt,
        person: scan.scanner,
        isConnected: connectedIds.has(scan.scanner.id)
    }));

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scan History</h1>
                <p className="text-gray-500 mt-1">Track who you scanned and who scanned you.</p>
            </div>

            <HistoryTable 
                outbound={outboundHistory}
                inbound={inboundHistory}
                hasSubscription={hasSubscription} 
            />
        </div>
    )
}