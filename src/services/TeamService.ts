import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { EXPANSION_PACK_SIZE } from '@/lib/plans' // Ensure this exists or use number 10

export class TeamService {
    /**
     * List all team members managed by this admin
     */
    static async getTeamMembers(adminId: string) {
        return await prisma.user.findMany({
            where: { parentId: adminId },
            select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                jobTitle: true,
                phone: true,
                role: true,
                accountStatus: true,
                cards: {
                    where: { status: 'ACTIVE' },
                    select: { slug: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get Team Statistics (Used for the dashboard summary)
     */
    static async getTeamStats(adminId: string) {
        const [totalMembers, activeCards] = await Promise.all([
            prisma.user.count({ where: { parentId: adminId } }),
            prisma.card.count({ 
                where: { 
                    user: { parentId: adminId },
                    status: 'ACTIVE'
                } 
            })
        ]);

        return { totalMembers, activeCards };
    }

    /**
     * Add a new member to the team
     */
    static async addMember(adminId: string, data: { fullName: string, email: string, jobTitle?: string, password?: string }) {
        // 1. Check Admin's Subscription / Limits
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            include: { subscription: true, members: true }
        });

        if (!admin || !admin.subscription) {
            throw new Error("No active subscription found.");
        }

        // Calculate Limit: Base (e.g. 10) + Expansions
        const baseLimit = 10; // Or fetch from Plan config
        const expansionLimit = (admin.subscription.expansionPacks || 0) * EXPANSION_PACK_SIZE;
        const totalLimit = baseLimit + expansionLimit;

        if (admin.members.length >= totalLimit) {
            throw new Error("Team limit reached. Please upgrade your plan.");
        }

        // 2. Check if email exists
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            throw new Error("User with this email already exists.");
        }

        // 3. Create Member
        const defaultPassword = data.password || "Member123!"; // Default password strategy
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Generate a clean slug
        const slug = data.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

        return await prisma.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                password: hashedPassword,
                jobTitle: data.jobTitle,
                parentId: adminId, // LINK TO ADMIN
                companyName: admin.companyName, // Inherit Company
                role: 'USER',
                cards: {
                    create: {
                        slug: slug,
                        status: 'ACTIVE'
                    }
                }
            }
        });
    }

    /**
     * Update a member's details
     */
    static async updateMember(adminId: string, memberId: string, data: { fullName?: string, jobTitle?: string, phone?: string }) {
        // Security: Ensure this member belongs to this admin
        const member = await prisma.user.findFirst({
            where: { id: memberId, parentId: adminId }
        });

        if (!member) throw new Error("Member not found or unauthorized.");

        return await prisma.user.update({
            where: { id: memberId },
            data: {
                fullName: data.fullName,
                jobTitle: data.jobTitle,
                phone: data.phone
            }
        });
    }

    /**
     * Remove a member (Delete or Detach)
     */
    static async removeMember(adminId: string, memberId: string) {
        const member = await prisma.user.findFirst({
            where: { id: memberId, parentId: adminId }
        });

        if (!member) throw new Error("Member not found.");

        // Option A: Hard Delete (simplest for now)
        return await prisma.user.delete({
            where: { id: memberId }
        });
    }
}