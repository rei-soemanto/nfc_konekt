import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PLAN_CONFIG, EXPANSION_PACK_SIZE } from '@/lib/plans'
import TeamStats from '@/components/ui/pages/team/TeamStats'
import TeamList from '@/components/ui/pages/team/TeamList'
import AddMemberForm from '@/components/ui/pages/team/AddMemberForm'

export default async function TeamPage() {
    const userId = await getAuthUserId();
    if (!userId) redirect('/auth/login');

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            subscription: { include: { plan: true } },
            members: { orderBy: { createdAt: 'desc' }, include: { cards: true } },
            parent: {
                include: {
                    subscription: { include: { plan: true } },
                    members: { orderBy: { createdAt: 'desc' }, include: { cards: true } }
                }
            }
        }
    });

    if (!user) return redirect('/auth/login');

    // 1. Identify Manager
    const manager = user.parent || user;
    const plan = manager.subscription?.plan;
    
    if (!plan) return redirect('/dashboard/subscription');

    // 2. Combine Manager + Members for Display
    // We create a "fake" member object for the manager to display them in the list
    const managerAsMember = {
        ...manager,
        cards: [], // Or fetch manager's cards if needed
        isManager: true // Helper flag for UI if needed
    };

    // FIX: Add Manager to the list
    // @ts-ignore (Types might conflict slightly depending on your Card relation, usually okay)
    const allTeamMembers = [managerAsMember, ...manager.members];

    // 3. Limits
    const baseUsers = PLAN_CONFIG['CORPORATE'].baseUsers; 
    const packsBought = manager.subscription?.expansionPacks || 0;
    const maxUsers = baseUsers + (packsBought * EXPANSION_PACK_SIZE);
    
    const isManager = !user.parentId; 
    // Count only "Members" for the limit check (Manager doesn't count against "Added" seats usually, or does they?)
    // Actually, in Corporate, 10 seats includes the Manager.
    const currentUsage = allTeamMembers.length;
    const canAddMore = isManager && (currentUsage < maxUsers);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isManager ? 'My Team' : `Team: ${manager.companyName || manager.fullName}`}
                </h1>
                <p className="text-gray-500 mt-1">
                    Manage your team members and NFC licenses.
                </p>
            </div>

            <TeamStats 
                current={currentUsage} 
                max={maxUsers} 
                planName={plan.name}
                upgradeUrl="/dashboard/subscription/expansion" 
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Pass the Combined List */}
                    <TeamList members={allTeamMembers} isReadOnly={!isManager} />
                </div>

                {isManager && (
                    <div className="lg:col-span-1">
                        <div className="sticky top-6">
                            <AddMemberForm disabled={!canAddMore} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}