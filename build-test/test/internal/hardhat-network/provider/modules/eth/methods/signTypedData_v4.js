"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const eth_sig_util_1 = require("@metamask/eth-sig-util");
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
            describe("eth_signTypedData_v4", function () {
                // See https://eips.ethereum.org/EIPS/eip-712#parameters
                // There's a json schema and an explanation for each field.
                const typedMessage = {
                    domain: {
                        chainId: 31337,
                        name: "Hardhat Network test suite",
                    },
                    message: {
                        name: "Translation",
                        start: {
                            x: 200,
                            y: 600,
                        },
                        end: {
                            x: 300,
                            y: 350,
                        },
                        cost: 50,
                    },
                    primaryType: "WeightedVector",
                    types: {
                        EIP712Domain: [
                            { name: "name", type: "string" },
                            { name: "chainId", type: "uint256" },
                        ],
                        WeightedVector: [
                            { name: "name", type: "string" },
                            { name: "start", type: "Point" },
                            { name: "end", type: "Point" },
                            { name: "cost", type: "uint256" },
                        ],
                        Point: [
                            { name: "x", type: "uint256" },
                            { name: "y", type: "uint256" },
                        ],
                    },
                };
                const [address] = providers_1.DEFAULT_ACCOUNTS_ADDRESSES;
                it("should sign a message", async function () {
                    const signature = (await this.provider.request({
                        method: "eth_signTypedData_v4",
                        params: [address, typedMessage],
                    }));
                    const recoveredAddress = (0, eth_sig_util_1.recoverTypedSignature)({
                        signature,
                        version: eth_sig_util_1.SignTypedDataVersion.V4,
                        data: typedMessage,
                    });
                    chai_1.assert.equal(address.toLowerCase(), recoveredAddress.toLowerCase());
                });
                it("should sign a message that is JSON stringified", async function () {
                    const signature = (await this.provider.request({
                        method: "eth_signTypedData_v4",
                        params: [address, JSON.stringify(typedMessage)],
                    }));
                    const recoveredAddress = (0, eth_sig_util_1.recoverTypedSignature)({
                        signature,
                        version: eth_sig_util_1.SignTypedDataVersion.V4,
                        data: typedMessage,
                    });
                    chai_1.assert.equal(address.toLowerCase(), recoveredAddress.toLowerCase());
                });
                it("should fail with an invalid JSON", async function () {
                    try {
                        await this.provider.request({
                            method: "eth_signTypedData_v4",
                            params: [address, "{an invalid JSON"],
                        });
                    }
                    catch (error) {
                        chai_1.assert.include(error.message, "is an invalid JSON");
                        return;
                    }
                    chai_1.assert.fail("should have failed with an invalid JSON");
                });
            });
        });
    });
});
//# sourceMappingURL=signTypedData_v4.js.map