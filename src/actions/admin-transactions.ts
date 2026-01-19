'use server'

import { prisma } from '@/lib/prisma'
import { getAdminData } from '@/actions/admin' 
import { revalidatePath } from 'next/cache'

export async function updateShipmentStatus(transactionId: string, status: string) {
    await getAdminData();
    await prisma.transaction.update({ // <-- Change to Transaction
        where: { id: transactionId },
        data: { shipmentStatus: status }
    });
    revalidatePath('/dashboard/admin/transactions');
    return { success: true };
}

export async function updateTrackingLink(transactionId: string, link: string) {
    await getAdminData();
    await prisma.transaction.update({ // <-- Change to Transaction
        where: { id: transactionId },
        data: { trackingLink: link }
    });
    revalidatePath('/dashboard/admin/transactions');
}

export async function markTransactionAsRead(transactionId: string) {
    await getAdminData();
    await prisma.transaction.update({ // <-- Change to Transaction
        where: { id: transactionId },
        data: { isNew: false }
    });
    revalidatePath('/dashboard/admin/transactions');
}