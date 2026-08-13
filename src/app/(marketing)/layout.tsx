import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { getAuthUserId } from '@/lib/auth'

export default async function MarketingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Drives the navbar CTA: signed-in visitors get a route back to their
    // dashboard instead of a "Login" button that makes it look like the logo
    // signed them out. Reading the cookie here opts the marketing pages into
    // dynamic rendering, which is the cost of showing the correct state on
    // first paint rather than flashing "Login" and then swapping.
    const isLoggedIn = Boolean(await getAuthUserId())

    return (
        <main className="min-h-screen bg-white dark:bg-gray-950">
            <Navbar isLoggedIn={isLoggedIn} />
            {children}
            <Footer />
        </main>
    )
}
