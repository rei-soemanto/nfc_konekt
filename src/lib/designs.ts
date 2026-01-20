export type CardTemplate = {
    id: string
    name: string
    image: string // Path to JPG in public folder
}

export const CARD_TEMPLATES: CardTemplate[] = [
    // 1. Minimalist
    { id: 'matte-black', name: 'Matte Black', image: '/designs/matte-black.jpg' },
    { id: 'pearl-white', name: 'Pearl White', image: '/designs/pearl-white.jpg' },
    { id: 'slate-gray', name: 'Slate Gray', image: '/designs/slate-gray.jpg' },
    { id: 'concrete', name: 'Concrete', image: '/designs/concrete.jpg' },
    { id: 'obsidian', name: 'Obsidian', image: '/designs/obsidian.jpg' },

    // 2. Corporate
    { id: 'classic-blue', name: 'Corporate Blue', image: '/designs/classic-blue.jpg' },
    { id: 'navy-gold', name: 'Navy & Gold', image: '/designs/navy-gold.jpg' },
    { id: 'forest-green', name: 'Forest Green', image: '/designs/forest-green.jpg' },
    { id: 'burgundy', name: 'Executive Red', image: '/designs/burgundy.jpg' },
    { id: 'charcoal', name: 'Charcoal', image: '/designs/charcoal.jpg' },

    // 3. Luxury
    { id: 'gold-leaf', name: 'Gold Leaf', image: '/designs/gold-leaf.jpg' },
    { id: 'rose-gold', name: 'Rose Gold', image: '/designs/rose-gold.jpg' },
    { id: 'silver-haze', name: 'Silver Haze', image: '/designs/silver-haze.jpg' },
    { id: 'bronze', name: 'Deep Bronze', image: '/designs/bronze.jpg' },
    { id: 'platinum', name: 'Platinum', image: '/designs/platinum.jpg' },

    // 4. Vibrant / Tech
    { id: 'ocean-teal', name: 'Ocean Teal', image: '/designs/ocean-teal.jpg' },
    { id: 'royal-purple', name: 'Royal Purple', image: '/designs/royal-purple.jpg' },
    { id: 'cyber-black', name: 'Cyber Black', image: '/designs/cyber-black.jpg' },
    { id: 'electric-violet', name: 'Electric Violet', image: '/designs/electric-violet.jpg' },
    { id: 'carbon-fiber', name: 'Carbon Fiber', image: '/designs/carbon-fiber.jpg' },
];

export function getDesignById(id: string): CardTemplate | undefined {
    return CARD_TEMPLATES.find(t => t.id === id);
}