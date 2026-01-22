import { prisma } from '@/lib/prisma'

export class ContactService {
    static async getContactDetails(contactId: string, ownerId: string) {
        const contact = await prisma.contact.findUnique({
            where: { id: contactId },
        });

        if (!contact || contact.userId !== ownerId) {
            return null;
        }

        let registeredProfile = null;
        if (contact.email) {
            registeredProfile = await prisma.user.findUnique({
                where: { email: contact.email },
                select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                    cards: {
                        where: { status: 'ACTIVE' },
                        select: { slug: true },
                        take: 1
                    }
                }
            });
        }

        return { contact, registeredProfile };
    }

    static async getAllContacts(userId: string) {
        return await prisma.contact.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                jobTitle: true,
                company: true,
                avatarUrl: false,
                notes: false
            }
        });
    }
}