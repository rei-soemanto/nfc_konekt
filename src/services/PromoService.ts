import { prisma } from '@/lib/prisma'

type PriceBreakdown = {
    planId: string
    planCategory: string
    basePrice: number
    expansionPrice: number
}

export class PromoService {
    // 1. Create Object
    static async create(data: any) {
        return await prisma.promoCode.create({
            data: {
                ...data,
                applicablePlans: data.applicablePlans, // Assumes InputJsonValue is handled
                code: data.code.toUpperCase().trim()
            }
        });
    }

    // 2. Fetch All
    static async getAll() {
        return await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
    }

    // 3. Toggle
    static async toggleStatus(id: string, isActive: boolean) {
        return await prisma.promoCode.update({ where: { id }, data: { isActive } });
    }

    // 4. SMART CALCULATION LOGIC
    static async calculateDiscount(code: string, breakdown: PriceBreakdown) {
        const promo = await prisma.promoCode.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!promo || !promo.isActive) return { valid: false, error: "Invalid or inactive code" };

        // Date Check
        const now = new Date();
        if (now < promo.startDate || now > promo.endDate) return { valid: false, error: "Promo expired" };

        const applicablePlans = promo.applicablePlans as string[]; // e.g. ['CORPORATE', 'EXPANSION']
        const appliesToAll = applicablePlans.includes('ALL');

        // --- CALCULATE ELIGIBLE AMOUNT ---
        let eligibleAmount = 0;

        // A. Base Plan Eligibility
        if (appliesToAll || applicablePlans.includes(breakdown.planCategory)) {
            eligibleAmount += breakdown.basePrice;
        }

        // B. Expansion Eligibility
        if (appliesToAll || applicablePlans.includes('EXPANSION')) {
            eligibleAmount += breakdown.expansionPrice;
        }

        if (eligibleAmount === 0) {
            return { valid: false, error: "Promo not applicable to these items" };
        }

        // --- APPLY DISCOUNT ---
        let discountValue = 0;
        if (promo.type === 'PERCENTAGE') {
            discountValue = (eligibleAmount * promo.value) / 100;
        } else {
            // Fixed amount: cannot exceed the eligible amount
            discountValue = Math.min(promo.value, eligibleAmount);
        }

        return {
            valid: true,
            discount: discountValue, // The actual money saved
            promoId: promo.id,
            appliedTo: eligibleAmount
        };
    }
}