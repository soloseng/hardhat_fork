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
            describe("eth_getBlockTransactionCountByNumber", async function () {
                it("should return null for non-existing blocks", async function () {
                    const firstBlock = await getFirstBlock();
                    chai_1.assert.isNull(await this.provider.send("eth_getBlockTransactionCountByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                    ]));
                });
                it("Should return 0 for the genesis block", async function () {
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getBlockTransactionCountByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(0),
                    ]), 0);
                });
                it("Should return the number of transactions in the block", async function () {
                    const firstBlock = await getFirstBlock();
                    await (0, transactions_1.sendTxToZeroAddress)(this.provider);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getBlockTransactionCountByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                    ]), 1);
                });
                it("Should return the number of transactions in the 'pending' block", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    await (0, transactions_1.sendTxToZeroAddress)(this.provider);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getBlockTransactionCountByNumber", [
                        "pending",
                    ]), 1);
                });
            });
        });
    });
});
//# sourceMappingURL=getBlockTransactionCountByNumber.js.map