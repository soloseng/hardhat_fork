"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethereumjs_util_1 = require("ethereumjs-util");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../../../helpers/assertions");
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
            describe("eth_gasPrice", async function () {
                describe("with eip-1559", function () {
                    useProvider();
                    it("should return the next baseFeePerGas plus 1 gwei", async function () {
                        const gasPrice = await this.provider.send("eth_gasPrice");
                        const { baseFeePerGas: nextBlockBaseFeePerGas } = await this.provider.send("eth_getBlockByNumber", [
                            "pending",
                            false,
                        ]);
                        const expectedGasPrice = (0, base_types_1.rpcQuantityToBN)(nextBlockBaseFeePerGas).add(new ethereumjs_util_1.BN(1e9));
                        (0, assertions_1.assertQuantity)(gasPrice, expectedGasPrice);
                    });
                });
                describe("without eip-1559", function () {
                    useProvider({ hardfork: "berlin" });
                    it("Should return a hardcoded value for non-eip1559 networks", async function () {
                        (0, assertions_1.assertQuantity)(await this.provider.send("eth_gasPrice"), 8e9);
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=gasPrice.js.map