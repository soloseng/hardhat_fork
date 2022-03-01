import { Block } from "@ethereumjs/block";
import { RpcBlockWithTransactions } from "../../../../../src/internal/core/jsonrpc/types/output/block";
import { JsonRpcClient } from "../../../../../src/internal/hardhat-network/jsonrpc/client";
export declare function assertEqualBlocks(block: Block, afterBlockEvent: any, expectedBlock: RpcBlockWithTransactions, forkClient: JsonRpcClient): Promise<void>;
//# sourceMappingURL=assertEqualBlocks.d.ts.map