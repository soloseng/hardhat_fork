"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const block_1 = require("@ethereumjs/block");
const common_1 = __importDefault(require("@ethereumjs/common"));
const workaround_windows_ci_failures_1 = require("../../../utils/workaround-windows-ci-failures");
const providers_1 = require("../helpers/providers");
const base_types_1 = require("../../../../src/internal/core/jsonrpc/types/base-types");
const makeForkClient_1 = require("../../../../src/internal/hardhat-network/provider/utils/makeForkClient");
const setup_1 = require("../../../setup");
const rpcToBlockData_1 = require("../../../../src/internal/hardhat-network/provider/fork/rpcToBlockData");
async function getLatestBaseFeePerGas(provider) {
    const block = await provider.send("eth_getBlockByNumber", ["latest", false]);
    if (block.baseFeePerGas === undefined) {
        return undefined;
    }
    return (0, base_types_1.rpcQuantityToBN)(block.baseFeePerGas);
}
async function assertLatestBaseFeePerGas(provider, expectedBaseFeePerGas) {
    const baseFeePerGas = await getLatestBaseFeePerGas(provider);
    chai_1.assert.isDefined(baseFeePerGas);
    chai_1.assert.equal(baseFeePerGas.toString(), expectedBaseFeePerGas.toString());
}
async function sendValueTransferTx(provider, sender) {
    await provider.send("eth_sendTransaction", [
        {
            from: sender,
            to: sender,
            gas: (0, base_types_1.numberToRpcQuantity)(21000),
        },
    ]);
}
async function mineBlockWithValueTransferTxs(provider, valueTransferTxs) {
    await provider.send("evm_setAutomine", [false]);
    const [sender] = await provider.send("eth_accounts");
    for (let i = 0; i < valueTransferTxs; i++) {
        await sendValueTransferTx(provider, sender);
    }
    await provider.send("evm_mine");
    await provider.send("evm_setAutomine", [true]);
}
describe("Block's baseFeePerGas", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork }) => {
        if (isFork) {
            this.timeout(50000);
        }
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork });
        describe(`${name} provider`, function () {
            describe("Initial base fee per gas", function () {
                if (!isFork) {
                    describe("When not forking from a remote network the first block must have the right value", function () {
                        describe("With an initialBaseFeePerGas config value", function () {
                            useProvider({ initialBaseFeePerGas: 123 });
                            it("should use the given value", async function () {
                                await assertLatestBaseFeePerGas(this.provider, 123);
                            });
                        });
                        describe("Without an initialBaseFeePerGas config value", function () {
                            useProvider({});
                            it("should use the initial base fee from the EIP (i.e. 1gwei)", async function () {
                                await assertLatestBaseFeePerGas(this.provider, 1000000000);
                            });
                        });
                    });
                }
                else {
                    describe("When forking from a remote network the forked block must have the right value", function () {
                        describe("With an initialBaseFeePerGas config value", function () {
                            useProvider({ initialBaseFeePerGas: 123123 });
                            it("should use the given value", async function () {
                                await mineBlockWithValueTransferTxs(this.provider, 0);
                                await assertLatestBaseFeePerGas(this.provider, 123123);
                            });
                        });
                        describe("Without an initialBaseFeePerGas config value", function () {
                            useProvider();
                            it("Should use the same base fee as the one remote networks's forked block", async function () {
                                if (setup_1.ALCHEMY_URL === undefined || setup_1.ALCHEMY_URL === "") {
                                    this.skip();
                                    return;
                                }
                                const blockNumber = await this.provider.send("eth_blockNumber");
                                const { forkClient } = await (0, makeForkClient_1.makeForkClient)({
                                    jsonRpcUrl: setup_1.ALCHEMY_URL,
                                });
                                const remoteLatestBlockBaseFeePerGas = await forkClient.getBlockByNumber((0, base_types_1.rpcQuantityToBN)(blockNumber));
                                await assertLatestBaseFeePerGas(this.provider, remoteLatestBlockBaseFeePerGas.baseFeePerGas.toNumber());
                            });
                            for (const hardfork of ["london", "arrowGlacier"]) {
                                it(`should compute the next base fee correctly when ${hardfork} is activated`, async function () {
                                    const latestBlockRpc = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                                    const latestBlockData = (0, rpcToBlockData_1.rpcToBlockData)(Object.assign(Object.assign({}, latestBlockRpc), { transactions: [] }));
                                    const latestBlock = block_1.Block.fromBlockData({
                                        header: latestBlockData.header,
                                    }, {
                                        common: new common_1.default({
                                            chain: "mainnet",
                                            hardfork,
                                        }),
                                    });
                                    const expectedNextBaseFee = latestBlock.header.calcNextBaseFee();
                                    await this.provider.send("evm_mine");
                                    await assertLatestBaseFeePerGas(this.provider, expectedNextBaseFee.toNumber());
                                });
                            }
                        });
                    });
                }
            });
            describe("Base fee adjustment", function () {
                // These tests will run 6 blocks:
                //   The first one will be empty,
                //   The second one will be 1/4 filled
                //   The third one will be 1/2 filled, matching the gas target exactly
                //   The forth will be 3/4 filled
                //   The fifth will be completely filled
                //
                // All of the tests have a blockGasLimit of 21_000 * 4, so blocks can
                // only accept 4 value transfer txs.
                //
                // The initialBaseFeePerGas is 1_000_000_000, so the gas fee of the
                // blocks will be:
                //   1. 1_000_000_000 -- empty
                //   2. 875_000_000 -- 1/4 full
                //   3. 820_312_500 -- 1/2 full
                //   4. 820_312_500 -- 3/4 full
                //   5. 871_582_031 -- full
                //   6. 980529784 -- doesn't matter if full or not
                async function validateTheNext6BlocksBaseFeePerGas(provider) {
                    await assertLatestBaseFeePerGas(provider, 1000000000);
                    await mineBlockWithValueTransferTxs(provider, 1);
                    await assertLatestBaseFeePerGas(provider, 875000000);
                    await mineBlockWithValueTransferTxs(provider, 2);
                    await assertLatestBaseFeePerGas(provider, 820312500);
                    await mineBlockWithValueTransferTxs(provider, 3);
                    await assertLatestBaseFeePerGas(provider, 820312500);
                    await mineBlockWithValueTransferTxs(provider, 4);
                    await assertLatestBaseFeePerGas(provider, 871582031);
                    await mineBlockWithValueTransferTxs(provider, 0);
                    await assertLatestBaseFeePerGas(provider, 980529784);
                }
                if (!isFork) {
                    describe("When not forking", function () {
                        useProvider({
                            blockGasLimit: 21000 * 4,
                            initialBaseFeePerGas: 1000000000,
                        });
                        it("should update the baseFeePerGas starting with the first block", async function () {
                            await validateTheNext6BlocksBaseFeePerGas(this.provider);
                        });
                    });
                }
                else {
                    describe("When not forking", function () {
                        useProvider({
                            blockGasLimit: 21000 * 4,
                            initialBaseFeePerGas: 1000000000,
                        });
                        it("should update the baseFeePerGas starting with the first block", async function () {
                            // We mine an empty block first, to make the scenario match the non-forking one
                            await mineBlockWithValueTransferTxs(this.provider, 0);
                            await validateTheNext6BlocksBaseFeePerGas(this.provider);
                        });
                    });
                }
            });
        });
    });
});
//# sourceMappingURL=baseFeePerGas.js.map