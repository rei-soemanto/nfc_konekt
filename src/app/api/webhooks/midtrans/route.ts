import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

// Helper: Generate a unique friendly slug
function generateSlug(name: string) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const suffix = randomBytes(3).toString('hex'); // Adds 6 random chars
    return `${base}-${suffix}`;
}

async function hashPassword(plain: string) {
    return await bcrypt.hash(plain, 10);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { order_id, transaction_status, status_code, gross_amount, signature_key } = body;

        // 1. Verify Signature
        const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
        const input = `${order_id}${status_code}${gross_amount}${serverKey}`;
        const signature = createHash('sha512').update(input).digest('hex');

        if (signature !== signature_key) return NextResponse.json({ message: "Invalid Signature" }, { status: 403 });

        // 2. Find TRANSACTION (Primary Record)
        const tx = await prisma.transaction.findUnique({
            where: { paymentId: order_id },
            include: { user: true, plan: true }
        });

        if (!tx) return NextResponse.json({ message: "Transaction not found" }, { status: 404 });

        // 3. Handle Success
        if (transaction_status === 'capture' || transaction_status === 'settlement') {
            
            // A. Update Transaction Status
            await prisma.transaction.update({
                where: { id: tx.id },
                data: {
                    status: 'PAID',
                    shipmentStatus: tx.shippingAddress ? 'PROCESSING' : 'ARRIVED' // Ready for shipping
                }
            });

            // B. Update Subscription (The "User Display" State)
            // Logic differs for NEW vs EXPANSION
            if (tx.type === 'NEW') {
                await prisma.subscription.update({
                    where: { userId: tx.userId },
                    data: {
                        status: 'ACTIVE',
                        shipmentStatus: tx.shippingAddress ? 'PROCESSING' : undefined,
                        startDate: new Date(),
                        endDate: calculateEndDate(tx.plan!.duration) 
                    }
                });
            } else if (tx.type === 'EXPANSION') {
                // Increment packs
                await prisma.subscription.update({
                    where: { userId: tx.userId },
                    data: {
                        expansionPacks: { increment: tx.expansionPacks },
                        shipmentStatus: 'PROCESSING', // New cards need shipping
                        shippingAddress: tx.shippingAddress // Update to latest address used
                    }
                });
            }

            // C. Create Users & Cards (from Transaction Manifest)
            if (tx.pendingTeamData) {
                const teamMembers = JSON.parse(tx.pendingTeamData);
                for (const member of teamMembers) {
                    const existing = await prisma.user.findUnique({ where: { email: member.email }});
                    if (!existing) {
                        const newUser = await prisma.user.create({
                            data: {
                                fullName: member.fullName,
                                email: member.email,
                                password: await hashPassword("Member123!"),
                                role: 'USER',
                                accountStatus: 'ACTIVE',
                                parentId: tx.userId, 
                            }
                        });
                        await prisma.card.create({
                            data: {
                                slug: generateSlug(newUser.fullName),
                                status: 'ACTIVE',
                                userId: newUser.id
                            }
                        });
                    }
                }
            }
        }
        else if (transaction_status === 'expire' || transaction_status === 'cancel') {
            await prisma.transaction.update({ where: { id: tx.id }, data: { status: 'EXPIRED' } });
        }

        return NextResponse.json({ status: 'OK' });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

function calculateEndDate(duration: string) {
    const date = new Date();
    if (duration === 'MONTHLY') date.setDate(date.getDate() + 30);
    else if (duration === 'SIX_MONTHS') date.setDate(date.getDate() + 180);
    else if (duration === 'YEARLY') date.setDate(date.getDate() + 365);
    return date;
}