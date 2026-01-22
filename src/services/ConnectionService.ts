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

    static async addConnection(requesterId: string, slug: string) {
        // 1. Find the User who owns this card
        const card = await prisma.card.findUnique({
            where: { slug },
            include: { user: true }
        });

        if (!card) throw new Error("Card not found");
        if (card.userId === requesterId) throw new Error("You cannot connect with yourself");

        const targetId = card.userId;

        // 2. Check if already connected
        const existing = await prisma.connection.findUnique({
            where: {
                userId_targetId: {
                    userId: requesterId,
                    targetId: targetId
                }
            }
        });

        if (existing) {
            return { message: "Already connected", user: card.user };
        }

        // 3. Create the Connection
        // (Assuming 1-way follow for now. If you want mutual, create two records)
        await prisma.connection.create({
            data: {
                userId: requesterId,
                targetId: targetId
            }
        });

        // 4. Return the user details so the App can show "Connected with Rei!"
        return { 
            message: "Connected successfully", 
            user: {
                id: card.user.id,
                fullName: card.user.fullName,
                avatarUrl: card.user.avatarUrl,
                companyName: card.user.companyName,
                jobTitle: card.user.jobTitle
            }
        };
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