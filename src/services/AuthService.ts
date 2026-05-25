import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

export class AuthService {
    // 1. Login Logic
    static async validateUser(email: string, passwordInput: string) {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) return null;

        // Check email verification — unverified users cannot log in
        if (!user.emailVerified) return null;

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

        // 4. Create User & Default Card (emailVerified defaults to false)
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

        // 5. Generate verification token
        const token = crypto.randomBytes(32).toString('hex');

        await prisma.verificationToken.create({
            data: {
                token,
                userId: newUser.id,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            }
        });

        // 6. Send verification email
        await sendVerificationEmail(data.email, token);

        // 7. Return user without password
        const { password, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }

    // 3. Verify Email Token
    static async verifyEmail(token: string) {
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!verificationToken) {
            throw new Error("Invalid verification token");
        }

        // Check expiry
        if (verificationToken.expiresAt < new Date()) {
            // Clean up expired token
            await prisma.verificationToken.delete({ where: { id: verificationToken.id } });
            throw new Error("Verification token has expired");
        }

        // Mark email as verified
        await prisma.user.update({
            where: { id: verificationToken.userId },
            data: { emailVerified: true }
        });

        // Delete the used token
        await prisma.verificationToken.delete({ where: { id: verificationToken.id } });

        return true;
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