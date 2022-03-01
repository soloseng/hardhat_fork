"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const workaround_windows_ci_failures_1 = require("../../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../../helpers/assertions");
const contracts_1 = require("../../../helpers/contracts");
const cwd_1 = require("../../../helpers/cwd");
const providers_1 = require("../../../helpers/providers");
const retrieveForkBlockNumber_1 = require("../../../helpers/retrieveForkBlockNumber");
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
            const getFirstBlock = async () => isFork ? (0, retrieveForkBlockNumber_1.retrieveForkBlockNumber)(this.ctx.hardhatNetworkProvider) : 0;
            describe("block tags", function () {
                it("should allow EIP-1898 block tags", async function () {
                    const firstBlock = await getFirstBlock();
                    const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000000a";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    const previousBlockNumber = `0x${(firstBlock + 1).toString(16)}`;
                    const previousBlock = await this.provider.send("eth_getBlockByNumber", [previousBlockNumber, false]);
                    chai_1.assert.equal(await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        },
                        {
                            blockNumber: previousBlock.number,
                        },
                    ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                    chai_1.assert.equal(await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        },
                        {
                            blockHash: previousBlock.hash,
                        },
                    ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                    const latestBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    chai_1.assert.equal(await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        },
                        {
                            blockNumber: latestBlock.number,
                        },
                    ]), `0x${newState}`);
                    chai_1.assert.equal(await this.provider.send("eth_call", [
                        {
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        },
                        {
                            blockHash: latestBlock.hash,
                        },
                    ]), `0x${newState}`);
                });
                it("should not accept an empty block tag", async function () {
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "eth_getBalance", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        {},
                    ]);
                });
                it("should not accept both a blockNumber and a blockHash in a block tag", async function () {
                    const latestBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "eth_getBalance", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        {
                            blockNumber: "0x0",
                            blockHash: latestBlock.hash,
                        },
                    ]);
                });
                it("should not accept both a blockNumber and requireCanonical", async function () {
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "eth_getBalance", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        {
                            blockNumber: "0x0",
                            requireCanonical: true,
                        },
                    ]);
                });
                it("should accept a requireCanonical flag", async function () {
                    const block = await this.provider.send("eth_getBlockByNumber", ["0x0", false]);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getBalance", [
                        (0, ethereumjs_util_1.zeroAddress)(),
                        {
                            blockHash: block.hash,
                            requireCanonical: true,
                        },
                    ]), 0);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getBalance", [
                        (0, ethereumjs_util_1.zeroAddress)(),
                        {
                            blockHash: block.hash,
                            requireCanonical: false,
                        },
                    ]), 0);
                });
            });
        });
    });
});
//# sourceMappingURL=blockTags.js.map