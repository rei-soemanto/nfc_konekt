import { prisma } from '@/lib/prisma'

export class DashboardService {
    static async getDashboardStats(userId: string) {
        // 1. Fetch Basic Stats Count
        const [scansMade, scansReceived, friendsConnected] = await Promise.all([
            // Count scans initiated by user
            prisma.scan.count({ where: { scannerId: userId } }),
            
            // Count times user's card was scanned (requires Card lookup first, simplified here)
            prisma.scan.count({ 
                where: { 
                    card: { userId: userId } 
                } 
            }),

            // Count contacts saved
            prisma.contact.count({ where: { userId: userId } })
        ]);

        // 2. Calculate Conversion Rate
        // (Friends / Scans Received) * 100
        const conversionRate = scansReceived > 0 
            ? ((friendsConnected / scansReceived) * 100).toFixed(1) 
            : "0.0";

        return {
            scansMade,
            scansReceived,
            friendsConnected,
            conversionRate: `${conversionRate}%`
        };
    }

    static async getRecentActivity(userId: string) {
        const recentScans = await prisma.scan.findMany({
            where: { 
                OR: [
                    { scannerId: userId },
                    { card: { userId: userId } }
                ]
            },
            take: 5,
            orderBy: { scannedAt: 'desc' }, // FIX: Use scannedAt
            include: {
                scanner: { select: { fullName: true, avatarUrl: true } },
                card: { include: { user: { select: { fullName: true } } } }
            }
        });

        return recentScans.map(scan => ({
            id: scan.id,
            type: scan.scannerId === userId ? 'SCAN_MADE' : 'SCAN_RECEIVED',
            message: scan.scannerId === userId 
                ? `You scanned ${scan.card.user.fullName}` 
                : `${scan.scanner?.fullName || 'Someone'} scanned you`,
            date: scan.scannedAt // FIX: Use scannedAt
        }));
    }
}