"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const contracts_1 = require("../../../../helpers/contracts");
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
            describe("eth_getStorageAt", async function () {
                describe("Imitating Ganache", function () {
                    describe("When a slot has not been written into", function () {
                        it("Should return `0x0000000000000000000000000000000000000000000000000000000000000000`", async function () {
                            const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                            chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                exampleContract,
                                (0, base_types_1.numberToRpcQuantity)(3),
                            ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                            chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                exampleContract,
                                (0, base_types_1.numberToRpcQuantity)(4),
                            ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                            chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                (0, base_types_1.numberToRpcQuantity)(0),
                            ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                        });
                    });
                    describe("When a slot has been written into", function () {
                        describe("When 32 bytes were written", function () {
                            it("Should return a 32-byte DATA string", async function () {
                                const firstBlock = await getFirstBlock();
                                const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    (0, base_types_1.numberToRpcQuantity)(2),
                                    (0, base_types_1.numberToRpcQuantity)(firstBlock),
                                ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    (0, base_types_1.numberToRpcQuantity)(2),
                                ]), "0x1234567890123456789012345678901234567890123456789012345678901234");
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    (0, base_types_1.numberToRpcQuantity)(2),
                                    "latest",
                                ]), "0x1234567890123456789012345678901234567890123456789012345678901234");
                            });
                            it("Should return a 32-byte DATA string in the context of a new block with 'pending' block tag param", async function () {
                                const snapshotId = await this.provider.send("evm_snapshot");
                                const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                                await this.provider.send("evm_revert", [snapshotId]);
                                await this.provider.send("evm_setAutomine", [false]);
                                const txHash = await this.provider.send("eth_sendTransaction", [
                                    {
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                        data: `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`,
                                        gas: (0, base_types_1.numberToRpcQuantity)(providers_1.DEFAULT_BLOCK_GAS_LIMIT),
                                    },
                                ]);
                                const txReceipt = await this.provider.send("eth_getTransactionReceipt", [txHash]);
                                chai_1.assert.isNotNull(contractAddress);
                                chai_1.assert.isNull(txReceipt);
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    contractAddress,
                                    (0, base_types_1.numberToRpcQuantity)(2),
                                ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    contractAddress,
                                    (0, base_types_1.numberToRpcQuantity)(2),
                                    "pending",
                                ]), "0x1234567890123456789012345678901234567890123456789012345678901234");
                            });
                            it("Should return a zero-value 32-byte DATA string in the context of the first block with 'earliest' block tag param", async function () {
                                const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    (0, base_types_1.numberToRpcQuantity)(2),
                                    "latest",
                                ]), "0x1234567890123456789012345678901234567890123456789012345678901234");
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    (0, base_types_1.numberToRpcQuantity)(2),
                                    "earliest",
                                ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                            });
                        });
                        describe("When less than 32 bytes where written", function () {
                            it("Should return a DATA string with the same amount bytes that have been written", async function () {
                                const firstBlock = await getFirstBlock();
                                const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                                // We return as the EthereumJS VM stores it. This has been checked
                                // against remix
                                let newState = "000000000000000000000000000000000000000000000000000000000000007b";
                                await this.provider.send("eth_sendTransaction", [
                                    {
                                        to: exampleContract,
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                        data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                                    },
                                ]);
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    (0, base_types_1.numberToRpcQuantity)(0),
                                    (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                                ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    (0, base_types_1.numberToRpcQuantity)(0),
                                ]), "0x000000000000000000000000000000000000000000000000000000000000007b");
                                newState =
                                    "000000000000000000000000000000000000000000000000000000000000007c";
                                await this.provider.send("eth_sendTransaction", [
                                    {
                                        to: exampleContract,
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                        data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                                    },
                                ]);
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    (0, base_types_1.numberToRpcQuantity)(0),
                                    (0, base_types_1.numberToRpcQuantity)(firstBlock + 2),
                                ]), "0x000000000000000000000000000000000000000000000000000000000000007b");
                                chai_1.assert.strictEqual(await this.provider.send("eth_getStorageAt", [
                                    exampleContract,
                                    (0, base_types_1.numberToRpcQuantity)(0),
                                ]), "0x000000000000000000000000000000000000000000000000000000000000007c");
                            });
                        });
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=getStorageAt.js.map