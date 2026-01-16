import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import HistoryTable from '@/components/ui/pages/dashboard/HistoryTable'
import { redirect } from 'next/navigation'

export default async function HistoryPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/');

    // 1. Fetch Scans I Made
    const scansMade = await prisma.scan.findMany({
        where: { scannerId: userId },
        include: { card: { include: { user: true } } },
        orderBy: { scannedAt: 'desc' },
        take: 50
    });

    // 2. Fetch Scans Received (People scanning my card)
    const scansReceived = await prisma.scan.findMany({
        where: { card: { userId: userId } },
        include: { scanner: true },
        orderBy: { scannedAt: 'desc' },
        take: 50
    });

    // 3. Normalize Data for the Table
    // We combine both lists into a single uniform structure
    const historyData = [
        ...scansMade.map(s => ({
            id: s.id,
            action: 'You Scanned',
            person: {
                id: s.card.user.id,
                fullName: s.card.user.fullName,
                avatarUrl: s.card.user.avatarUrl
            },
            date: s.scannedAt
        })),
        ...scansReceived.map(s => ({
            id: s.id,
            action: 'Scanned You',
            person: {
                id: s.scanner.id,
                fullName: s.scanner.fullName,
                avatarUrl: s.scanner.avatarUrl
            },
            date: s.scannedAt
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort combined list by newest

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Scan History</h1>
            <HistoryTable data={historyData} />
        </div>
    )
}