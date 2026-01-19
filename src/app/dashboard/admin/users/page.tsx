import { getAllUsers } from '@/actions/admin-users'
import UserManagement from '@/components/ui/pages/admin/UserManagement'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function AdminUsersPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    // Verify Admin
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin || admin.role !== 'ADMIN') redirect('/dashboard');

    const users = await getAllUsers();

    return (
        <div className="max-w-[1600px] mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                <p className="text-gray-500 mt-1">View, edit, or delete user accounts and subscriptions.</p>
            </div>
            
            <UserManagement initialUsers={users} />
        </div>
    )
}