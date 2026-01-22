import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export class AuthService {
    // 1. Login Logic
    static async validateUser(email: string, passwordInput: string) {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(passwordInput, user.password);
        if (!isValid) return null;

        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // 2. Registration Logic
    static async registerUser(data: { fullName: string, email: string, password: string, companyName?: string }) {
        // 1. Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            throw new Error("User already exists");
        }

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 3. Generate Card Slug (Same logic as your auth.ts)
        const slug = data.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

        // 4. Create User & Default Card
        const newUser = await prisma.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                password: hashedPassword,
                companyName: data.companyName || null,
                role: 'USER',
                cards: {
                    create: {
                        slug: slug,
                        status: 'ACTIVE'
                    }
                }
            }
        });

        // 5. Return user without password
        const { password, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }

    static async changePassword(userId: string, oldPass: string, newPass: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        // 1. Verify Old Password
        const isValid = await bcrypt.compare(oldPass, user.password);
        if (!isValid) throw new Error("Incorrect current password");

        // 2. Hash New Password
        const hashed = await bcrypt.hash(newPass, 10);

        // 3. Update
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashed }
        });

        return true;
    }

    static async deleteAccount(userId: string) {
        // Option 1: Hard Delete (Removes everything)
        return await prisma.user.delete({
            where: { id: userId }
        });

        // Option 2: Soft Delete (if you prefer)
        // return await prisma.user.update({
        //     where: { id: userId },
        //     data: { accountStatus: 'LOCKED', email: `deleted-${userId}@deleted.com` }
        // });
    }
}