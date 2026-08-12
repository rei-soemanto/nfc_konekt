'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendInvitation, type SelectablePromo } from '@/actions/admin-invites'

type Props = {
    promos: SelectablePromo[]
}

export default function InviteForm({ promos }: Props) {
    const router = useRouter()

    const [email, setEmail] = useState('')
    const [promoCode, setPromoCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)
        setFallbackUrl(null)
        setCopied(false)

        try {
            const res = await sendInvitation({ email, promoCode: promoCode || null })

            if (!res.success) {
                setError(res.message)
                return
            }

            setSuccess(res.message)
            // Present only when the row was created but SMTP failed.
            setFallbackUrl(res.inviteUrl ?? null)
            setEmail('')
            setPromoCode('')
            router.refresh()
        } catch (err) {
            console.error('[InviteForm.handleSubmit]', err)
            setError('Could not reach the server, so no invitation was sent. Check your connection and try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Send an invitation</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="invite-email" className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Email address
                    </label>
                    <input
                        id="invite-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="someone@example.com"
                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-400">Must not already have an NFC Konekt account.</p>
                </div>

                <div>
                    <label htmlFor="invite-promo" className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Promo code <span className="font-normal normal-case text-gray-400">(optional)</span>
                    </label>
                    <select
                        id="invite-promo"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">No promo code</option>
                        {promos.map((p) => (
                            <option key={p.code} value={p.code}>{p.label}</option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-400">
                        {promos.length === 0
                            ? 'No promo codes are currently active. Create one under Promo Codes first.'
                            : 'Only codes that are active right now are listed. They can enter it at checkout.'}
                    </p>
                </div>

                {error && (
                    <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                        <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0"></i>
                        <span>{error}</span>
                    </p>
                )}

                {success && (
                    <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400">
                        <p className="flex items-start gap-2">
                            <i className="fa-solid fa-circle-check mt-0.5 shrink-0"></i>
                            <span>{success}</span>
                        </p>

                        {fallbackUrl && (
                            <div className="mt-3 rounded-lg bg-white dark:bg-gray-800 p-3">
                                <p className="mb-2 font-mono text-xs break-all text-gray-900 dark:text-gray-100">{fallbackUrl}</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard?.writeText(fallbackUrl)
                                        setCopied(true)
                                    }}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                                >
                                    <i className="fa-regular fa-copy mr-1.5"></i>
                                    {copied ? 'Copied' : 'Copy link'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-500/30 flex items-center justify-center"
                >
                    {loading ? (
                        <><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Sending...</>
                    ) : (
                        <><i className="fa-solid fa-paper-plane mr-2"></i> Send invitation</>
                    )}
                </button>
            </form>
        </div>
    )
}
