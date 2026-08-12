'use client'

import InviteForm from './InviteForm'
import InvitationList from './InvitationList'
import type { SelectablePromo, InvitationRow } from '@/actions/admin-invites'

type Props = {
    initialPromos: SelectablePromo[]
    initialInvitations: InvitationRow[]
}

export default function InviteClientWrapper({ initialPromos, initialInvitations }: Props) {
    return (
        <div className="space-y-8">
            <InviteForm promos={initialPromos} />
            <InvitationList invitations={initialInvitations} />
        </div>
    )
}
