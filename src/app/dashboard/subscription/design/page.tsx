import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DesignSelectionForm from '@/components/ui/pages/subscription/DesignSelectionForm'

export default async function DesignPage({ searchParams }: { searchParams: Promise<{ planId: string, packs?: string, mode?: string }> }) {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    const { planId, packs, mode } = await searchParams;
    if (!planId) redirect('/dashboard/subscription/payment');

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Choose Card Design</h1>
            <p className="text-gray-500 mb-8">Select a premium template or upload your own custom branding.</p>
            
            <DesignSelectionForm 
                planId={planId}
                packs={Number(packs || 0)}
                mode={mode}
            />
        </div>
    )
}