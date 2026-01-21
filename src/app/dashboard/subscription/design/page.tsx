import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProfileDataService } from '@/services/ProfileDataService'
// Ensure you are importing the correct form component you are using
import DesignSelectionForm from '@/components/ui/pages/subscription/DesignSelectionForm' 

// Helper to format address object into string
function formatAddress(address: any) {
    if (!address) return '';
    // Filter out null/undefined/empty values and join them
    return [address.street, address.city, address.country]
        .filter(Boolean)
        .join(', ');
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function DesignPage({ searchParams }: { searchParams: SearchParams }) {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    const params = await searchParams;
    const planId = typeof params.planId === 'string' ? params.planId : '';
    const packs = typeof params.packs === 'string' ? parseInt(params.packs) : 1;
    const mode = typeof params.mode === 'string' ? params.mode : undefined;

    // 1. Fetch User Data (Now includes Address)
    const profileService = new ProfileDataService(userId);
    const user = await profileService.getTargetUserProfile(userId);
    
    if (!user) redirect('/dashboard');

    // 2. Get Company Context
    const companyDetails = ProfileDataService.getInheritedCompanyDetails(user);

    // 3. Prepare Data for Designer
    const userData = {
        fullName: user.fullName,
        email: user.email,
        jobTitle: user.jobTitle || '',
        phone: user.phone || '', 
        companyName: user.companyName || '',
        scope: companyDetails.scope || '',
        specialty: companyDetails.speciality || '',
        
        // 4. Format the Address Object to String
        address: formatAddress(user.address), 
        
        companyLogoUrl: companyDetails.logoUrl || null
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Design Your Card</h1>
            
            <DesignSelectionForm 
                planId={planId}
                packs={packs}
                mode={mode}
                userData={userData} 
            />
        </div>
    )
}