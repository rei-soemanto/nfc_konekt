import { prisma } from '@/lib/prisma'

export class ConnectionService {
    /**
     * Get list of connected users with optional search/filter
     */
    static async getConnections(userId: string, query?: string) {
        // Build the filter
        const whereClause: any = {
            userId: userId
        };

        // If a search query is present, filter by Name, Email, or Company
        if (query) {
            whereClause.target = {
                OR: [
                    { fullName: { contains: query } }, // removed mode: 'insensitive' for MySQL compatibility if needed, otherwise add it back
                    { email: { contains: query } },
                    { companyName: { contains: query } },
                    { jobTitle: { contains: query } }
                ]
            };
        }

        const connections = await prisma.connection.findMany({
            where: whereClause,
            include: {
                target: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatarUrl: true,
                        jobTitle: true,
                        companyName: true,
                        cards: {
                            where: { status: 'ACTIVE' },
                            select: { slug: true },
                            take: 1
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format for cleaner API response
        return connections.map(conn => ({
            connectionId: conn.id,
            connectedAt: conn.createdAt,
            user: {
                id: conn.target.id,
                name: conn.target.fullName,
                email: conn.target.email,
                avatar: conn.target.avatarUrl,
                job: conn.target.jobTitle || 'No Title',
                company: conn.target.companyName || 'Freelance',
                slug: conn.target.cards[0]?.slug || null
            }
        }));
    }

    /**
     * Get detailed profile of a specific connected user
     */
    static async getConnectionDetails(ownerId: string, targetUserId: string) {
        // 1. Verify they are actually connected
        const connection = await prisma.connection.findFirst({
            where: {
                userId: ownerId,
                targetId: targetUserId
            }
        });

        if (!connection) return null;

        // 2. Fetch full profile details
        const profile = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                bio: true,
                jobTitle: true,
                companyName: true,
                companyWebsite: true,
                socialLinks: true, // Include social links
                address: true      // Include address if available
            }
        });

        return profile;
    }
}