import { Transaction, TxData } from "@ethereumjs/tx";
import { AddressLike, BN } from "ethereumjs-util";
import { FeeMarketEIP1559TxData } from "@ethereumjs/tx/dist.browser";
import { AccessListEIP2930TxData } from "@ethereumjs/tx/dist/types";
import { RpcLogOutput, RpcReceiptOutput } from "../../../../src/internal/hardhat-network/provider/output";
import { OrderedTransaction, SerializedTransaction } from "../../../../src/internal/hardhat-network/provider/PoolState";
import { FakeSenderTransaction } from "../../../../src/internal/hardhat-network/provider/transactions/FakeSenderTransaction";
import { FakeSenderAccessListEIP2930Transaction } from "../../../../src/internal/hardhat-network/provider/transactions/FakeSenderAccessListEIP2930Transaction";
import { FakeSenderEIP1559Transaction } from "../../../../src/internal/hardhat-network/provider/transactions/FakeSenderEIP1559Transaction";
export declare function createTestTransaction(data?: TxData): Transaction;
export declare function createTestFakeTransaction(data?: (TxData | FeeMarketEIP1559TxData | AccessListEIP2930TxData) & {
    from?: AddressLike;
}): FakeSenderTransaction | FakeSenderAccessListEIP2930Transaction | FakeSenderEIP1559Transaction;
declare type OrderedTxData = (TxData | FeeMarketEIP1559TxData | AccessListEIP2930TxData) & {
    from?: AddressLike;
    orderId: number;
};
export declare function createTestOrderedTransaction({ orderId, ...rest }: OrderedTxData): OrderedTransaction;
export declare function createTestSerializedTransaction(data: OrderedTxData): SerializedTransaction;
export declare function createTestReceipt(transaction: Transaction, logs?: RpcLogOutput[]): RpcReceiptOutput;
export declare function createTestLog(blockNumber: BN | number): RpcLogOutput;
export {};
//# sourceMappingURL=blockchain.d.ts.map