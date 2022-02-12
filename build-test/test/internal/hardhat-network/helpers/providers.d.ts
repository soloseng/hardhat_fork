import { BN } from "ethereumjs-util";
import { HardhatNetworkMempoolConfig, HardhatNetworkMiningConfig } from "../../../../src/types";
import { UseProviderOptions } from "./useProvider";
export declare const DEFAULT_HARDFORK = "london";
export declare const DEFAULT_NETWORK_NAME = "TestNet";
export declare const DEFAULT_CHAIN_ID = 123;
export declare const DEFAULT_NETWORK_ID = 234;
export declare const DEFAULT_BLOCK_GAS_LIMIT = 6000000;
export declare const DEFAULT_USE_JSON_RPC = false;
export declare const DEFAULT_ALLOW_UNLIMITED_CONTRACT_SIZE = false;
export declare const DEFAULT_MEMPOOL_CONFIG: HardhatNetworkMempoolConfig;
export declare const DEFAULT_MINING_CONFIG: HardhatNetworkMiningConfig;
export declare const DEFAULT_ACCOUNTS: {
    privateKey: string;
    balance: BN;
}[];
export declare const DEFAULT_ACCOUNTS_ADDRESSES: string[];
export declare const DEFAULT_ACCOUNTS_BALANCES: BN[];
export declare const PROVIDERS: {
    name: string;
    isFork: boolean;
    isJsonRpc: boolean;
    networkId: number;
    chainId: number;
    useProvider: (options?: UseProviderOptions) => void;
}[];
export declare const INTERVAL_MINING_PROVIDERS: {
    name: string;
    isFork: boolean;
    isJsonRpc: boolean;
    useProvider: (options?: UseProviderOptions) => void;
}[];
export declare const FORKED_PROVIDERS: Array<{
    rpcProvider: string;
    jsonRpcUrl: string;
    useProvider: (options?: UseProviderOptions) => void;
}>;
//# sourceMappingURL=providers.d.ts.map