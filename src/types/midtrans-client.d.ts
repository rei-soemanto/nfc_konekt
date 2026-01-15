declare module 'midtrans-client' {
    export class CoreApi {
        constructor(config: {
            isProduction: boolean;
            serverKey: string;
        });
        charge(parameter: any): Promise<any>;
        // Add other methods as needed
    }

    export class Snap {
        constructor(config: {
            isProduction: boolean;
            serverKey: string;
        });
        createTransaction(parameter: any): Promise<{ token: string; redirect_url: string }>;
    }
}