import { ImageCarousel } from '@/components/common/ImageCarousel'

export function AboutSection() {
    return (
        <section id="about" className="py-24 bg-white dark:bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div>
                        <ImageCarousel />
                    </div>
                    <div className="space-y-6">
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase">About Us</span>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Bridging the Physical and Digital Worlds</h2>
                        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                            We believe that professional connections shouldn't be limited by paper. Our NFC-enabled cards allow you to carry your entire portfolio in your pocket.
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