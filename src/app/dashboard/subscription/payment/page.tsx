import { prisma } from '@/lib/prisma'
import SubscriptionPlans from '@/components/ui/pages/dashboard/SubscriptionPlans'
import { redirect } from 'next/navigation'

// Helper for Auth (Replace with your actual session)
async function getAuthUserId() {
    const user = await prisma.user.findFirst();
    return user?.id;
}

export default async function PaymentPage() {
    const userId = await getAuthUserId();
    
    if (!userId) {
        redirect('/auth');
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Upgrade Your Plan</h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Unlock the full potential of your digital networking with our premium features. 
                    Secure payment powered by Midtrans.
                </p>
            </div>

            {/* Client Component handling the UI and Payment Logic */}
            <SubscriptionPlans userId={userId} />
            
            <div className="mt-12 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
                    <i className="fa-solid fa-lock"></i>
                    Payments are secure and encrypted.
                </p>
                <div className="mt-4 flex justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                    {/* Placeholder for payment logos */}
                    <div className="h-8 w-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    <div className="h-8 w-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    <div className="h-8 w-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
            </div>
        </div>
    )
}