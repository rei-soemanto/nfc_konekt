'use client'

import { useActionState } from 'react'
import { sendContactMessage } from '@/actions/contact'
import { SubmitButton } from '@/components/ui/Button'

/**
 * Footer contact form.
 *
 * Fields are hand-rolled rather than using `components/ui/Input`: that
 * component hardcodes a `text-gray-700` label, which is unreadable on the
 * footer's dark card, and there is no Textarea equivalent for the message
 * field. Doing all three by hand keeps the styling and error treatment
 * consistent across them.
 */
export default function ContactForm() {
    const [state, action] = useActionState(sendContactMessage, undefined)

    const fieldClass =
        'w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none'
    const labelClass = 'text-sm font-medium text-gray-300 mb-1 block'
    const errorClass = 'mt-1 text-xs text-red-400'

    return (
        <form action={action} className="space-y-4">
            {/*
                Honeypot. Real users never see or tab to this; bots fill every
                field they find. `sendContactMessage` drops the submission when
                it is non-empty and still reports success, so an abuser learns
                nothing from the response.
            */}
            <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="company_website">Company website</label>
                <input
                    id="company_website"
                    type="text"
                    name="company_website"
                    tabIndex={-1}
                    autoComplete="off"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="contact-name" className={labelClass}>Name</label>
                    <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        maxLength={100}
                        placeholder="Your name"
                        aria-invalid={Boolean(state?.errors?.name)}
                        className={fieldClass}
                    />
                    {state?.errors?.name && <p className={errorClass}>{state.errors.name[0]}</p>}
                </div>

                <div>
                    <label htmlFor="contact-email" className={labelClass}>Email</label>
                    <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        maxLength={254}
                        placeholder="your@email.com"
                        aria-invalid={Boolean(state?.errors?.email)}
                        className={fieldClass}
                    />
                    {state?.errors?.email && <p className={errorClass}>{state.errors.email[0]}</p>}
                </div>
            </div>

            <div>
                <label htmlFor="contact-message" className={labelClass}>Message</label>
                <textarea
                    id="contact-message"
                    name="message"
                    rows={4}
                    required
                    maxLength={4000}
                    placeholder="How can we help?"
                    aria-invalid={Boolean(state?.errors?.message)}
                    className={fieldClass}
                />
                {state?.errors?.message && <p className={errorClass}>{state.errors.message[0]}</p>}
            </div>

            {state?.success && state?.message && (
                <p role="status" className="flex items-start gap-2 rounded-lg border border-green-800 bg-green-900/30 p-3 text-sm text-green-300">
                    <i className="fa-solid fa-circle-check mt-0.5 shrink-0"></i>
                    <span>{state.message}</span>
                </p>
            )}

            {!state?.success && state?.message && (
                <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-300">
                    <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0"></i>
                    <span>{state.message}</span>
                </p>
            )}

            <SubmitButton className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors">
                Send Message
            </SubmitButton>
        </form>
    )
}
