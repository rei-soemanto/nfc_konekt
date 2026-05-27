import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Error — NFC Konekt',
}

export default function ErrorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <main>
            {children}
        </main>
    )
}
