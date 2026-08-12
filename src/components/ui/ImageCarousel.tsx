'use client'
import { useState } from 'react'
import Image from 'next/image'

export type CarouselSlide = {
    src: string
    alt: string
}

type Props = {
    slides: CarouselSlide[]
    /**
     * Matches the rendered width so Next serves a correctly sized image.
     * Default assumes a half-width column inside a max-w-7xl container.
     */
    sizes?: string
}

export function ImageCarousel({
    slides,
    sizes = '(min-width: 1280px) 608px, (min-width: 768px) 50vw, 100vw',
}: Props) {
    const [currentIndex, setCurrentIndex] = useState(0)

    if (slides.length === 0) return null

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length)
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)

    return (
        <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group">
            {/* All slides stay mounted and cross-fade. Swapping a single <Image>
                src instead would refetch on every change and flash on first view. */}
            {slides.map((slide, idx) => (
                <div
                    key={slide.src}
                    aria-hidden={idx !== currentIndex}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                        idx === currentIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    <Image
                        src={slide.src}
                        alt={slide.alt}
                        fill
                        sizes={sizes}
                        className="object-cover"
                    />
                </div>
            ))}

            {/* Controls — hidden until hover on pointer devices, but always
                present for keyboard and screen-reader users. */}
            {slides.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={prevSlide}
                        aria-label="Previous image"
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-full shadow hover:bg-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                    >
                        ←
                    </button>
                    <button
                        type="button"
                        onClick={nextSlide}
                        aria-label="Next image"
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-full shadow hover:bg-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                    >
                        →
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                        {slides.map((slide, idx) => (
                            <button
                                key={slide.src}
                                type="button"
                                onClick={() => setCurrentIndex(idx)}
                                aria-label={`Go to image ${idx + 1} of ${slides.length}`}
                                aria-current={idx === currentIndex}
                                className={`h-2 rounded-full transition-all ${
                                    idx === currentIndex ? 'bg-indigo-600 w-4' : 'bg-white/60 w-2'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
