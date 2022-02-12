"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const workaround_windows_ci_failures_1 = require("../../../../../utils/workaround-windows-ci-failures");
const contracts_1 = require("../../../helpers/contracts");
const cwd_1 = require("../../../helpers/cwd");
const providers_1 = require("../../../helpers/providers");
const transactions_1 = require("../../../helpers/transactions");
describe("Eth module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork }) => {
        if (isFork) {
            this.timeout(50000);
        }
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork });
        describe(`${name} provider`, function () {
            (0, cwd_1.setCWD)();
            useProvider();
            describe("gas usage", function () {
                it("should use 17100 less gas when writing a non-zero slot", async function () {
                    const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_SETTER_CONTRACT.bytecode.object}`);
                    const firstTxHash = await this.provider.send("eth_sendTransaction", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: `${contracts_1.EXAMPLE_SETTER_CONTRACT.selectors.setValue}0000000000000000000000000000000000000000000000000000000000000001`,
                        },
                    ]);
                    const firstReceipt = await this.provider.send("eth_getTransactionReceipt", [firstTxHash]);
                    const gasUsedBefore = new ethereumjs_util_1.BN((0, ethereumjs_util_1.toBuffer)(firstReceipt.gasUsed));
                    const secondTxHash = await this.provider.send("eth_sendTransaction", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: `${contracts_1.EXAMPLE_SETTER_CONTRACT.selectors.setValue}0000000000000000000000000000000000000000000000000000000000000002`,
                        },
                    ]);
                    const secondReceipt = await this.provider.send("eth_getTransactionReceipt", [secondTxHash]);
                    const gasUsedAfter = new ethereumjs_util_1.BN((0, ethereumjs_util_1.toBuffer)(secondReceipt.gasUsed));
                    const gasDifference = gasUsedBefore.sub(gasUsedAfter);
                    chai_1.assert.equal(gasDifference.toString(), "17100");
                });
            });
        });
    });
});
//# sourceMappingURL=gasUsage.js.map