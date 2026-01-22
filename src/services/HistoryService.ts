import { prisma } from '@/lib/prisma'

export class HistoryService {
    static async getHistory(userId: string) {
        // 1. Fetch "Scanned By Me"
        const scannedByMeRaw = await prisma.scan.findMany({
            where: { 
                scannerId: userId 
            },
            orderBy: { scannedAt: 'desc' }, // FIX: Use scannedAt
            include: {
                card: {
                    select: {
                        slug: true,
                        user: {
                            select: {
                                fullName: true,
                                email: true,
                                avatarUrl: true,
                                jobTitle: true,
                                companyName: true
                            }
                        }
                    }
                }
            }
        });

        // 2. Fetch "Scanned By Others"
        const scannedByOthersRaw = await prisma.scan.findMany({
            where: { 
                card: { userId: userId } 
            },
            orderBy: { scannedAt: 'desc' }, // FIX: Use scannedAt
            include: {
                scanner: {
                    select: {
                        fullName: true,
                        email: true,
                        avatarUrl: true,
                        jobTitle: true,
                        companyName: true
                    }
                }
            }
        });

        // 3. Format Data
        const scannedByMe = scannedByMeRaw.map(scan => ({
            id: scan.id,
            date: scan.scannedAt, // FIX: Use scannedAt
            target: {
                name: scan.card.user.fullName,
                avatar: scan.card.user.avatarUrl,
                detail: `${scan.card.user.jobTitle || 'No Title'} @ ${scan.card.user.companyName || 'Freelance'}`,
                slug: scan.card.slug
            }
        }));

        const scannedByOthers = scannedByOthersRaw.map(scan => ({
            id: scan.id,
            date: scan.scannedAt, // FIX: Use scannedAt
            scanner: scan.scanner ? {
                name: scan.scanner.fullName,
                avatar: scan.scanner.avatarUrl,
                detail: `${scan.scanner.jobTitle || 'No Title'} @ ${scan.scanner.companyName || 'Freelance'}`
            } : {
                name: "Anonymous User",
                avatar: null,
                detail: "Unregistered Scanner"
            }
        }));

        return { scannedByMe, scannedByOthers };
    }
}