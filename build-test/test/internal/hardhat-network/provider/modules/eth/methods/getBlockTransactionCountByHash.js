"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../../../helpers/assertions");
const cwd_1 = require("../../../../helpers/cwd");
const providers_1 = require("../../../../helpers/providers");
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
            describe("eth_getBlockTransactionCountByHash", async function () {
                it("should return null for non-existing blocks", async function () {
                    chai_1.assert.isNull(await this.provider.send("eth_getBlockTransactionCountByHash", [
                        "0x1111111111111111111111111111111111111111111111111111111111111111",
                    ]));
                });
                it("Should return 0 for the genesis block", async function () {
                    const genesisBlock = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(0), false]);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getBlockTransactionCountByHash", [
                        genesisBlock.hash,
                    ]), 0);
                });
                it("Should return 1 for others", async function () {
                    const txhash = await (0, transactions_1.sendTxToZeroAddress)(this.provider);
                    const txOutput = await this.provider.send("eth_getTransactionByHash", [txhash]);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getBlockTransactionCountByHash", [
                        txOutput.blockHash,
                    ]), 1);
                });
            });
        });
    });
});
//# sourceMappingURL=getBlockTransactionCountByHash.js.map