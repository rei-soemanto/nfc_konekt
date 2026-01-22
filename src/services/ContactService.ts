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

    static async createContact(ownerId: string, data: any) {
        let contactData = {
            userId: ownerId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            jobTitle: data.jobTitle,
            company: data.company,
            website: data.website,
            notes: data.notes
        };

        // FEATURE: If a 'slug' is provided (e.g., from scanning an NFC card), 
        // fetch that User's details and auto-fill the contact.
        if (data.slug) {
            const card = await prisma.card.findUnique({
                where: { slug: data.slug },
                include: { user: true }
            });

            if (card) {
                // Auto-fill missing fields from the registered user profile
                contactData.name = contactData.name || card.user.fullName;
                contactData.email = contactData.email || card.user.email;
                contactData.phone = contactData.phone || card.user.phone;
                contactData.jobTitle = contactData.jobTitle || card.user.jobTitle;
                contactData.company = contactData.company || card.user.companyName;
                contactData.website = contactData.website || card.user.companyWebsite;
                contactData.notes = contactData.notes || `Scanned from card: ${card.slug}`;
            }
        }

        // Validate minimum requirement
        if (!contactData.name) {
            throw new Error("Contact name is required");
        }

        // Create the record
        return await prisma.contact.create({
            data: contactData
        });
    }

    /**
     * NEW: Update a Contact
     */
    static async updateContact(ownerId: string, contactId: string, data: any) {
        // Security check
        const existing = await prisma.contact.findFirst({
            where: { id: contactId, userId: ownerId }
        });
        
        if (!existing) throw new Error("Contact not found");

        return await prisma.contact.update({
            where: { id: contactId },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                jobTitle: data.jobTitle,
                company: data.company,
                website: data.website,
                notes: data.notes
            }
        });
    }

    /**
     * NEW: Delete a Contact
     */
    static async deleteContact(ownerId: string, contactId: string) {
        const existing = await prisma.contact.findFirst({
            where: { id: contactId, userId: ownerId }
        });
        
        if (!existing) throw new Error("Contact not found");

        return await prisma.contact.delete({
            where: { id: contactId }
        });
    }
}