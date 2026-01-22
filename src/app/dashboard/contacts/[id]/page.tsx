import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ContactDetailView from '@/components/ui/pages/contacts/ContactDetailView'

// --- 1. Service / Logic Layer (Object Oriented Style) ---
class ContactService {
    /**
     * Retrieves a contact by ID and verifies ownership.
     * Also checks if the contact's email is registered in the system.
     */
    static async getContactDetails(contactId: string, ownerId: string) {
        const contact = await prisma.contact.findUnique({
            where: { id: contactId },
        });

        // Security check: Ensure the contact belongs to the currently logged-in user
        if (!contact || contact.userId !== ownerId) {
            return null;
        }

        // Check if this email belongs to a registered NFC Konekt user
        let registeredProfile = null;
        if (contact.email) {
            registeredProfile = await prisma.user.findUnique({
                where: { email: contact.email },
                select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                    // Check if they have an active card to link to
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
}

// --- 2. Page Controller ---
export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');
    
    const { id } = await params;

    // Use the Service to fetch data
    const data = await ContactService.getContactDetails(id, userId);

    if (!data) {
        return redirect('/dashboard/contacts');
    }

    // Render the View
    return (
        <ContactDetailView 
            contact={data.contact} 
            registeredProfile={data.registeredProfile} 
        />
    );
}