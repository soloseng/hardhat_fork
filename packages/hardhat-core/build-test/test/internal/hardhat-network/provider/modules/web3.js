"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const base_types_1 = require("../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../utils/workaround-windows-ci-failures");
const cwd_1 = require("../../helpers/cwd");
const providers_1 = require("../../helpers/providers");
describe("Web3 module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork }) => {
        if (isFork) {
            this.timeout(50000);
        }
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork });
        describe(`${name} provider`, function () {
            (0, cwd_1.setCWD)();
            useProvider();
            describe("web3_clientVersion", async function () {
                it("Should return the right value", async function () {
                    const res = await this.provider.send("web3_clientVersion");
                    chai_1.assert.match(res, /^HardhatNetwork\/.*\/@ethereumjs\/vm/);
                });
            });
            describe("web3_sha3", async function () {
                it("Should return the keccak256 of the input", async function () {
                    const data = "0x123a1b238123";
                    const hashed = (0, base_types_1.bufferToRpcData)((0, ethereumjs_util_1.keccak256)((0, ethereumjs_util_1.toBuffer)(data)));
                    const res = await this.provider.send("web3_sha3", [
                        (0, base_types_1.bufferToRpcData)((0, ethereumjs_util_1.toBuffer)(data)),
                    ]);
                    chai_1.assert.strictEqual(res, hashed);
                });
            });
        });
    });
});
//# sourceMappingURL=web3.js.map