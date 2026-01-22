import { prisma } from '@/lib/prisma'

export class CardService {
    /**
     * ADMIN ONLY: Global Search for ANY user/card
     * Used by: /dashboard/admin/writer (NFCWriter.tsx)
     */
    static async getGlobalCards(query: string) {
        return await prisma.card.findMany({
            where: {
                OR: [
                    { user: { fullName: { contains: query } } }, // removed mode: 'insensitive' for MySQL compatibility
                    { user: { email: { contains: query } } },
                    { slug: { contains: query } }
                ]
            },
            take: 20, // Limit results for performance
            select: {
                id: true,
                slug: true,
                status: true,
                user: { select: { fullName: true, email: true } }
            }
        });
    }

    /**
     * CORPORATE ONLY: Get cards for the Team Members
     * Used by: /dashboard/team/writer (NFCWriterClient.tsx)
     */
    static async getTeamCards(adminId: string) {
        return await prisma.user.findMany({
            where: { parentId: adminId }, // Only my children
            select: {
                id: true,
                fullName: true,
                email: true,
                cards: {
                    where: { status: 'ACTIVE' },
                    select: { id: true, slug: true },
                    take: 1
                }
            }
        });
    }

    /**
     * SHARED: Generate the Payload
     * Enforces the STRICT Access Rules
     */
    static async getCardWritePayload(cardId: string | undefined, slug: string | undefined, requesterId: string) {
        // 1. Find the card (lookup by ID or Slug depending on what the UI sent)
        const card = await prisma.card.findFirst({
            where: { 
                OR: [
                    { id: cardId },
                    { slug: slug }
                ]
            },
            include: { user: true }
        });

        if (!card) throw new Error("Card not found");

        // 2. Fetch the Requester to check Roles
        const requester = await prisma.user.findUnique({ 
            where: { id: requesterId },
            select: { id: true, role: true, planCategory: true } 
        });

        if (!requester) throw new Error("User not found");

        // --- STRICT PERMISSION CHECK ---

        // A. Is Application Admin? (Unrestricted)
        const isAppAdmin = requester.role === 'ADMIN';

        // B. Is Corporate Team Lead? (Restricted to own team)
        const isTeamParent = card.user.parentId === requester.id;
        
        // C. Is it the user themselves? (Technically owner, but your UI blocks this. We allow it in backend for safety, or block if you prefer)
        // For now, we allow Owner to write their own card if they somehow hit the API, 
        // BUT strictly enforcing your rule: "Personal may not access writer" is handled by the UI/Route protection.
        
        if (!isAppAdmin && !isTeamParent) {
            throw new Error("Unauthorized: You do not have permission to write this card.");
        }

        // 3. Generate Payload
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nfc.thewkm.com';
        
        return {
            slug: card.slug,
            payload: `${baseUrl}/p/${card.slug}`,
            targetUser: card.user.fullName
        };
    }
}