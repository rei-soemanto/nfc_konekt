'use server'

import { PromoService } from '@/services/PromoService'

export async function verifyPromoCode(code: string, planCategory: string, currentPrice: number) {
    try {
        // 1. Call the logic encapsulated in your Service Object
        const result = await PromoService.validate(code, planCategory, currentPrice);

        // 2. Return a clean response to the client
        if (!result.valid) {
            return { 
                success: false, 
                message: result.error || "Invalid promo code" 
            };
        }

        return { 
            success: true, 
            discountAmount: result.discount, 
            promoId: result.promoId 
        };

    } catch (error) {
        console.error("Promo Action Error:", error);
        return { success: false, message: "Server error validating code" };
    }
}