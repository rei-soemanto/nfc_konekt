import { prisma } from '@/lib/prisma'
import HistoryTable from '@/components/ui/pages/dashboard/HistoryTable'
import { redirect } from 'next/navigation'

// --- HELPER: Replace with actual Auth logic ---
async function getAuthUserId() {
    const user = await prisma.user.findFirst();
    return user?.id;
}

// Helper to format dates nicely (e.g., "2 hours ago")
function timeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

export default async function HistoryPage() {
    const userId = await getAuthUserId();

    if (!userId) {
        redirect('/auth');
    }

    // 1. Fetch "Scans Made" (I scanned someone else)
    const scansMadeRaw = await prisma.scan.findMany({
        where: { scannerId: userId },
        include: {
            card: {
                include: {
                    user: true // Get the profile of the person who owns the card I scanned
                }
            }
        },
        orderBy: { scannedAt: 'desc' }
    });

    // 2. Fetch "Scans Received" (Someone scanned one of my cards)
    const scansReceivedRaw = await prisma.scan.findMany({
        where: {
            card: {
                userId: userId // The card belongs to me
            }
        },
        include: {
            scanner: true // Get the profile of the person who scanned me
        },
        orderBy: { scannedAt: 'desc' }
    });

    // 3. Normalize Data for the View
    // We explicitly define the type to match HistoryTable's expectation
    type HistoryItem = {
        id: string;
        name: string;
        role: string;
        date: string;
        avatar: string;
        isFriend: boolean;
        type: 'scanned_by_me' | 'scanned_me';
    };

    const historyData: HistoryItem[] = [
        // Map "Scans Made"
        ...scansMadeRaw.map(scan => ({
            id: scan.id,
            name: scan.card.user.fullName,
            role: "User", // You can map scan.card.user.role here if you want
            date: timeAgo(scan.scannedAt),
            avatar: scan.card.user.fullName.charAt(0).toUpperCase(), // Fallback avatar
            isFriend: false, // TODO: Implement Friend Logic when Friend model exists
            type: 'scanned_by_me' as const
        })),

        // Map "Scans Received"
        ...scansReceivedRaw.map(scan => ({
            id: scan.id,
            name: scan.scanner.fullName,
            role: "User",
            date: timeAgo(scan.scannedAt),
            avatar: scan.scanner.fullName.charAt(0).toUpperCase(),
            isFriend: false,
            type: 'scanned_me' as const
        }))
    ];

    // Optional: Re-sort combined list by date just in case
    // historyData.sort(...) 

    return <HistoryTable data={historyData} />
}