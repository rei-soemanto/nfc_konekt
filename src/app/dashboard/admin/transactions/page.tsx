import { prisma } from '@/lib/prisma'
import { getAdminData } from '@/actions/admin'
import TransactionTable from '@/components/ui/pages/admin/TransactionTable'

export default async function AdminTransactionsPage() {
    await getAdminData();

    // FETCH TRANSACTIONS (History)
    const transactions = await prisma.transaction.findMany({
        where: { 
            // Optional: Filter only paid or pending, or show all
            status: { in: ['PAID', 'PENDING'] }
        },
        include: {
            user: { 
                select: { 
                    fullName: true, 
                    email: true,
                    // We still fetch members to show context, but the manifest is in 'pendingTeamData'
                    members: { select: { fullName: true, email: true } }
                } 
            },
            plan: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="max-w-[1600px] mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Transactions & Shipments</h1>
            <TransactionTable transactions={transactions} />
        </div>
    )
}