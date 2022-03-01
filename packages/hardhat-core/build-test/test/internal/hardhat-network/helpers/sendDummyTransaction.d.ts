import { EthereumProvider } from "../../../../types";
interface Options {
    from?: string;
    to?: string;
    accessList?: any[];
    gas?: number;
}
export declare function sendDummyTransaction(provider: EthereumProvider, nonce: number, { from, to, accessList, gas, }?: Options): Promise<any>;
export {};
//# sourceMappingURL=sendDummyTransaction.d.ts.map