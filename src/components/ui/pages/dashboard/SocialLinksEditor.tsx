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

    // Notify parent component whenever links change
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
                <label className="text-sm font-medium text-gray-700">Social Profiles</label>
                <button
                    type="button"
                    onClick={addLink}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    + Add New
                </button>
            </div>

            {links.map((link, index) => (
                <div key={index} className="flex gap-2 items-start">
                    <div className="w-1/3">
                        <select
                            className="w-full border rounded-lg px-3 py-2 border-gray-300 bg-white"
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
                    </div>
                    <div className="flex-1">
                        <Input
                            label="" /* Hidden label for layout */
                            placeholder="https://..."
                            value={link.url}
                            onChange={(e) => updateLink(index, 'url', e.target.value)}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="text-red-500 hover:text-red-700 px-2 py-2"
                        title="Remove"
                    >
                        ✕
                    </button>
                </div>
            ))}
            
            {links.length === 0 && (
                <p className="text-sm text-gray-400 italic">No social links added yet.</p>
            )}
        </div>
    )
}