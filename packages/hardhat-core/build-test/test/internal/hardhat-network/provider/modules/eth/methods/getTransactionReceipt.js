"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../../../helpers/assertions");
const contracts_1 = require("../../../../helpers/contracts");
const cwd_1 = require("../../../../helpers/cwd");
const getPendingBaseFeePerGas_1 = require("../../../../helpers/getPendingBaseFeePerGas");
const providers_1 = require("../../../../helpers/providers");
const retrieveForkBlockNumber_1 = require("../../../../helpers/retrieveForkBlockNumber");
const transactions_1 = require("../../../../helpers/transactions");
describe("Eth module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork }) => {
        if (isFork) {
            this.timeout(50000);
        }
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork });
        describe(`${name} provider`, function () {
            (0, cwd_1.setCWD)();
            useProvider();
            const getFirstBlock = async () => isFork ? (0, retrieveForkBlockNumber_1.retrieveForkBlockNumber)(this.ctx.hardhatNetworkProvider) : 0;
            describe("eth_getTransactionReceipt", async function () {
                it("should return null for unknown txs", async function () {
                    const receipt = await this.provider.send("eth_getTransactionReceipt", [
                        "0x1234567876543234567876543456765434567aeaeaed67616732632762762373",
                    ]);
                    chai_1.assert.isNull(receipt);
                });
                it("should return the right tx index and gas used", async function () {
                    const firstBlock = await getFirstBlock();
                    const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    await this.provider.send("evm_setAutomine", [false]);
                    const txHashes = await Promise.all(Array.from(new Array(2)).map(() => this.provider.send("eth_sendTransaction", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: `${contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState}000000000000000000000000000000000000000000000000000000000000000a`,
                            gas: `0x${new ethereumjs_util_1.BN(150000).toString(16)}`,
                        },
                    ])));
                    await this.provider.send("evm_mine", []);
                    const block = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(firstBlock + 2), false]);
                    chai_1.assert.equal(block.transactions.length, 2);
                    const receipts = await Promise.all(txHashes.map((txHash) => this.provider.send("eth_getTransactionReceipt", [
                        txHash,
                    ])));
                    let logIndex = 0;
                    let cumGasUsed = 0;
                    for (const receipt of receipts) {
                        cumGasUsed += (0, base_types_1.rpcQuantityToNumber)(receipt.gasUsed);
                        chai_1.assert.equal(cumGasUsed, (0, base_types_1.rpcQuantityToNumber)(receipt.cumulativeGasUsed));
                        for (const event of receipt.logs) {
                            chai_1.assert.equal(logIndex, (0, base_types_1.rpcQuantityToNumber)(event.logIndex === null ? "0" : event.logIndex));
                            logIndex += 1;
                        }
                    }
                });
                it("should return the right values for successful txs", async function () {
                    const firstBlock = await getFirstBlock();
                    const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const txHash = await this.provider.send("eth_sendTransaction", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: `${contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState}000000000000000000000000000000000000000000000000000000000000000a`,
                        },
                    ]);
                    const block = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(firstBlock + 2), false]);
                    const receipt = await this.provider.send("eth_getTransactionReceipt", [txHash]);
                    chai_1.assert.equal(receipt.blockHash, block.hash);
                    (0, assertions_1.assertQuantity)(receipt.blockNumber, firstBlock + 2);
                    chai_1.assert.isNull(receipt.contractAddress);
                    chai_1.assert.equal(receipt.cumulativeGasUsed, receipt.gasUsed);
                    chai_1.assert.equal(receipt.from, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0]);
                    (0, assertions_1.assertQuantity)(receipt.status, 1);
                    chai_1.assert.equal(receipt.logs.length, 1);
                    chai_1.assert.equal(receipt.to, contractAddress);
                    chai_1.assert.equal(receipt.transactionHash, txHash);
                    (0, assertions_1.assertQuantity)(receipt.transactionIndex, 0);
                    const log = receipt.logs[0];
                    chai_1.assert.isFalse(log.removed);
                    (0, assertions_1.assertQuantity)(log.logIndex, 0);
                    (0, assertions_1.assertQuantity)(log.transactionIndex, 0);
                    chai_1.assert.equal(log.transactionHash, txHash);
                    chai_1.assert.equal(log.blockHash, block.hash);
                    (0, assertions_1.assertQuantity)(log.blockNumber, firstBlock + 2);
                    chai_1.assert.equal(log.address, contractAddress);
                    // The new value of i is not indexed
                    chai_1.assert.equal(log.data, "0x000000000000000000000000000000000000000000000000000000000000000a");
                    chai_1.assert.deepEqual(log.topics, [
                        contracts_1.EXAMPLE_CONTRACT.topics.StateModified[0],
                        "0x0000000000000000000000000000000000000000000000000000000000000000",
                    ]);
                });
                it("should return the receipt for txs that were executed and failed", async function () {
                    const txParams = {
                        to: undefined,
                        from: (0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: (0, ethereumjs_util_1.toBuffer)("0x60006000fd"),
                        nonce: new ethereumjs_util_1.BN(0),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(250000),
                        gasPrice: await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider),
                    };
                    const txHash = await (0, transactions_1.getSignedTxHash)(this.hardhatNetworkProvider, txParams, 1);
                    // Revert. This is a deployment transaction that immediately reverts without a reason
                    await (0, assertions_1.assertTransactionFailure)(this.provider, {
                        from: (0, ethereumjs_util_1.bufferToHex)(txParams.from),
                        data: (0, ethereumjs_util_1.bufferToHex)(txParams.data),
                        nonce: (0, base_types_1.numberToRpcQuantity)(txParams.nonce),
                        value: (0, base_types_1.numberToRpcQuantity)(txParams.value),
                        gas: (0, base_types_1.numberToRpcQuantity)(txParams.gasLimit),
                        gasPrice: (0, base_types_1.numberToRpcQuantity)(txParams.gasPrice),
                    }, "Transaction reverted without a reason");
                    const receipt = await this.provider.send("eth_getTransactionReceipt", [txHash]);
                    chai_1.assert.isNotNull(receipt);
                });
                it("should return a new object every time", async function () {
                    const txHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        },
                    ]);
                    const receipt1 = await this.provider.send("eth_getTransactionReceipt", [txHash]);
                    receipt1.blockHash = "changed";
                    const receipt2 = await this.provider.send("eth_getTransactionReceipt", [txHash]);
                    chai_1.assert.notEqual(receipt1, receipt2);
                    chai_1.assert.notEqual(receipt2.blockHash, "changed");
                });
            });
        });
    });
});
//# sourceMappingURL=getTransactionReceipt.js.map