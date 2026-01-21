import { prisma } from '@/lib/prisma'

export class ProfileDataService {
    private viewerId: string | null;

    constructor(viewerId: string | null) {
        this.viewerId = viewerId;
    }

    // Check if the current viewer has an active subscription
    async getViewerSubscriptionStatus(): Promise<boolean> {
        if (!this.viewerId) return false;

        const viewer = await prisma.user.findUnique({
            where: { id: this.viewerId },
            include: { subscription: true, parent: { include: { subscription: true } } }
        });
        const sub = viewer?.subscription || viewer?.parent?.subscription;
        return !!(sub && sub.status === 'ACTIVE');
    }

    // Fetch the full profile of a target user, including corporate context
    async getTargetUserProfile(targetUserId: string) {
        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            include: {
                socialLinks: true,
                parent: true,
                address: true,
            }
        });
        return user;
    }

    // Fetch team members associated with this user's company
    async getCompanyTeamMembers(targetUser: any) {
        // 1. Determine the "Corporate Root" ID
        // If target is Admin, root is target. If target is Employee, root is Parent.
        const corporateRootId = targetUser.parentId || targetUser.id;

        // 2. Fetch all members (Root + Children)
        const allMembers = await prisma.user.findMany({
            where: {
                OR: [
                    { id: corporateRootId },      // The Boss
                    { parentId: corporateRootId } // The Employees
                ],
                isCompanyPublic: true // Only fetch visible members
            },
            select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                jobTitle: true,
                cards: {
                    where: { status: 'ACTIVE' },
                    select: { slug: true },
                    take: 1
                }
            }
        });

        // 3. Check connection status for EACH member relative to Viewer
        // We fetch all connections the viewer has that match these member IDs
        let connectedMemberIds = new Set<string>();
        if (this.viewerId) {
            const connections = await prisma.connection.findMany({
                where: {
                    userId: this.viewerId,
                    targetId: { in: allMembers.map(m => m.id) }
                },
                select: { targetId: true }
            });
            connectedMemberIds = new Set(connections.map(c => c.targetId));
        }

        // 4. Map to clean DTO
        return allMembers.map(member => ({
            id: member.id,
            fullName: member.fullName,
            avatarUrl: member.avatarUrl,
            jobTitle: member.jobTitle,
            slug: member.cards[0]?.slug || null, // Get public slug
            isConnected: connectedMemberIds.has(member.id),
            isViewer: member.id === this.viewerId
        }));
    }

    // Helper to consolidate company details (Inheritance logic)
    static getInheritedCompanyDetails(user: any) {
        return {
            scope: user.companyScope || user.parent?.companyScope || null,
            speciality: user.companySpeciality || user.parent?.companySpeciality || null,
            description: user.companyDescription || user.parent?.companyDescription || null,
            logoUrl: user.companyLogoUrl || user.parent?.companyLogoUrl || null,
        };
    }
}