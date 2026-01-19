import midtransClient from "midtrans-client";

if (!process.env.MIDTRANS_SERVER_KEY) {
    throw new Error("MIDTRANS_SERVER_KEY is not set");
}

export const coreApi = new midtransClient.CoreApi({
    isProduction: false, // sandbox
    serverKey: process.env.MIDTRANS_SERVER_KEY,
});

export const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
});
