import { PromoService } from '@/services/PromoService'
import PromoClientWrapper from '@/components/ui/pages/admin/promos/PromoClientWrapper'

// Force dynamic so it refetches on new request
export const dynamic = 'force-dynamic'; 

export default async function AdminPromosPage() {
    // 1. Fetch from DB
    const promos = await PromoService.getAll();

    // 2. Pass to Wrapper
    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promo Manager</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create and manage discount codes for your plans.</p>
            </div>
            
            <PromoClientWrapper initialPromos={promos} />
        </div>
    )
}