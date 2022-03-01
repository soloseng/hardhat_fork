"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const sinon_1 = __importDefault(require("sinon"));
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../../../helpers/assertions");
const contracts_1 = require("../../../../helpers/contracts");
const cwd_1 = require("../../../../helpers/cwd");
const getPendingBaseFeePerGas_1 = require("../../../../helpers/getPendingBaseFeePerGas");
const providers_1 = require("../../../../helpers/providers");
const retrieveForkBlockNumber_1 = require("../../../../helpers/retrieveForkBlockNumber");
const transactions_1 = require("../../../../helpers/transactions");
const node_1 = require("../../../../../../../src/internal/hardhat-network/provider/node");
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
            describe("eth_estimateGas", async function () {
                it("should estimate the gas for a transfer", async function () {
                    const estimation = await this.provider.send("eth_estimateGas", [
                        {
                            from: (0, ethereumjs_util_1.zeroAddress)(),
                            to: (0, ethereumjs_util_1.zeroAddress)(),
                        },
                    ]);
                    chai_1.assert.isTrue(new ethereumjs_util_1.BN((0, ethereumjs_util_1.toBuffer)(estimation)).lten(23000));
                });
                it("should leverage block tag parameter", async function () {
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
                    const result = await this.provider.send("eth_estimateGas", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                    ]);
                    const result2 = await this.provider.send("eth_estimateGas", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.isTrue(new ethereumjs_util_1.BN((0, ethereumjs_util_1.toBuffer)(result)).gt(new ethereumjs_util_1.BN((0, ethereumjs_util_1.toBuffer)(result2))));
                });
                it("should estimate gas in the context of pending block when called with 'pending' blockTag param", async function () {
                    const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000000a";
                    await this.provider.send("evm_setAutomine", [false]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    const result = await this.provider.send("eth_estimateGas", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                        "latest",
                    ]);
                    const result2 = await this.provider.send("eth_estimateGas", [
                        {
                            to: contractAddress,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                        "pending",
                    ]);
                    chai_1.assert.isTrue(new ethereumjs_util_1.BN((0, ethereumjs_util_1.toBuffer)(result)).gt(new ethereumjs_util_1.BN((0, ethereumjs_util_1.toBuffer)(result2))));
                });
                it("Should throw invalid input error if called in the context of a nonexistent block", async function () {
                    const firstBlock = await getFirstBlock();
                    const futureBlock = firstBlock + 1;
                    await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_estimateGas", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: (0, base_types_1.numberToRpcQuantity)(123),
                        },
                        (0, base_types_1.numberToRpcQuantity)(futureBlock),
                    ], `Received invalid block tag ${futureBlock}. Latest block number is ${firstBlock}`);
                });
                it("Should use pending as default blockTag", async function () {
                    if (isFork) {
                        this.skip();
                    }
                    const blockNumber = await this.provider.send("eth_blockNumber");
                    chai_1.assert.equal(blockNumber, "0x0");
                    // We estimate the deployment of a contract that asserts that block.number > 0,
                    // which would fail if the estimation was run on `latest` right after the network is initialized
                    const estimation = await this.provider.send("eth_estimateGas", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: "0x6080604052348015600f57600080fd5b5060004311601957fe5b603f8060266000396000f3fe6080604052600080fdfea2646970667358221220f77641956f2e98e8fd65e712d73442aba66a133641d08a3058907caec561bb2364736f6c63430007040033",
                        },
                    ]);
                    // We know that it should fit in 100k gas
                    chai_1.assert.isTrue(new ethereumjs_util_1.BN((0, ethereumjs_util_1.toBuffer)(estimation)).lten(100000));
                });
                describe("Fee price fields", function () {
                    describe("Running a hardfork with EIP-1559", function () {
                        it("Should validate that gasPrice and maxFeePerGas & maxPriorityFeePerGas are not mixed", async function () {
                            await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_estimateGas", [
                                {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    gasPrice: (0, base_types_1.numberToRpcQuantity)(1),
                                    maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(1),
                                },
                            ], "Cannot send both gasPrice and maxFeePerGas");
                            await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_estimateGas", [
                                {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    gasPrice: (0, base_types_1.numberToRpcQuantity)(1),
                                    maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(1),
                                },
                            ], "Cannot send both gasPrice and maxPriorityFeePerGas");
                        });
                        it("Should validate that maxFeePerGas >= maxPriorityFeePerGas", async function () {
                            await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_estimateGas", [
                                {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                    maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(1),
                                    maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(2),
                                },
                            ], "maxPriorityFeePerGas (2) is bigger than maxFeePerGas (1)");
                        });
                        describe("Default values", function () {
                            const ONE_GWEI = new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(9));
                            // TODO: We test an internal method here. We should improve this.
                            // Note: We don't need to test incompatible values (e.g. gasPrice and maxFeePerGas).
                            let spy;
                            beforeEach(function () {
                                spy = sinon_1.default.spy(node_1.HardhatNode.prototype, "_runTxAndRevertMutations");
                            });
                            afterEach(function () {
                                spy.restore();
                            });
                            it("Should use a gasPrice if provided", async function () {
                                const gasPrice = await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider);
                                await this.provider.send("eth_estimateGas", [
                                    {
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                        to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                        gasPrice: (0, base_types_1.numberToRpcQuantity)(gasPrice),
                                    },
                                ]);
                                const call = spy.getCall(0);
                                chai_1.assert.isDefined(call);
                                const firstArg = call.firstArg;
                                chai_1.assert.isTrue("gasPrice" in firstArg);
                                const tx = firstArg;
                                chai_1.assert.isTrue(tx.gasPrice.eq(gasPrice));
                            });
                            it("Should use the maxFeePerGas and maxPriorityFeePerGas if provided", async function () {
                                const maxFeePerGas = await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider);
                                await this.provider.send("eth_estimateGas", [
                                    {
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                        to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                        maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(maxFeePerGas),
                                        maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(maxFeePerGas.divn(2)),
                                    },
                                ]);
                                const call = spy.getCall(0);
                                chai_1.assert.isDefined(call);
                                const firstArg = call.firstArg;
                                chai_1.assert.isTrue("maxFeePerGas" in firstArg);
                                const tx = firstArg;
                                chai_1.assert.isTrue(tx.maxFeePerGas.eq(maxFeePerGas));
                                chai_1.assert.isTrue(tx.maxPriorityFeePerGas.eq(maxFeePerGas.divn(2)));
                            });
                            it("should use the default maxPriorityFeePerGas, 1gwei", async function () {
                                const maxFeePerGas = ethereumjs_util_1.BN.max(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider), ONE_GWEI.muln(10));
                                await this.provider.send("eth_estimateGas", [
                                    {
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                        to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                        maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(maxFeePerGas),
                                    },
                                ]);
                                const call = spy.getCall(0);
                                chai_1.assert.isDefined(call);
                                const firstArg = call.firstArg;
                                chai_1.assert.isTrue("maxFeePerGas" in firstArg);
                                const tx = firstArg;
                                chai_1.assert.isTrue(tx.maxFeePerGas.eq(maxFeePerGas));
                                chai_1.assert.isTrue(tx.maxPriorityFeePerGas.eq(ONE_GWEI), `expected to get a maxPriorityFeePerGas of ${ONE_GWEI.toString()}, but got ${tx.maxPriorityFeePerGas.toString()}`);
                            });
                            it("should cap the maxPriorityFeePerGas with maxFeePerGas", async function () {
                                await this.provider.send("hardhat_setNextBlockBaseFeePerGas", [
                                    "0x0",
                                ]);
                                await this.provider.send("eth_estimateGas", [
                                    {
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                        to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                        maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(123),
                                    },
                                ]);
                                const call = spy.getCall(0);
                                chai_1.assert.isDefined(call);
                                const firstArg = call.firstArg;
                                chai_1.assert.isTrue("maxFeePerGas" in firstArg);
                                const tx = firstArg;
                                chai_1.assert.isTrue(tx.maxFeePerGas.eqn(123));
                                chai_1.assert.isTrue(tx.maxPriorityFeePerGas.eqn(123));
                            });
                            it("should use twice the next block's base fee as default maxFeePerGas, plus the priority fee, when the blocktag is pending", async function () {
                                await this.provider.send("hardhat_setNextBlockBaseFeePerGas", [
                                    (0, base_types_1.numberToRpcQuantity)(10),
                                ]);
                                await this.provider.send("eth_estimateGas", [
                                    {
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                        to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                        maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(1),
                                    },
                                ]);
                                const call = spy.getCall(0);
                                chai_1.assert.isDefined(call);
                                const firstArg = call.firstArg;
                                chai_1.assert.isTrue("maxFeePerGas" in firstArg);
                                const tx = firstArg;
                                chai_1.assert.isTrue(tx.maxFeePerGas.eqn(21));
                                chai_1.assert.isTrue(tx.maxPriorityFeePerGas.eqn(1));
                            });
                            it("should use the block's base fee per gas as maxFeePerGas, plus the priority fee, when estimating in a past block", async function () {
                                const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                                await this.provider.send("eth_estimateGas", [
                                    {
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                        to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                        maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(1),
                                    },
                                    "latest",
                                ]);
                                const call = spy.getCall(0);
                                chai_1.assert.isDefined(call);
                                const firstArg = call.firstArg;
                                chai_1.assert.isTrue("maxFeePerGas" in firstArg);
                                const tx = firstArg;
                                chai_1.assert.isTrue(tx.maxFeePerGas.eq((0, base_types_1.rpcQuantityToBN)(block.baseFeePerGas).addn(1)));
                                chai_1.assert.isTrue(tx.maxPriorityFeePerGas.eqn(1));
                            });
                        });
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=estimateGas.js.map