import { BN } from "ethereumjs-util";
interface SendTxOptions {
    from?: string;
    to?: string;
    gas?: number;
    gasPrice?: number | BN;
    data?: string;
    nonce?: number;
    value?: number;
}
declare module "mocha" {
    interface Context {
        sendTx: (options?: SendTxOptions) => Promise<string>;
        assertLatestBlockTxs: (txs: string[]) => Promise<void>;
        assertPendingTxs: (txs: string[]) => Promise<void>;
        mine: () => Promise<void>;
    }
}
/**
 * @deprecated
 */
export declare function useHelpers(): void;
export {};
//# sourceMappingURL=useHelpers.d.ts.map