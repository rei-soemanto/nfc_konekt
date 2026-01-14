import { Navbar } from '@/components/ui/layout/Navbar'
import { Footer } from '@/components/ui/layout/Footer'
import { HeroSection } from '@/components/ui/pages/home/HeroSection'
import { AboutSection } from '@/components/ui/pages/home/AboutSection'
import { FeaturesSection } from '@/components/ui/pages/home/FeaturesSection'
import { PricingSection } from '@/components/ui/pages/home/PricingSection'

export default function Home() {
    return (
        // Added dark:bg-gray-950 to support dark mode
        <main className="min-h-screen bg-white dark:bg-gray-950">
            <Navbar />
            
            <HeroSection />
            <AboutSection />
            <FeaturesSection />
            <PricingSection />
            
            <Footer />
        </main>
    )
}