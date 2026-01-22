import jwt from 'jsonwebtoken'

// Fix: Force the type to string, or throw an error if missing
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET_KEY) {
    throw new Error('JWT_SECRET_KEY is not defined in environment variables');
}

export type JwtPayload = {
    userId: string
    iat?: number
    exp?: number
}

// 1. Verify Token (Used in auth.ts)
export async function verifyToken(token: string): Promise<JwtPayload | null> {
    try {
        // jwt.verify is synchronous, but we wrap it in a Promise/async 
        // to match your await call in auth.ts
        const decoded = jwt.verify(token, JWT_SECRET_KEY as string) as JwtPayload;
        return decoded;
    } catch (error) {
        console.error("JWT Verification failed:", error);
        return null;
    }
}

// 2. Sign Token (You will need this for your Login API /api/auth/login)
export function signToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET_KEY as string, { expiresIn: '7d' }); // Token valid for 7 days
}