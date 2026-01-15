'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/common/Input'

type SocialLink = {
    platform: string
    url: string
}

interface SocialLinksEditorProps {
    initialData?: SocialLink[]
    onChange: (links: SocialLink[]) => void
}

export function SocialLinksEditor({ initialData = [], onChange }: SocialLinksEditorProps) {
    const [links, setLinks] = useState<SocialLink[]>(initialData)

    useEffect(() => {
        onChange(links)
    }, [links, onChange])

    const addLink = () => {
        setLinks([...links, { platform: 'Whatsapp', url: '' }])
    }

    const removeLink = (index: number) => {
        setLinks(links.filter((_, i) => i !== index))
    }

    const updateLink = (index: number, field: keyof SocialLink, value: string) => {
        const newLinks = [...links]
        newLinks[index] = { ...newLinks[index], [field]: value }
        setLinks(newLinks)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900 dark:text-white">Social Profiles</label>
                <button
                    type="button"
                    onClick={addLink}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center transition-colors"
                >
                    <i className="fa-solid fa-plus mr-1"></i> Add New
                </button>
            </div>

            {links.map((link, index) => (
                <div key={index} className="flex gap-3 items-start animate-fade-in-up">
                    <div className="w-1/3">
                        <div className="relative">
                            <i className="fa-solid fa-globe absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10 text-sm"></i>
                            <select
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all"
                                value={link.platform}
                                onChange={(e) => updateLink(index, 'platform', e.target.value)}
                            >
                                <option value="Whatsapp">Whatsapp</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Instagram">Instagram</option>
                                <option value="Github">Github</option>
                                <option value="Twitter">Twitter</option>
                                <option value="Website">Website</option>
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                        </div>
                    </div>
                    <div className="flex-1">
                        <Input
                            name={`social-url-${index}`}
                            label="" 
                            placeholder="https://..."
                            defaultValue={link.url}
                            onChange={(e) => updateLink(index, 'url', e.target.value)}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="mt-1 p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                        title="Remove"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            ))}
            
            {links.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No social links added yet.</p>
                    <button type="button" onClick={addLink} className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Click to add one</button>
                </div>
            )}
        </div>
    )
}