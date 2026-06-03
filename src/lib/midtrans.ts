import midtransClient from "midtrans-client";

if (!process.env.MIDTRANS_SERVER_KEY) {
    throw new Error("MIDTRANS_SERVER_KEY is not set");
}

export const coreApi = new midtransClient.CoreApi({
    isProduction: true, // production
    serverKey: process.env.MIDTRANS_SERVER_KEY,
});

export const snap = new midtransClient.Snap({
    isProduction: true,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
});
