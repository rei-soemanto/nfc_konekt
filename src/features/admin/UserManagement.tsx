'use client'

import { useState } from 'react'
import { updateUserDetails, deleteUser } from '@/actions/admin-users'
import { UserStatus, SubscriptionStatus, CardStatus } from '@prisma/client'

type UserData = {
    id: string
    fullName: string
    email: string
    createdAt: Date
    accountStatus: UserStatus
    parent: { fullName: string, email: string } | null
    subscription: {
        status: SubscriptionStatus
        endDate: Date
        expansionPacks: number
        plan: { name: string } | null
    } | null
    cards: { id: string, slug: string, status: CardStatus }[]
    nextPaymentAmount: number
    nextPaymentDate: Date | null
}

export default function UserManagement({ initialUsers }: { initialUsers: any[] }) {
    const [users] = useState<UserData[]>(initialUsers); 
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(false);

    // Filter Logic
    const filteredUsers = users.filter(u => 
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    // Edit State
    const [editForm, setEditForm] = useState<{
        accountStatus: UserStatus
        subscriptionStatus: SubscriptionStatus
        expansionPacks: number
        cardUpdates: Record<string, CardStatus>
    } | null>(null);

    const openModal = (user: UserData) => {
        setSelectedUser(user);
        setEditForm({
            accountStatus: user.accountStatus,
            subscriptionStatus: user.subscription?.status || 'EXPIRED',
            expansionPacks: user.subscription?.expansionPacks || 0,
            cardUpdates: {}
        });
    };

    const handleSave = async () => {
        if (!selectedUser || !editForm) return;
        if (!confirm("Are you sure you want to update this user?")) return;

        setLoading(true);
        try {
            await updateUserDetails(selectedUser.id, {
                accountStatus: editForm.accountStatus,
                subscriptionStatus: editForm.subscriptionStatus,
                expansionPacks: editForm.expansionPacks,
            });

            for (const [cardId, status] of Object.entries(editForm.cardUpdates)) {
                await updateUserDetails(selectedUser.id, {
                    accountStatus: editForm.accountStatus,
                    cardId: cardId,
                    cardStatus: status
                });
            }

            alert("User updated successfully");
            window.location.reload(); 
        } catch (e) {
            alert("Failed to update");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        const confirmName = prompt(`Type "${selectedUser.email}" to confirm deletion. This cannot be undone.`);
        if (confirmName !== selectedUser.email) return;

        setLoading(true);
        await deleteUser(selectedUser.id);
        setLoading(false);
        window.location.reload();
    };

    // FIX: Consistent Date Formatter
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 mb-6 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input 
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase font-bold text-xs">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Parent / Org</th>
                                <th className="px-6 py-4">Subscription</th>
                                <th className="px-6 py-4">Next Bill</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{user.fullName}</div>
                                        <div className="text-gray-500 text-xs">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.parent ? (
                                            <div>
                                                <div className="font-medium text-indigo-600 dark:text-indigo-400">{user.parent.fullName}</div>
                                                <div className="text-xs text-gray-400">{user.parent.email}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.subscription ? (
                                            <div>
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                                                    user.subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {user.subscription.status}
                                                </span>
                                                <div className="text-xs text-gray-500 mt-1">{user.subscription.plan?.name}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">No Plan</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.nextPaymentDate ? (
                                            <div>
                                                <div className="font-mono font-medium">
                                                    IDR {user.nextPaymentAmount.toLocaleString('id-ID')}
                                                </div>
                                                {/* FIX: Use consistent formatter */}
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(user.nextPaymentDate)}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => openModal(user)}
                                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedUser && editForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Details</h2>
                            <button onClick={() => setSelectedUser(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="label-text">Full Name</label>
                                    <p className="font-bold">{selectedUser.fullName}</p>
                                </div>
                                <div>
                                    <label className="label-text">Email</label>
                                    <p className="font-mono text-sm">{selectedUser.email}</p>
                                </div>
                                <div>
                                    <label className="label-text">Join Date</label>
                                    {/* FIX: Use consistent formatter */}
                                    <p className="text-sm">{formatDate(selectedUser.createdAt)}</p>
                                </div>
                                <div>
                                    <label className="label-text">Account Status</label>
                                    <select 
                                        value={editForm.accountStatus}
                                        onChange={(e) => setEditForm({...editForm, accountStatus: e.target.value as UserStatus})}
                                        className="input-field mt-1 py-1"
                                    >
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="LOCKED">LOCKED</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Subscription Override</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label-text">Sub Status</label>
                                        <select 
                                            value={editForm.subscriptionStatus}
                                            onChange={(e) => setEditForm({...editForm, subscriptionStatus: e.target.value as SubscriptionStatus})}
                                            className="input-field mt-1"
                                        >
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="EXPIRED">EXPIRED</option>
                                            <option value="CANCELED">CANCELED</option>
                                            <option value="GRACE_PERIOD">GRACE PERIOD</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label-text">Expansion Packs</label>
                                        <input 
                                            type="number" 
                                            value={editForm.expansionPacks}
                                            onChange={(e) => setEditForm({...editForm, expansionPacks: Number(e.target.value)})}
                                            className="input-field mt-1"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Updates quantity without triggering charge.</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Registered Cards</h3>
                                <div className="space-y-2">
                                    {selectedUser.cards.map(card => (
                                        <div key={card.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                            <div>
                                                <p className="font-mono text-sm font-bold">{card.slug}</p>
                                                <p className="text-xs text-gray-400">ID: {card.id}</p>
                                            </div>
                                            <select 
                                                value={editForm.cardUpdates[card.id] || card.status}
                                                onChange={(e) => setEditForm({
                                                    ...editForm, 
                                                    cardUpdates: { ...editForm.cardUpdates, [card.id]: e.target.value as CardStatus }
                                                })}
                                                className="text-xs py-1 px-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                            >
                                                <option value="ACTIVE">ACTIVE</option>
                                                <option value="INACTIVE">INACTIVE</option>
                                                <option value="LOST">LOST</option>
                                            </select>
                                        </div>
                                    ))}
                                    {selectedUser.cards.length === 0 && (
                                        <p className="text-gray-400 italic text-sm">No cards linked.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between bg-gray-50 dark:bg-gray-900">
                            <button 
                                onClick={handleDelete}
                                disabled={loading}
                                className="text-red-600 hover:text-red-700 font-bold text-sm"
                            >
                                <i className="fa-solid fa-trash mr-2"></i> Delete User
                            </button>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setSelectedUser(null)}
                                    className="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-lg transition-all"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .label-text { @apply block text-xs font-bold text-gray-500 uppercase mb-1; }
                .input-field { @apply w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500; }
            `}</style>
        </>
    )
}