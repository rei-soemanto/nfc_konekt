'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Select from 'react-select'

type Connection = {
    id: string
    targetId: string
    target: {
        id: string
        fullName: string
        email: string
        avatarUrl: string | null
        jobTitle: string | null
        companyName: string | null
        companyScope: string | null
        companySpeciality: string | null
        companyLogoUrl: string | null
    }
}

type Props = {
    isLocked: boolean
    connections: Connection[]
}

export default function ConnectionList({ isLocked, connections }: Props) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedIndustry, setSelectedIndustry] = useState<{ value: string, label: string } | null>(null)
    const [selectedSpecialty, setSelectedSpecialty] = useState<{ value: string, label: string } | null>(null)
    const [selectedCompany, setSelectedCompany] = useState<{ value: string, label: string } | null>(null)

    // --- 1. EXTRACT UNIQUE OPTIONS FROM DATA ---
    const options = useMemo(() => {
        const industries = new Set<string>();
        const specialties = new Set<string>();
        const companies = new Set<string>();

        connections.forEach(c => {
            if (c.target.companyScope) industries.add(c.target.companyScope);
            if (c.target.companySpeciality) specialties.add(c.target.companySpeciality);
            if (c.target.companyName) companies.add(c.target.companyName);
        });

        return {
            industries: Array.from(industries).sort().map(i => ({ value: i, label: i })),
            specialties: Array.from(specialties).sort().map(s => ({ value: s, label: s })),
            companies: Array.from(companies).sort().map(c => ({ value: c, label: c }))
        };
    }, [connections]);

    // --- 2. FILTER LOGIC ---
    const filteredConnections = connections.filter(c => {
        const t = c.target;
        
        // Text Search (Name, Email, Job, Company)
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
            t.fullName.toLowerCase().includes(searchLower) ||
            t.email.toLowerCase().includes(searchLower) ||
            (t.jobTitle?.toLowerCase().includes(searchLower) ?? false) ||
            (t.companyName?.toLowerCase().includes(searchLower) ?? false);

        // Dropdown Filters
        const matchesIndustry = selectedIndustry ? t.companyScope === selectedIndustry.value : true;
        const matchesSpecialty = selectedSpecialty ? t.companySpeciality === selectedSpecialty.value : true;
        const matchesCompany = selectedCompany ? t.companyName === selectedCompany.value : true;

        return matchesSearch && matchesIndustry && matchesSpecialty && matchesCompany;
    });

    // --- STYLES FOR REACT-SELECT ---
    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: 'var(--bg-select)', 
            borderColor: '#E5E7EB', // gray-200
            borderRadius: '0.75rem', // rounded-xl
            padding: '2px',
            fontSize: '0.875rem',
            boxShadow: 'none',
            '&:hover': { borderColor: '#A5B4FC' }, // indigo-300
            '@media (prefers-color-scheme: dark)': {
                backgroundColor: '#1f2937', // gray-800
                borderColor: '#374151', // gray-700
                color: 'white',
            },
            '@media (prefers-color-scheme: light)': {
                backgroundColor: '#ffffff',
            }
        }),
        menu: (base: any) => ({
            ...base,
            zIndex: 50,
            backgroundColor: '#ffffff',
            '@media (prefers-color-scheme: dark)': {
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
            }
        }),
        singleValue: (base: any) => ({
            ...base,
            color: 'inherit',
            '@media (prefers-color-scheme: dark)': { color: '#ffffff' }
        }),
        input: (base: any) => ({
            ...base,
            color: 'inherit',
            '@media (prefers-color-scheme: dark)': { color: '#ffffff' }
        }),
        option: (base: any, state: { isFocused: boolean; isSelected: boolean }) => ({
            ...base,
            backgroundColor: state.isSelected ? '#4F46E5' : state.isFocused ? '#E0E7FF' : 'transparent',
            color: state.isSelected ? 'white' : 'inherit',
            cursor: 'pointer',
            '@media (prefers-color-scheme: dark)': {
                backgroundColor: state.isSelected ? '#4F46E5' : state.isFocused ? '#374151' : 'transparent',
                color: state.isSelected ? 'white' : '#D1D5DB',
            }
        }),
        placeholder: (base: any) => ({
            ...base,
            color: '#9CA3AF', // gray-400
        })
    };

    // --- LOCKED VIEW ---
    if (isLocked) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 shadow-xl">
                    <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fa-solid fa-lock text-3xl"></i>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Unlock Your Network</h1>
                    <p className="text-gray-500 max-w-lg mx-auto mb-8 text-lg">
                        The <strong>Connect</strong> feature allows you to build a professional network and save profiles. 
                        Upgrade your plan to start saving connections and viewing corporate details.
                    </p>
                    <Link 
                        href="/dashboard/subscription/payment" 
                        className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-lg shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                    >
                        Upgrade Now
                    </Link>
                </div>
            </div>
        )
    }

    // --- NORMAL VIEW ---
    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Connections</h1>
            
            {/* --- SEARCH & FILTER BAR --- */}
            {connections.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search Input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i className="fa-solid fa-search text-gray-400"></i>
                            </div>
                            <input 
                                type="text"
                                placeholder="Search name, job..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        {/* Industry Dropdown */}
                        <Select
                            instanceId="filter-industry"
                            options={options.industries}
                            value={selectedIndustry}
                            onChange={(opt) => setSelectedIndustry(opt)}
                            placeholder="Industry"
                            styles={selectStyles}
                            isClearable
                            classNamePrefix="react-select"
                        />

                        {/* Specialty Dropdown */}
                        <Select
                            instanceId="filter-industry"
                            options={options.specialties}
                            value={selectedSpecialty}
                            onChange={(opt) => setSelectedSpecialty(opt)}
                            placeholder="Specialty"
                            styles={selectStyles}
                            isClearable
                            classNamePrefix="react-select"
                        />

                        {/* Company Dropdown */}
                        <Select
                            instanceId="filter-industry"
                            options={options.companies}
                            value={selectedCompany}
                            onChange={(opt) => setSelectedCompany(opt)}
                            placeholder="Company"
                            styles={selectStyles}
                            isClearable
                            classNamePrefix="react-select"
                        />
                    </div>
                </div>
            )}

            {/* --- LIST --- */}
            {filteredConnections.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    {connections.length === 0 ? (
                        <>
                            <p className="text-gray-500 dark:text-gray-400">You haven't connected with anyone yet.</p>
                            <p className="text-sm text-gray-400 mt-1">Scan a card to add them instantly.</p>
                        </>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">No connections match your filters.</p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredConnections.map((c) => (
                        <Link 
                            key={c.id} 
                            href={`/dashboard/connect/${c.targetId}`}
                            className="group block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all overflow-hidden"
                        >
                            <div className="flex flex-col md:flex-row">
                                
                                {/* LEFT: Person Details */}
                                <div className="p-5 flex items-center gap-5 flex-1 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
                                    <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xl font-bold text-indigo-700 dark:text-indigo-400 overflow-hidden shrink-0 border-2 border-white dark:border-gray-800 shadow-sm">
                                        {c.target.avatarUrl ? (
                                            <img src={c.target.avatarUrl} className="w-full h-full object-cover" alt={c.target.fullName} />
                                        ) : (
                                            c.target.fullName.charAt(0)
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate group-hover:text-indigo-600 transition-colors">
                                            {c.target.fullName}
                                        </h3>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate mb-0.5">
                                            {c.target.jobTitle || 'No Title'}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate flex items-center">
                                            <i className="fa-regular fa-envelope mr-1.5"></i>
                                            {c.target.email}
                                        </p>
                                    </div>
                                </div>

                                {/* RIGHT: Company Card */}
                                <div className="p-4 md:w-80 bg-gray-50 dark:bg-gray-800/50 flex flex-col justify-center">
                                    {c.target.companyName ? (
                                        <div className="flex items-center gap-3">
                                            {/* Company Logo */}
                                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center text-gray-400 border border-gray-200 dark:border-gray-600 shrink-0 overflow-hidden">
                                                {c.target.companyLogoUrl ? (
                                                    <img src={c.target.companyLogoUrl} className="w-full h-full object-contain" alt="Logo" />
                                                ) : (
                                                    <i className="fa-solid fa-building"></i>
                                                )}
                                            </div>
                                            
                                            {/* Company Info */}
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                    {c.target.companyName}
                                                </p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {c.target.companyScope && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 truncate max-w-[100px]">
                                                            {c.target.companyScope}
                                                        </span>
                                                    )}
                                                    {c.target.companySpeciality && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800 truncate max-w-[100px]">
                                                            {c.target.companySpeciality}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 opacity-50">
                                            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                                <i className="fa-solid fa-building-slash"></i>
                                            </div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">No company details</p>
                                        </div>
                                    )}
                                </div>

                                {/* Arrow Icon (Mobile: Hidden, Desktop: Visible) */}
                                <div className="hidden md:flex w-12 items-center justify-center text-gray-300 group-hover:text-indigo-500 transition-colors">
                                    <i className="fa-solid fa-chevron-right"></i>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}