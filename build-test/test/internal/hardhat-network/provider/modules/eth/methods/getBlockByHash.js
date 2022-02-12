"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
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
            describe("eth_getBlockByHash", async function () {
                it("should return null for non-existing blocks", async function () {
                    chai_1.assert.isNull(await this.provider.send("eth_getBlockByHash", [
                        "0x0000000000000000000000000000000000000000000000000000000000000001",
                        false,
                    ]));
                    chai_1.assert.isNull(await this.provider.send("eth_getBlockByHash", [
                        "0x0000000000000000000000000000000000000000000000000000000000000123",
                        true,
                    ]));
                });
                it("Should return the block with transaction hashes if the second argument is false", async function () {
                    const firstBlock = await getFirstBlock();
                    const txHash = await (0, transactions_1.sendTxToZeroAddress)(this.provider);
                    const txOutput = await this.provider.send("eth_getTransactionByHash", [txHash]);
                    const block = await this.provider.send("eth_getBlockByHash", [txOutput.blockHash, false]);
                    chai_1.assert.equal(block.hash, txOutput.blockHash);
                    (0, assertions_1.assertQuantity)(block.number, firstBlock + 1);
                    chai_1.assert.equal(block.transactions.length, 1);
                    chai_1.assert.include(block.transactions, txHash);
                    chai_1.assert.equal(block.miner, provider_1.DEFAULT_COINBASE.toString());
                    chai_1.assert.isEmpty(block.uncles);
                });
                it("Should return the block with the complete transactions if the second argument is true", async function () {
                    const firstBlock = await getFirstBlock();
                    const txHash = await (0, transactions_1.sendTxToZeroAddress)(this.provider);
                    const txOutput = await this.provider.send("eth_getTransactionByHash", [txHash]);
                    const block = await this.provider.send("eth_getBlockByHash", [txOutput.blockHash, true]);
                    chai_1.assert.equal(block.hash, txOutput.blockHash);
                    (0, assertions_1.assertQuantity)(block.number, firstBlock + 1);
                    chai_1.assert.equal(block.transactions.length, 1);
                    chai_1.assert.equal(block.miner, provider_1.DEFAULT_COINBASE.toString());
                    chai_1.assert.deepEqual(block.transactions[0], txOutput);
                    chai_1.assert.isEmpty(block.uncles);
                });
            });
        });
    });
});
//# sourceMappingURL=getBlockByHash.js.map