'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type Contact = {
    id: string
    name: string
    email: string | null
    company: string | null
    website: string | null
    phone: string | null
    jobTitle: string | null
}

export default function ContactTable({ contacts }: { contacts: Contact[] }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCompany, setSelectedCompany] = useState('ALL')

    // 1. Extract Unique Companies for Dropdown
    const companies = useMemo(() => {
        // Get all companies, remove nulls/empty, remove duplicates, and sort
        const companyList = contacts
            .map(c => c.company)
            .filter((c): c is string => !!c && c.trim() !== '');
        return Array.from(new Set(companyList)).sort();
    }, [contacts]);

    // 2. Filter Logic
    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = 
            contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (contact.jobTitle && contact.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (contact.company && contact.company.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCompany = selectedCompany === 'ALL' || contact.company === selectedCompany;

        return matchesSearch && matchesCompany;
    });

    // --- EMPTY STATE (No contacts at all) ---
    if (contacts.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <i className="fa-regular fa-address-card text-2xl"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Contacts Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Scan a physical business card to add your first contact.</p>
                <Link href="/dashboard/contacts/scan" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                    Scan Now
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* --- SEARCH & FILTER BAR --- */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search name, email, or job..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                {/* Company Dropdown */}
                <div className="relative min-w-[200px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fa-solid fa-building text-gray-400"></i>
                    </div>
                    <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                    >
                        <option value="ALL">All Companies</option>
                        {companies.map((company) => (
                            <option key={company} value={company}>{company}</option>
                        ))}
                    </select>
                    {/* Custom Arrow Icon */}
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                        <i className="fa-solid fa-chevron-down text-xs"></i>
                    </div>
                </div>
            </div>

            {/* --- TABLE --- */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase font-bold text-xs border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4">Company</th>
                                <th className="px-6 py-4 text-center">Website</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredContacts.length > 0 ? (
                                filteredContacts.map((contact) => (
                                    <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        {/* Name & Title */}
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{contact.name}</div>
                                            <div className="text-xs text-gray-500">{contact.jobTitle || 'No Title'}</div>
                                        </td>
                                        
                                        {/* Email & Phone */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {contact.email && (
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                        <i className="fa-regular fa-envelope text-xs w-4"></i>
                                                        <span className="truncate max-w-[150px]" title={contact.email}>{contact.email}</span>
                                                    </div>
                                                )}
                                                {contact.phone && (
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                        <i className="fa-solid fa-phone text-xs w-4"></i>
                                                        <span>{contact.phone}</span>
                                                    </div>
                                                )}
                                                {!contact.email && !contact.phone && <span className="text-gray-400 italic">No info</span>}
                                            </div>
                                        </td>

                                        {/* Company */}
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900 dark:text-white font-medium">{contact.company || '-'}</div>
                                        </td>

                                        {/* Website Button */}
                                        <td className="px-6 py-4 text-center">
                                            {contact.website ? (
                                                <a 
                                                    href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 transition-colors"
                                                    title={`Visit ${contact.website}`}
                                                >
                                                    <i className="fa-solid fa-globe"></i>
                                                </a>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600 cursor-not-allowed">
                                                    <i className="fa-solid fa-globe"></i>
                                                </span>
                                            )}
                                        </td>

                                        {/* Detail Button */}
                                        <td className="px-6 py-4 text-right">
                                            <Link 
                                                href={`/dashboard/contacts/${contact.id}`}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold transition-all shadow-sm"
                                            >
                                                <i className="fa-solid fa-id-card"></i>
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                /* --- NO SEARCH RESULTS STATE --- */
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <i className="fa-solid fa-magnifying-glass text-2xl mb-3 opacity-20"></i>
                                            <p>No contacts found matching your criteria.</p>
                                            <button 
                                                onClick={() => { setSearchQuery(''); setSelectedCompany('ALL'); }}
                                                className="mt-2 text-indigo-600 hover:text-indigo-500 font-bold text-xs"
                                            >
                                                Clear Filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}