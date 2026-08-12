import { redirect } from 'next/navigation'
import { requireAdmin } from '@/actions/admin'
import { getSelectablePromos, getInvitations } from '@/actions/admin-invites'
import InviteClientWrapper from '@/features/admin/invites/InviteClientWrapper'

// Force dynamic so the promo options and invitation list are never stale.
export const dynamic = 'force-dynamic';

export default async function AdminInvitesPage() {
    // redirect() throws a control-flow signal, so it must sit in the catch, not the try.
    try {
        await requireAdmin();
    } catch {
        redirect('/dashboard');
    }

    const [promos, invitations] = await Promise.all([
        getSelectablePromos(),
        getInvitations(),
    ]);

    // No px-* here: the dashboard shell already applies p-4 md:p-8.
    return (
        <div className="max-w-5xl mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invitations</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Invite someone who doesn&apos;t have an NFC Konekt account yet, optionally with a promo code they can use when they subscribe.
                </p>
            </div>

            <InviteClientWrapper initialPromos={promos} initialInvitations={invitations} />
        </div>
    )
}
