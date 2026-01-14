'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navbar() {
    const [activeSection, setActiveSection] = useState('home')
    const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 })
    const [isScrolled, setIsScrolled] = useState(false) // 1. Track scroll state
    
    const itemsRef = useRef<(HTMLAnchorElement | null)[]>([])
    const pathname = usePathname()
    const isHome = pathname === '/'

    const navLinks = [
        { name: 'Home', href: '/#home' },
        { name: 'About', href: '/#about' },
        { name: 'Features', href: '/#features' },
        { name: 'Pricing', href: '/#pricing' },
        { name: 'Contact', href: '/#contact' },
    ]

    useEffect(() => {
        // Combined scroll handler for both ScrollSpy and Navbar Resizing
        const handleScroll = () => {
            // A. Handle Resizing (Scale Effect)
            if (window.scrollY > 20) {
                setIsScrolled(true)
            } else {
                setIsScrolled(false)
            }

            // B. Handle Scroll Spy (Only on Home)
            if (isHome) {
                const sections = navLinks.map(link => link.href.split('#')[1])
                for (const section of sections) {
                    const element = document.getElementById(section)
                    if (element) {
                        const rect = element.getBoundingClientRect()
                        if (rect.top >= -100 && rect.top <= 300) {
                            setActiveSection(section)
                            break
                        }
                    }
                }
            }
        }

        window.addEventListener('scroll', handleScroll)
        // Trigger once on mount
        handleScroll()
        return () => window.removeEventListener('scroll', handleScroll)
    }, [isHome, navLinks]) // Dependencies

    // Slider Position Logic (Updates when active section changes)
    useEffect(() => {
        const activeIndex = navLinks.findIndex(link => link.href.split('#')[1] === activeSection)
        const currentItem = itemsRef.current[activeIndex]

        if (currentItem && isHome) {
            setSliderStyle({
                left: currentItem.offsetLeft,
                width: currentItem.offsetWidth,
                opacity: 1
            })
        } else {
            setSliderStyle(prev => ({ ...prev, opacity: 0 }))
        }
    }, [activeSection, isHome])

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (isHome && href.includes('#')) {
            e.preventDefault()
            const targetId = href.split('#')[1]
            const target = document.getElementById(targetId)
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' })
                setActiveSection(targetId)
            }
        }
    }

    return (
        // 2. Applied Dynamic Classes for "Scale" Effect
        <nav className={`sticky top-0 z-50 w-full backdrop-blur-sm border-b transition-all duration-300 ease-in-out ${
            isScrolled 
                ? 'bg-white/95 dark:bg-gray-950/95 py-4 shadow-sm border-gray-100 dark:border-gray-800'  // Scrolled: Compact & Shadow
                : 'bg-white/80 dark:bg-gray-950/80 py-7 shadow-none border-transparent'                  // Top: Taller (Scaled Up) & No Shadow
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center transition-all duration-300"> 
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-500 transition-all duration-300">
                            NFC Konekt
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-2 relative">
                        {navLinks.map((link, index) => {
                            const isActive = isHome && activeSection === link.href.split('#')[1]
                            
                            return (
                                <Link 
                                    key={link.name} 
                                    href={link.href}
                                    ref={(el) => { itemsRef.current[index] = el }} 
                                    onClick={(e) => handleNavClick(e, link.href)}
                                    className={`relative px-4 py-2 rounded-sm transition-all duration-300 ${
                                        isActive 
                                            ? 'bg-blue-50 dark:bg-gray-800' 
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <span className={`font-medium transition-colors duration-300 ${
                                        isActive 
                                            ? 'text-blue-600 dark:text-blue-400' 
                                            : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                                    }`}>
                                        {link.name}
                                    </span>
                                </Link>
                            )
                        })}
                        
                        {/* Sliding Underline */}
                        <span 
                            className="absolute bottom-0 h-1 bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-out rounded-full"
                            style={{ 
                                left: `${sliderStyle.left}px`, 
                                width: `${sliderStyle.width}px`, 
                                opacity: sliderStyle.opacity 
                            }} 
                        />

                        <div className="pl-4">
                            <Link 
                                href="/auth" 
                                className={`font-medium rounded-full hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-md shadow-blue-200 dark:shadow-none hover:shadow-lg ${
                                    isScrolled 
                                        ? 'px-6 py-2.5 bg-blue-600 text-white text-sm'  // Compact Button
                                        : 'px-8 py-3 bg-blue-600 text-white text-base'   // Larger Button at Top
                                }`}
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}