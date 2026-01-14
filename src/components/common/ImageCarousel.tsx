'use client'
import { useState } from 'react'

export function ImageCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0)
    
    // Placeholder logic: Just using colored divs to simulate images
    const slides = [
        "bg-gray-200", 
        "bg-gray-300", 
        "bg-gray-400"
    ]

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length)
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)

    return (
        <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden bg-gray-100 group">
            {/* The Image Placeholder */}
            <div className={`w-full h-full transition-colors duration-500 ${slides[currentIndex]} flex items-center justify-center`}>
                <span className="text-gray-500 font-medium">Image Placeholder {currentIndex + 1}</span>
            </div>

            {/* Controls */}
            <button 
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
                ←
            </button>
            <button 
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
                →
            </button>
            
            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                            idx === currentIndex ? 'bg-blue-600 w-4' : 'bg-white/60'
                        }`}
                    />
                ))}
            </div>
        </div>
    )
}