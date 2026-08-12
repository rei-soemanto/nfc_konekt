'use client'

import type { InvitationRow } from '@/actions/admin-invites'

type Props = {
    // Dates arrive serialized over the RSC boundary; formatDate re-hydrates.
    invitations: InvitationRow[]
}

const STATUS_STYLES: Record<InvitationRow['status'], string> = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    ACCEPTED: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    EXPIRED: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
}

const STATUS_LABELS: Record<InvitationRow['status'], string> = {
    PENDING: 'Pending',
    ACCEPTED: 'Registered',
    EXPIRED: 'Expired',
}

function formatDate(value: string | Date): string {
    return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function InvitationList({ invitations }: Props) {
    if (invitations.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
                <i className="fa-regular fa-envelope text-3xl text-gray-300 dark:text-gray-600"></i>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No invitations sent yet.</p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-bold text-gray-900 dark:text-white">Recent invitations</h2>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {invitations.map((inv) => (
                    <div key={inv.id} className="p-4 sm:p-6 flex items-center justify-between gap-3">
                        {/* min-w-0 on every flex ancestor, else a long email grows the row */}
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-900 dark:text-white">{inv.email}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                <span>{formatDate(inv.createdAt)}</span>
                                {inv.invitedByName && <span className="truncate">· by {inv.invitedByName}</span>}
                                {inv.promoCode && (
                                    <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 font-mono font-bold">
                                        {inv.promoCode}
                                    </span>
                                )}
                            </div>
                        </div>

                        <span className={`shrink-0 px-3 py-1 text-xs font-medium rounded-full border ${STATUS_STYLES[inv.status]}`}>
                            {STATUS_LABELS[inv.status]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
