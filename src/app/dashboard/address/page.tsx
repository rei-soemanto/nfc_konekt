import { getUserAddress } from '@/actions/address'
import AddressForm from '@/components/ui/pages/forms/AddressForm'

export default async function AddressPage() {
    const address = await getUserAddress();

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shipping Address</h1>
                <p className="text-gray-500 mt-1">Please provide your location for card delivery.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <AddressForm 
                    initialData={address} 
                    redirectAfter="/dashboard" // Redirect to dashboard after setup
                    buttonText={address ? "Update Address" : "Save & Continue"}
                />
            </div>
        </div>
    )
}