"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../../../helpers/assertions");
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
            describe("eth_blockNumber", async function () {
                let firstBlock;
                beforeEach(async function () {
                    firstBlock = await getFirstBlock();
                });
                it("should return the current block number as QUANTITY", async function () {
                    let blockNumber = await this.provider.send("eth_blockNumber");
                    (0, assertions_1.assertQuantity)(blockNumber, firstBlock);
                    await (0, transactions_1.sendTxToZeroAddress)(this.provider);
                    blockNumber = await this.provider.send("eth_blockNumber");
                    (0, assertions_1.assertQuantity)(blockNumber, firstBlock + 1);
                    await (0, transactions_1.sendTxToZeroAddress)(this.provider);
                    blockNumber = await this.provider.send("eth_blockNumber");
                    (0, assertions_1.assertQuantity)(blockNumber, firstBlock + 2);
                    await (0, transactions_1.sendTxToZeroAddress)(this.provider);
                    blockNumber = await this.provider.send("eth_blockNumber");
                    (0, assertions_1.assertQuantity)(blockNumber, firstBlock + 3);
                });
                it("Should increase if a transaction gets to execute and fails", async function () {
                    let blockNumber = await this.provider.send("eth_blockNumber");
                    (0, assertions_1.assertQuantity)(blockNumber, firstBlock);
                    try {
                        await this.provider.send("eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                to: "0x0000000000000000000000000000000000000001",
                                gas: (0, base_types_1.numberToRpcQuantity)(21000),
                                gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                            },
                        ]);
                        chai_1.assert.fail("Tx should have failed");
                    }
                    catch (e) {
                        chai_1.assert.notInclude(e.message, "Tx should have failed");
                    }
                    blockNumber = await this.provider.send("eth_blockNumber");
                    (0, assertions_1.assertQuantity)(blockNumber, firstBlock + 1);
                });
                it("Shouldn't increase if a call is made", async function () {
                    let blockNumber = await this.provider.send("eth_blockNumber");
                    (0, assertions_1.assertQuantity)(blockNumber, firstBlock);
                    await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: "0x0000000000000000000000000000000000000000",
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        },
                    ]);
                    blockNumber = await this.provider.send("eth_blockNumber");
                    (0, assertions_1.assertQuantity)(blockNumber, firstBlock);
                });
            });
        });
    });
});
//# sourceMappingURL=blockNumber.js.map