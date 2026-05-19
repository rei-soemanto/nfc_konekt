import { HeroSection } from '@/features/home/HeroSection'
import { AboutSection } from '@/features/home/AboutSection'
import { FeaturesSection } from '@/features/home/FeaturesSection'
import { PricingSection } from '@/features/home/PricingSection'

export default function Home() {
    return (
        <>
            <HeroSection />
            <AboutSection />
            <FeaturesSection />
            <PricingSection />
        </>
    )
}
