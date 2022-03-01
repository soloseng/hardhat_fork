"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../../../helpers/assertions");
const cwd_1 = require("../../../../helpers/cwd");
const providers_1 = require("../../../../helpers/providers");
const provider_1 = require("../../../../../../../src/internal/hardhat-network/provider/provider");
/**
 * This file test the methods that are not covered by the other
 * files in this directory.
 */
describe("Eth module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork, chainId }) => {
        if (isFork) {
            this.timeout(50000);
        }
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork });
        describe(`${name} provider`, function () {
            (0, cwd_1.setCWD)();
            useProvider();
            describe("eth_accounts", async function () {
                it("should return the genesis accounts in lower case", async function () {
                    const accounts = await this.provider.send("eth_accounts");
                    chai_1.assert.deepEqual(accounts, providers_1.DEFAULT_ACCOUNTS_ADDRESSES);
                });
            });
            describe("eth_chainId", async function () {
                it("should return the chain id as QUANTITY", async function () {
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_chainId"), chainId);
                });
            });
            describe("eth_coinbase", async function () {
                it("should return the default coinbase address", async function () {
                    chai_1.assert.equal(await this.provider.send("eth_coinbase"), provider_1.DEFAULT_COINBASE);
                });
            });
            describe("eth_compileLLL", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_compileLLL");
                });
            });
            describe("eth_compileSerpent", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_compileSerpent");
                });
            });
            describe("eth_compileSolidity", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_compileSolidity");
                });
            });
            describe("eth_getCompilers", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_getCompilers");
                });
            });
            describe("eth_getProof", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_getProof");
                });
            });
            describe("eth_getUncleByBlockHashAndIndex", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_getUncleByBlockHashAndIndex");
                });
            });
            describe("eth_getUncleByBlockNumberAndIndex", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_getUncleByBlockNumberAndIndex");
                });
            });
            describe("eth_getUncleCountByBlockHash", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_getUncleCountByBlockHash");
                });
            });
            describe("eth_getUncleCountByBlockNumber", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_getUncleCountByBlockNumber");
                });
            });
            describe("eth_getWork", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_getWork");
                });
            });
            describe("eth_hashrate", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_hashrate");
                });
            });
            describe("eth_mining", async function () {
                it("should return false", async function () {
                    chai_1.assert.deepEqual(await this.provider.send("eth_mining"), false);
                });
            });
            describe("eth_protocolVersion", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_protocolVersion");
                });
            });
            describe("eth_sign", async function () {
                // TODO: Test this. Note that it's implementation is tested in one of
                // our provider wrappers, but re-test it here anyway.
            });
            describe("eth_signTransaction", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_signTransaction");
                });
            });
            describe("eth_signTypedData", function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_signTypedData");
                });
            });
            describe("eth_signTypedData_v3", function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_signTypedData_v3");
                });
            });
            describe("eth_submitHashrate", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_submitHashrate");
                });
            });
            describe("eth_submitWork", async function () {
                it("is not supported", async function () {
                    await (0, assertions_1.assertNotSupported)(this.provider, "eth_submitWork");
                });
            });
            describe("eth_syncing", async function () {
                it("Should return false", async function () {
                    chai_1.assert.deepEqual(await this.provider.send("eth_syncing"), false);
                });
            });
        });
    });
});
//# sourceMappingURL=index.js.map