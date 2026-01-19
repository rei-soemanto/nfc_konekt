'use server'

import { prisma } from '@/lib/prisma'
import { getAdminData } from '@/actions/admin' 
import { revalidatePath } from 'next/cache'
import { PlanCategory, PlanDuration } from '@prisma/client'
import { getPlanName } from '@/lib/plans'

// INTERNAL HELPER: Creates plans if missing (No Revalidate)
// Safe to call inside a Page Component
export async function seedPlans() {
    await getAdminData(); 

    const categories = [PlanCategory.PERSONAL, PlanCategory.CORPORATE];
    const durations = Object.values(PlanDuration);

    for (const cat of categories) {
        for (const dur of durations) {
            const exists = await prisma.plan.findFirst({
                where: { category: cat, duration: dur }
            });

            if (!exists) {
                console.log(`Creating missing plan: ${cat} - ${dur}`);
                await prisma.plan.create({
                    data: {
                        category: cat,
                        duration: dur,
                        name: getPlanName(cat, dur),
                        price: 0,
                        expansionPrice: 0 
                    }
                });
            }
        }
    }
}

// SERVER ACTION: Calls seedPlans AND Revalidates
// Use this for Buttons/Forms only
export async function initializePlans() {
    await seedPlans();
    revalidatePath('/dashboard/admin/plans');
}

export async function updatePlanPrice(planId: string, newPrice: number) {
    await getAdminData();
    if (newPrice < 0) throw new Error("Price cannot be negative");

    await prisma.plan.update({
        where: { id: planId },
        data: { price: newPrice }
    });

    revalidatePath('/dashboard/admin/plans');
}

export async function updateExpansionPrice(newMonthlyPrice: number) {
    await getAdminData();
    if (newMonthlyPrice < 0) throw new Error("Price cannot be negative");

    await prisma.plan.updateMany({
        where: { category: 'CORPORATE' },
        data: { expansionPrice: newMonthlyPrice }
    });

    revalidatePath('/dashboard/admin/plans');
}