import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ui/pages/dashboard/ProfileForm'
import SecuritySettings from '@/components/ui/pages/dashboard/SecuritySettings'
import AddressForm from '@/components/ui/pages/forms/AddressForm' 
import { getUserAddress } from '@/actions/address' 
import CompanyProfileForm from '@/components/ui/pages/account/CompanyProfileForm'

export default async function AccountPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    // 1. Fetch User (WITH SUBSCRIPTION) & Address Parallelly
    const [user, address] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            include: { 
                socialLinks: true,
                // FIX: Include subscription and plan to check for Corporate Admin status
                subscription: {
                    include: { plan: true }
                }
            }
        }),
        getUserAddress()
    ]);

    if (!user) redirect('/auth');

    const userData = {
        fullName: user.fullName,
        email: user.email,
        companyName: user.companyName,
        companyWebsite: user.companyWebsite,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        socialLinks: user.socialLinks.map(link => ({
            platform: link.platform,
            url: link.url
        }))
    };

    // Safe optional chaining for admin check
    const isCorporateAdmin = 
        user.subscription?.plan?.category === 'CORPORATE';

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-12 px-4">
            {/* Section 1: Public Profile */}
            <section>
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Public Profile</h2>
                    <p className="text-gray-500 dark:text-gray-400">This information will be displayed on your digital card.</p>
                </div>
                <ProfileForm user={userData} />
            </section>

            <hr className="border-gray-200 dark:border-gray-800" />

            {/* Section 2: Shipping Address */}
            <section>
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shipping Address</h2>
                    <p className="text-gray-500 dark:text-gray-400">Used for card delivery and billing invoices.</p>
                </div>
                
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <AddressForm 
                        initialData={address} 
                        buttonText="Update Address"
                    />
                </div>
            </section>

            {/* Section 3: Corporate Settings (Conditional) */}
            {isCorporateAdmin && (
                <>
                    <hr className="border-gray-200 dark:border-gray-800" />
                    <section>
                         <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Corporate Settings</h2>
                            <p className="text-gray-500 dark:text-gray-400">Manage your company details visible to your team.</p>
                        </div>
                        <CompanyProfileForm initialData={{
                            scope: user.companyScope,
                            speciality: user.companySpeciality,
                            description: user.companyDescription
                        }} />
                    </section>
                </>
            )}

            <hr className="border-gray-200 dark:border-gray-800" />

            {/* Section 4: Security & Danger Zone */}
            <section>
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security & Account Access</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage your password and account deletion preferences.</p>
                </div>
                <SecuritySettings />
            </section>
        </div>
    )
}