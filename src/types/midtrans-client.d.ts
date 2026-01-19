declare module "midtrans-client" {
    export class CoreApi {
        constructor(config: {
            isProduction: boolean;
            serverKey: string;
        });

        charge(parameter: any): Promise<any>;

        transaction: {
            notification(payload: any): Promise<any>;
            status(orderId: string): Promise<any>;
        };
    }

    export class Snap {
        constructor(config: {
            isProduction: boolean;
            serverKey: string;
        });

        createTransaction(parameter: any): Promise<{
            token: string;
            redirect_url: string;
        }>;
    }
}
