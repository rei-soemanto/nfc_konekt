import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ContactDetailView from '@/components/ui/pages/contacts/ContactDetailView'
import { ContactService } from '@/services/ContactService' // <--- Import from the new file

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // This call works again because the argument is now optional!
    const userId = await getAuthUserId(); 
    
    if (!userId) redirect('/auth/login');
    
    const { id } = await params;

    const data = await ContactService.getContactDetails(id, userId);

    if (!data) {
        return redirect('/dashboard/contacts');
    }

    return (
        <ContactDetailView 
            contact={data.contact} 
            registeredProfile={data.registeredProfile} 
        />
    );
}