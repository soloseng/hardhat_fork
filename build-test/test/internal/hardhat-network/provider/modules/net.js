"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const base_types_1 = require("../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../utils/workaround-windows-ci-failures");
const cwd_1 = require("../../helpers/cwd");
const providers_1 = require("../../helpers/providers");
describe("Net module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, networkId, isFork }) => {
        if (isFork) {
            this.timeout(50000);
        }
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork });
        describe(`${name} provider`, function () {
            (0, cwd_1.setCWD)();
            useProvider();
            describe("net_listening", async function () {
                it("Should return true", async function () {
                    chai_1.assert.isTrue(await this.provider.send("net_listening"));
                });
            });
            describe("net_peerCount", async function () {
                it("Should return 0", async function () {
                    chai_1.assert.strictEqual(await this.provider.send("net_peerCount"), (0, base_types_1.numberToRpcQuantity)(0));
                });
            });
            describe("net_version", async function () {
                it("Should return the network id as a decimal string, not QUANTITY", async function () {
                    chai_1.assert.strictEqual(await this.provider.send("net_version"), networkId.toString());
                });
            });
        });
    });
});
//# sourceMappingURL=net.js.map