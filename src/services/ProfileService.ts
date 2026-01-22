import { prisma } from '@/lib/prisma'

export class ProfileService {
    /**
     * 1. GET FULL PROFILE (For the Edit Screen)
     */
    static async getFullProfile(userId: string) {
        return await prisma.user.findUnique({
            where: { id: userId },
            include: {
                address: true,
                // Include subscription to check if they are allowed to edit Corporate info
                subscription: { include: { plan: true } }
            }
        });
    }

    /**
     * 2. UPDATE PERSONAL INFO (Name, Bio, Job, Socials)
     */
    static async updatePersonal(userId: string, data: any) {
        return await prisma.user.update({
            where: { id: userId },
            data: {
                fullName: data.fullName,
                phone: data.phone,
                bio: data.bio,
                jobTitle: data.jobTitle,
                // Handle Social Links if you send them as an array, 
                // or handle them in a separate method depending on your UI
                socialLinks: data.socialLinks ? {
                    deleteMany: {}, // Clear old
                    create: data.socialLinks // Add new
                } : undefined
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
                street: data.street,
                city: data.city,
                region: data.region,
                country: data.country,
                postalCode: data.postalCode
            },
            create: {
                userId: userId,
                street: data.street,
                city: data.city,
                region: data.region,
                country: data.country,
                postalCode: data.postalCode
            }
        });
    }

    /**
     * 4. UPDATE CORPORATE SETTINGS
     * (Only for Corporate Admins)
     */
    static async updateCorporate(userId: string, data: any) {
        // Verify User is Corporate Admin
        const user = await prisma.user.findUnique({ 
            where: { id: userId },
            include: { subscription: { include: { plan: true } } }
        });

        const isCorporate = user?.role === 'ADMIN' || user?.subscription?.plan.category === 'CORPORATE';
        
        if (!isCorporate) {
            throw new Error("Unauthorized: Corporate Plan required");
        }

        // Update Company Details
        // This updates the Admin's record, which child employees inherit 'companyName' from usually,
        // or you might want to push updates to children (optional complexity)
        return await prisma.user.update({
            where: { id: userId },
            data: {
                companyName: data.companyName,
                companyWebsite: data.companyWebsite,
                companyDescription: data.companyDescription,
                companyScope: data.companyScope,
                companySpeciality: data.companySpeciality,
                isCompanyPublic: data.isCompanyPublic
            }
        });
    }
}