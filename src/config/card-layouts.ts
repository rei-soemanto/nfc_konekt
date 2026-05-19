// src/lib/card-layouts.ts

export type ElementStyle = {
    top: string
    left?: string
    right?: string
    width?: string
    textAlign: 'left' | 'center' | 'right'
    color: string
    fontSize?: string
    fontWeight?: string
    textTransform?: 'uppercase' | 'capitalize' | 'none'
    textShadow?: string // For glowing effects
}

export type CardLayout = {
    id: string
    logo: { top: string, left: string, width: string, height: string }
    companyName: ElementStyle
    fullName: ElementStyle
    detailsBlock: ElementStyle // Job, Email, Phone container
    bottomBlock: ElementStyle // Scope, Specialty, Address container
}

export const DEFAULT_LAYOUT: CardLayout = {
    id: 'default',
    logo: { top: '10%', left: '8%', width: '15%', height: '15%' },
    companyName: { top: '11%', left: '26%', textAlign: 'left', color: '#1e3a8a', fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase' },
    fullName: { top: '35%', left: '26%', textAlign: 'left', color: '#000000', fontSize: '2rem', fontWeight: '800', textTransform: 'uppercase' },
    detailsBlock: { top: '48%', left: '26%', textAlign: 'left', color: '#000000', fontSize: '0.9rem' },
    bottomBlock: { top: '75%', right: '5%', textAlign: 'right', color: '#000000', fontSize: '0.8rem', width: '90%' }
}

export const CARD_LAYOUTS: Record<string, CardLayout> = {
    // 1. THE "PEARL WHITE" LAYOUT (Based on your white image)
    'Minimalist Blue & White': {
        id: 'pearl-white',
        logo: { top: '8%', left: '8%', width: '16%', height: '16%' }, // Top left box
        companyName: { 
            top: '12%', left: '28%', textAlign: 'left', 
            color: '#0f172a', fontSize: '1.4rem', fontWeight: 'bold', textTransform: 'uppercase',
            width: '65%'
        },
        fullName: { 
            top: '32%', left: '28%', textAlign: 'left', 
            color: '#000000', fontSize: '2.2rem', fontWeight: '900', textTransform: 'uppercase',
            width: '65%'
        },
        detailsBlock: { 
            top: '46%', left: '28%', textAlign: 'left', 
            color: '#334155', fontSize: '0.95rem',
            width: '65%'
        },
        bottomBlock: { 
            top: '72%', right: '5%', textAlign: 'right', 
            color: '#000000', fontSize: '0.8rem', width: '90%' 
        }
    },

    // 2. THE "CYBER / MATTE BLACK" LAYOUT (Based on your dark image)
    'Modern Tech Circuit': {
        id: 'matte-black',
        logo: { top: '12%', left: '10%', width: '18%', height: '18%' },
        companyName: { 
            top: '18%', left: '0', width: '100%', textAlign: 'center', 
            color: '#FFFFFF', fontSize: '1.6rem', fontWeight: 'bold', textTransform: 'uppercase',
            textShadow: '0 0 10px rgba(255,255,255,0.5)' 
        },
        fullName: { 
            top: '38%', left: '0', width: '100%', textAlign: 'center', 
            color: '#E0F2FE', fontSize: '2.5rem', fontWeight: '900', textTransform: 'uppercase',
            textShadow: '0 0 15px #0ea5e9' // Blue Glow
        },
        detailsBlock: { 
            top: '52%', left: '0', width: '100%', textAlign: 'center', 
            color: '#FFFFFF', fontSize: '1rem', fontWeight: '500' 
        },
        bottomBlock: { 
            top: '82%', left: '0', width: '100%', textAlign: 'center', 
            color: '#E0F2FE', fontSize: '0.85rem' 
        }
    },
    
    // Add other IDs from your lib/designs.ts file and map them to one of these styles
    'slate-gray': DEFAULT_LAYOUT, 
    'concrete': DEFAULT_LAYOUT,
    // ... map others
}