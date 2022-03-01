"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const cwd_1 = require("../../../../helpers/cwd");
const providers_1 = require("../../../../helpers/providers");
describe("Eth module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork }) => {
        if (isFork) {
            this.timeout(50000);
        }
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork });
        describe(`${name} provider`, function () {
            (0, cwd_1.setCWD)();
            useProvider();
            describe("eth_newPendingTransactionFilter", async function () {
                it("Supports pending transaction filter", async function () {
                    chai_1.assert.isString(await this.provider.send("eth_newPendingTransactionFilter"));
                });
                it("Supports uninstalling an existing filter", async function () {
                    const filterId = await this.provider.send("eth_newPendingTransactionFilter", []);
                    const uninstalled = await this.provider.send("eth_uninstallFilter", [
                        filterId,
                    ]);
                    chai_1.assert.isTrue(uninstalled);
                });
                it("Should return new pending transactions", async function () {
                    const filterId = await this.provider.send("eth_newPendingTransactionFilter", []);
                    const accounts = await this.provider.send("eth_accounts");
                    const burnTxParams = {
                        from: accounts[0],
                        to: (0, ethereumjs_util_1.zeroAddress)(),
                        gas: (0, base_types_1.numberToRpcQuantity)(21000),
                    };
                    await this.provider.send("eth_sendTransaction", [burnTxParams]);
                    const txHashes = await this.provider.send("eth_getFilterChanges", [
                        filterId,
                    ]);
                    chai_1.assert.isNotEmpty(txHashes);
                });
                it("Should not return new pending transactions after uninstall", async function () {
                    const filterId = await this.provider.send("eth_newPendingTransactionFilter", []);
                    const uninstalled = await this.provider.send("eth_uninstallFilter", [
                        filterId,
                    ]);
                    chai_1.assert.isTrue(uninstalled);
                    const accounts = await this.provider.send("eth_accounts");
                    const burnTxParams = {
                        from: accounts[0],
                        to: (0, ethereumjs_util_1.zeroAddress)(),
                        gas: (0, base_types_1.numberToRpcQuantity)(21000),
                    };
                    await this.provider.send("eth_sendTransaction", [burnTxParams]);
                    const txHashes = await this.provider.send("eth_getFilterChanges", [
                        filterId,
                    ]);
                    chai_1.assert.isNull(txHashes);
                });
            });
        });
    });
});
//# sourceMappingURL=newPendingTransactionFilter.js.map