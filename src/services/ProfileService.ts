import { prisma } from '@/lib/prisma'

/**
 * Every User column EXCEPT `password`.
 *
 * Using an explicit allowlist rather than `include` means a future column
 * added to the schema is opt-in here, so a new secret can never start
 * flowing to the client just because someone edited schema.prisma.
 */
export const SAFE_USER_FIELDS = {
    id: true,
    fullName: true,
    email: true,
    phone: true,
    companyName: true,
    companyWebsite: true,
    avatarUrl: true,
    bio: true,
    role: true,
    accountStatus: true,
    emailVerified: true,
    parentId: true,
    companyScope: true,
    companySpeciality: true,
    companyDescription: true,
    companyLogoUrl: true,
    jobTitle: true,
    isCompanyPublic: true,
    tempSetupData: true,
    tempDesignData: true,
    createdAt: true,
    updatedAt: true,
} as const

export class ProfileService {
    /**
     * 1. GET FULL PROFILE (For the Edit Screen)
     */
    static async getFullProfile(userId: string) {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: {
                ...SAFE_USER_FIELDS,
                address: true,
                subscription: { include: { plan: true } },
                socialLinks: true
            }
        });
    }

    /**
     * 2. UPDATE PERSONAL INFO (Name, Bio, Job, Socials)
     */
    static async updatePersonal(userId: string, data: any) {
        return await prisma.user.update({
            where: { id: userId },
            select: SAFE_USER_FIELDS,
            data: {
                // By using the spread operator, we only attempt to update fields 
                // that were actually sent in the payload and aren't explicitly null
                ...(data.fullName != null && { fullName: data.fullName }),
                ...(data.phone != null && { phone: data.phone }),
                ...(data.bio != null && { bio: data.bio }),
                ...(data.jobTitle != null && { jobTitle: data.jobTitle }),
                ...(data.companyWebsite != null && { companyWebsite: data.companyWebsite }),
                ...(data.avatarUrl != null && { avatarUrl: data.avatarUrl }),
                
                // Clear old and add new
                ...(data.socialLinks && {
                    socialLinks: {
                        deleteMany: {}, 
                        create: data.socialLinks 
                    }
                })
            }
        });
    }

    /**
     * 3. UPDATE SHIPPING ADDRESS
     */
    static async updateAddress(userId: string, data: any) {
        return await prisma.address.upsert({
            where: { userId: userId },
            update: {
                ...(data.street != null && { street: data.street }),
                ...(data.city != null && { city: data.city }),
                ...(data.region != null && { region: data.region }),
                ...(data.country != null && { country: data.country }),
                ...(data.postalCode != null && { postalCode: data.postalCode })
            },
            create: {
                userId: userId,
                // Fallbacks to empty string if creating for the first time and data is missing
                street: data.street || "",
                city: data.city || "",
                region: data.region || "",
                country: data.country || "",
                postalCode: data.postalCode || ""
            }
        });
    }

    /**
     * 4. UPDATE CORPORATE SETTINGS
     * (Only for Corporate Admins)
     */
    static async updateCorporate(userId: string, data: any) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                subscription: { select: { plan: { select: { category: true } } } }
            }
        });

        const isCorporate = user?.role === 'ADMIN' || user?.subscription?.plan.category === 'CORPORATE';
        
        if (!isCorporate) {
            throw new Error("Unauthorized: Corporate Plan required");
        }

        return await prisma.user.update({
            where: { id: userId },
            select: SAFE_USER_FIELDS,
            data: {
                ...(data.companyName != null && { companyName: data.companyName }),
                ...(data.companyWebsite != null && { companyWebsite: data.companyWebsite }),
                ...(data.companyDescription != null && { companyDescription: data.companyDescription }),
                ...(data.companyScope != null && { companyScope: data.companyScope }),
                ...(data.companySpeciality != null && { companySpeciality: data.companySpeciality }),
                ...(data.isCompanyPublic != null && { isCompanyPublic: data.isCompanyPublic })
            }
        });
    }
}