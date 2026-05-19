'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import PromoForm from './PromoForm'

export default function PromoClientWrapper({ initialPromos }: { initialPromos: any[] }) {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [editingPromo, setEditingPromo] = useState<any>(null); // State for Edit
    const [isDeleting, setIsDeleting] = useState<string | null>(null); // State for Delete Spinner

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

    // Logic: Filter & Sort
    const filteredPromos = useMemo(() => {
        return initialPromos
            .filter(p => {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = p.name.toLowerCase().includes(searchLower) || p.code.toLowerCase().includes(searchLower);
                const matchesStatus = statusFilter === 'ALL' ? true : statusFilter === 'ACTIVE' ? p.isActive : !p.isActive;
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortOrder === 'NEWEST' ? dateB - dateA : dateA - dateB;
            });
    }, [initialPromos, searchTerm, statusFilter, sortOrder]);

    // --- HANDLERS ---

    const handleCreate = () => {
        setEditingPromo(null); // Clear edit data
        setShowForm(true);
    };

    const handleEdit = (promo: any) => {
        setEditingPromo(promo); // Populate edit data
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this promo code? This cannot be undone.")) return;
        
        setIsDeleting(id);
        try {
            await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' });
            router.refresh();
        } catch (error) {
            alert("Failed to delete promo");
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div>
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <button 
                    onClick={handleCreate} 
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-800 transition-all active:scale-95 flex items-center gap-2"
                >
                    <i className="fa-solid fa-plus"></i> Create Promo
                </button>
                {/* ... (Search/Filter Inputs remain same) ... */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    {/* ... (Other filters) ... */}
                </div>
            </div>

            {/* Modal Form - Passes editingPromo if it exists */}
            {showForm && <PromoForm onClose={() => setShowForm(false)} initialData={editingPromo} />}

            {/* Data Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Name</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Code</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Discount</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Status</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {filteredPromos.map((promo) => (
                                <tr key={promo.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                    <td className="p-4 font-bold text-gray-900 dark:text-white">{promo.name}</td>
                                    <td className="p-4">
                                        <span className="font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 px-2 py-1 rounded text-xs font-bold">{promo.code}</span>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                        {promo.type === 'PERCENTAGE' ? `${promo.value}%` : `IDR ${promo.value.toLocaleString()}`}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                            promo.isActive 
                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                        }`}>
                                            {promo.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            {/* Edit Button */}
                                            <button 
                                                onClick={() => handleEdit(promo)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                                title="Edit"
                                            >
                                                <i className="fa-solid fa-pen text-xs"></i>
                                            </button>
                                            
                                            {/* Delete Button */}
                                            <button 
                                                onClick={() => handleDelete(promo.id)}
                                                disabled={isDeleting === promo.id}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                                title="Delete"
                                            >
                                                {isDeleting === promo.id ? (
                                                    <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                                                ) : (
                                                    <i className="fa-solid fa-trash text-xs"></i>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filteredPromos.length === 0 && (
                    <div className="p-12 text-center text-gray-400 dark:text-gray-500">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fa-solid fa-ticket text-3xl text-gray-300 dark:text-gray-600"></i>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white mb-1">No promo codes found</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>
        </div>
    )
}