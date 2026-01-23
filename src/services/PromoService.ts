import { prisma } from '@/lib/prisma'
import { DiscountType, PromoCode, Prisma } from '@prisma/client' // 1. Import Prisma namespace

export class PromoService {
    // 1. Create Object
    static async create(data: Omit<PromoCode, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) {
        return await prisma.promoCode.create({
            data: {
                ...data,
                // 2. FIX: Cast the JSON field explicitly to InputJsonValue
                applicablePlans: data.applicablePlans as Prisma.InputJsonValue,
                code: data.code.toUpperCase().trim()
            }
        });
    }

    // 2. Fetch All Objects
    static async getAll() {
        return await prisma.promoCode.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    // 3. Encapsulated Toggle Logic
    static async toggleStatus(id: string, isActive: boolean) {
        return await prisma.promoCode.update({
            where: { id },
            data: { isActive }
        });
    }

    // 4. Validation Logic (The "Brain")
    static async validate(code: string, planCategory: string, price: number) {
        const promo = await prisma.promoCode.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!promo || !promo.isActive) return { valid: false, error: "Invalid or inactive code" };
        
        // Date Check
        const now = new Date();
        if (now < promo.startDate || now > promo.endDate) return { valid: false, error: "Promo expired" };

        // Plan Check
        // We cast this to string[] because we know that's how we save it
        const plans = promo.applicablePlans as unknown as string[];
        
        if (!plans.includes(planCategory) && !plans.includes('ALL')) {
            return { valid: false, error: "Not applicable for this plan" };
        }

        // Calculate
        const discount = promo.type === 'PERCENTAGE' 
            ? (price * promo.value) / 100 
            : promo.value;

        return { 
            valid: true, 
            discount: Math.min(discount, price), // Prevent negative total
            promoId: promo.id 
        };
    }
}