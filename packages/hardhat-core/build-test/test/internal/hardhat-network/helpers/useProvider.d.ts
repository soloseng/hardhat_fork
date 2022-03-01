import { BN } from "ethereumjs-util";
import { HardhatNetworkChainsConfig } from "../../../../src/types/config";
import { JsonRpcServer } from "../../../../src/internal/hardhat-network/jsonrpc/server";
import { ForkConfig } from "../../../../src/internal/hardhat-network/provider/node-types";
import { HardhatNetworkProvider } from "../../../../src/internal/hardhat-network/provider/provider";
import { EthereumProvider, HardhatNetworkMempoolConfig, HardhatNetworkMiningConfig } from "../../../../src/types";
import { FakeModulesLogger } from "./fakeLogger";
declare module "mocha" {
    interface Context {
        logger: FakeModulesLogger;
        provider: EthereumProvider;
        hardhatNetworkProvider: HardhatNetworkProvider;
        server?: JsonRpcServer;
        serverInfo?: {
            address: string;
            port: number;
        };
    }
}
export interface UseProviderOptions {
    useJsonRpc?: boolean;
    loggerEnabled?: boolean;
    forkConfig?: ForkConfig;
    mining?: HardhatNetworkMiningConfig;
    hardfork?: string;
    networkName?: string;
    chainId?: number;
    networkId?: number;
    blockGasLimit?: number;
    accounts?: Array<{
        privateKey: string;
        balance: BN;
    }>;
    allowUnlimitedContractSize?: boolean;
    initialBaseFeePerGas?: number;
    mempool?: HardhatNetworkMempoolConfig;
    coinbase?: string;
    chains?: HardhatNetworkChainsConfig;
}
export declare function useProvider({ useJsonRpc, loggerEnabled, forkConfig, mining, hardfork, networkName, chainId, networkId, blockGasLimit, accounts, allowUnlimitedContractSize, initialBaseFeePerGas, mempool, coinbase, chains, }?: UseProviderOptions): void;
//# sourceMappingURL=useProvider.d.ts.map