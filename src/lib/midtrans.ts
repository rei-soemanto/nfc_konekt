import midtransClient from 'midtrans-client';

export const midtransSnap = new midtransClient.Snap({
    isProduction: false, // sandbox
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
});

export const midtransCore = new midtransClient.CoreApi({
    isProduction: false, // sandbox
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
});
