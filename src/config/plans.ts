import { PlanCategory, PlanDuration } from '@prisma/client'

export const EXPANSION_PACK_SIZE = 10; 

export const PLAN_CONFIG = {
    [PlanCategory.PERSONAL]: {
        label: "Personal",
        color: "indigo",
        baseUsers: 1, 
        cardsPerUser: 2,
        features: [
            "Single User Account",
            "2 Digital Cards / NFC Links",
            "Basic Analytics",
            "Contact Management"
        ]
    },
    // FIXED: Strictly use CORPORATE to match Schema
    [PlanCategory.CORPORATE]: {
        label: "Corporate",
        color: "amber",
        baseUsers: 10,
        cardsPerUser: 2,
        features: [
            "10 Base Team Profiles (Inherited)",
            "2 Cards per Team Member",
            "Corporate Admin Dashboard",
            "NFC Writer Tool Access",
            "Expandable Team Capacity"
        ]
    }
};

export const DURATION_CONFIG: Record<string, { label: string, days: number, months: number }> = {
    'MONTHLY': { label: "Monthly", days: 30, months: 1 },
    'SIX_MONTHS': { label: "6 Months", days: 180, months: 6 },
    'YEARLY': { label: "Yearly", days: 365, months: 12 },
};

export function getPlanName(category: PlanCategory, duration: PlanDuration) {
    const durLabel = DURATION_CONFIG[duration]?.label || duration;
    return `${PLAN_CONFIG[category].label} - ${durLabel}`;
}