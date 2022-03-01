"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../../../helpers/assertions");
const cwd_1 = require("../../../../helpers/cwd");
const providers_1 = require("../../../../helpers/providers");
const retrieveForkBlockNumber_1 = require("../../../../helpers/retrieveForkBlockNumber");
const transactions_1 = require("../../../../helpers/transactions");
const provider_1 = require("../../../../../../../src/internal/hardhat-network/provider/provider");
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
            describe("eth_getBlockByNumber", async function () {
                it("Should return the genesis block for number 0", async function () {
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(0),
                        false,
                    ]);
                    chai_1.assert.equal(block.parentHash, "0x0000000000000000000000000000000000000000000000000000000000000000");
                    (0, assertions_1.assertQuantity)(block.number, 0);
                    chai_1.assert.isEmpty(block.transactions);
                });
                it("Should return null for unknown blocks", async function () {
                    const firstBlock = await getFirstBlock();
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 2),
                        false,
                    ]);
                    chai_1.assert.isNull(block);
                    const block2 = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                        true,
                    ]);
                    chai_1.assert.isNull(block2);
                });
                it("Should return the new blocks", async function () {
                    const firstBlockNumber = await getFirstBlock();
                    const firstBlock = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(firstBlockNumber), false]);
                    const txHash = await (0, transactions_1.sendTxToZeroAddress)(this.provider);
                    const block = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(firstBlockNumber + 1), false]);
                    (0, assertions_1.assertQuantity)(block.number, firstBlockNumber + 1);
                    chai_1.assert.equal(block.transactions.length, 1);
                    chai_1.assert.equal(block.parentHash, firstBlock.hash);
                    chai_1.assert.include(block.transactions, txHash);
                    chai_1.assert.equal(block.miner, provider_1.DEFAULT_COINBASE.toString());
                    chai_1.assert.isEmpty(block.uncles);
                });
                it("Should return the new pending block", async function () {
                    const firstBlockNumber = await getFirstBlock();
                    const firstBlock = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(firstBlockNumber), false]);
                    await this.provider.send("evm_setAutomine", [false]);
                    const txHash = await (0, transactions_1.sendTxToZeroAddress)(this.provider);
                    const block = await this.provider.send("eth_getBlockByNumber", ["pending", false]);
                    chai_1.assert.equal(block.transactions.length, 1);
                    chai_1.assert.equal(block.parentHash, firstBlock.hash);
                    chai_1.assert.include(block.transactions, txHash);
                    chai_1.assert.equal(block.miner, provider_1.DEFAULT_COINBASE.toString());
                    chai_1.assert.isEmpty(block.uncles);
                });
                it("should return the complete transactions if the second argument is true", async function () {
                    const firstBlockNumber = await getFirstBlock();
                    const firstBlock = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(firstBlockNumber), false]);
                    const txHash = await (0, transactions_1.sendTxToZeroAddress)(this.provider);
                    const block = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(firstBlockNumber + 1), true]);
                    (0, assertions_1.assertQuantity)(block.number, firstBlockNumber + 1);
                    chai_1.assert.equal(block.transactions.length, 1);
                    chai_1.assert.equal(block.parentHash, firstBlock.hash);
                    chai_1.assert.equal(block.miner, provider_1.DEFAULT_COINBASE.toString());
                    chai_1.assert.isEmpty(block.uncles);
                    const txOutput = block.transactions[0];
                    chai_1.assert.equal(txOutput.hash, txHash);
                    chai_1.assert.equal(block.hash, txOutput.blockHash);
                    chai_1.assert.equal(block.number, txOutput.blockNumber);
                    chai_1.assert.equal(txOutput.transactionIndex, (0, base_types_1.numberToRpcQuantity)(0));
                    chai_1.assert.deepEqual(txOutput, await this.provider.send("eth_getTransactionByHash", [txHash]));
                });
                it("should return the right block total difficulty", isFork ? testTotalDifficultyFork : testTotalDifficulty);
                async function testTotalDifficultyFork() {
                    const forkBlockNumber = await getFirstBlock();
                    const forkBlock = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(forkBlockNumber), false]);
                    await (0, transactions_1.sendTxToZeroAddress)(this.provider);
                    const block = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(forkBlockNumber + 1), false]);
                    (0, assertions_1.assertQuantity)(block.totalDifficulty, (0, base_types_1.rpcQuantityToBN)(forkBlock.totalDifficulty).add((0, base_types_1.rpcQuantityToBN)(block.difficulty)));
                }
                async function testTotalDifficulty() {
                    const genesisBlock = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(0), false]);
                    (0, assertions_1.assertQuantity)(genesisBlock.totalDifficulty, 1);
                    (0, assertions_1.assertQuantity)(genesisBlock.difficulty, 1);
                    await (0, transactions_1.sendTxToZeroAddress)(this.provider);
                    const block = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(1), false]);
                    (0, assertions_1.assertQuantity)(block.totalDifficulty, (0, base_types_1.rpcQuantityToNumber)(block.difficulty) + 1);
                }
            });
        });
    });
});
//# sourceMappingURL=getBlockByNumber.js.map