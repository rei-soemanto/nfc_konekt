import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string
    error?: string[]
}

export function Input({ label, error, className = '', ...props }: InputProps) {
    return (
        <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <input
                className={`border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    error ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${className}`}
                {...props}
            />
            {error && <p className="text-xs text-red-500">{error[0]}</p>}
        </div>
    )
}