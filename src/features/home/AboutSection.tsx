import { ImageCarousel, type CarouselSlide } from '@/components/ui/ImageCarousel'

const ABOUT_SLIDES: CarouselSlide[] = [
    {
        src: '/about-1.png',
        alt: 'A freelancer, a startup founder and a corporate executive each holding an NFC Konekt card, showing the platform scales across company sizes',
    },
    {
        src: '/about-2.png',
        alt: 'An NFC Konekt card being tapped against a phone, with the digital profile appearing on screen',
    },
    {
        src: '/about-3.png',
        alt: 'A pile of ordinary paper business cards beside a single NFC Konekt card and a phone displaying a full digital profile',
    },
]

export function AboutSection() {
    return (
        <section id="about" className="py-24 bg-white dark:bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div>
                        <ImageCarousel slides={ABOUT_SLIDES} />
                    </div>
                    <div className="space-y-6">
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase">About Us</span>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Bridging the Physical and Digital Worlds</h2>
                        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                            We believe that professional connections shouldn&apos;t be limited by paper. Our NFC-enabled cards allow you to carry your entire portfolio in your pocket.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                            Whether you are a freelancer, a startup founder, or a large enterprise, our platform scales to meet your networking needs.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}