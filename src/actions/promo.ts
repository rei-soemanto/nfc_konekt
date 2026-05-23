'use server'

import { PromoService } from '@/services/PromoService'
import { prisma } from '@/lib/prisma'
import { DURATION_CONFIG } from '@/config/plans'
import { PlanDuration } from '@prisma/client'
import { getAuthUserId } from '@/lib/auth'

export async function verifyPromoCode(code: string, planId: string, expansionPacks: number, mode: 'NEW' | 'EXPANSION') {
    // SECURITY FIX (VULN-008): Require authentication to prevent promo code enumeration
    const userId = await getAuthUserId();
    if (!userId) return { success: false, message: "Unauthorized" };

    try {
        // 1. Fetch Plan Data Server-Side (Secure)
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) return { success: false, message: "Invalid Plan" };

        // 2. Calculate Costs Internally
        const durationInfo = DURATION_CONFIG[plan.duration as PlanDuration];
        const monthMultiplier = durationInfo?.months || 1;
        
        // Cost Components
        const basePrice = mode === 'EXPANSION' ? 0 : plan.price;
        const expansionPrice = (plan.expansionPrice * monthMultiplier) * expansionPacks;

        // 3. Call Service
        const result = await PromoService.calculateDiscount(code, {
            planId: plan.id,
            planCategory: plan.category, // 'PERSONAL' or 'CORPORATE'
            basePrice,
            expansionPrice
        });

        if (!result.valid) {
            return { success: false, message: result.error };
        }

        return { 
            success: true, 
            discountAmount: result.discount,
            message: "Code Applied"
        };

    } catch (error) {
        console.error("Promo Verify Error:", error);
        return { success: false, message: "Validation failed" };
    }
}   