"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const default_config_1 = require("../../../../src/internal/core/config/default-config");
const base_types_1 = require("../../../../src/internal/core/jsonrpc/types/base-types");
const gas_providers_1 = require("../../../../src/internal/core/providers/gas-providers");
const mocks_1 = require("./mocks");
describe("AutomaticGasProvider", () => {
    const FIXED_GAS_LIMIT = 1231;
    const GAS_MULTIPLIER = 1.337;
    let mockedProvider;
    let provider;
    beforeEach(() => {
        mockedProvider = new mocks_1.MockedProvider();
        mockedProvider.setReturnValue("eth_getBlockByNumber", {
            gasLimit: (0, base_types_1.numberToRpcQuantity)(FIXED_GAS_LIMIT * 1000),
        });
        mockedProvider.setReturnValue("eth_estimateGas", (0, base_types_1.numberToRpcQuantity)(FIXED_GAS_LIMIT));
        provider = new gas_providers_1.AutomaticGasProvider(mockedProvider, GAS_MULTIPLIER);
    });
    it("Should estimate gas automatically if not present", async () => {
        await provider.request({
            method: "eth_sendTransaction",
            params: [
                {
                    from: "0x0000000000000000000000000000000000000011",
                    to: "0x0000000000000000000000000000000000000011",
                    value: 1,
                },
            ],
        });
        const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
        chai_1.assert.equal(tx.gas, Math.floor(FIXED_GAS_LIMIT * GAS_MULTIPLIER));
    });
    it("Should support different gas multipliers", async () => {
        const GAS_MULTIPLIER2 = 123;
        provider = new gas_providers_1.AutomaticGasProvider(mockedProvider, GAS_MULTIPLIER2);
        await provider.request({
            method: "eth_sendTransaction",
            params: [
                {
                    from: "0x0000000000000000000000000000000000000011",
                    to: "0x0000000000000000000000000000000000000011",
                    value: 1,
                },
            ],
        });
        const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
        chai_1.assert.equal(tx.gas, Math.floor(FIXED_GAS_LIMIT * GAS_MULTIPLIER2));
    });
    it("Should have a default multiplier", async () => {
        provider = new gas_providers_1.AutomaticGasProvider(mockedProvider);
        await provider.request({
            method: "eth_sendTransaction",
            params: [
                {
                    from: "0x0000000000000000000000000000000000000011",
                    to: "0x0000000000000000000000000000000000000011",
                    value: 1,
                },
            ],
        });
        const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
        chai_1.assert.equal((0, base_types_1.rpcQuantityToNumber)(tx.gas), FIXED_GAS_LIMIT * default_config_1.DEFAULT_GAS_MULTIPLIER);
    });
    it("Shouldn't replace the provided gas", async () => {
        await provider.request({
            method: "eth_sendTransaction",
            params: [
                {
                    from: "0x0000000000000000000000000000000000000011",
                    to: "0x0000000000000000000000000000000000000011",
                    value: 1,
                    gas: 567,
                },
            ],
        });
        const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
        chai_1.assert.equal(tx.gas, 567);
    });
    it("Should forward the other calls", async () => {
        const input = [1, 2, 3];
        await provider.request({ method: "A", params: input });
        const params = mockedProvider.getLatestParams("A");
        chai_1.assert.deepEqual(params, input);
    });
});
describe("AutomaticGasPriceProvider", () => {
    const FIXED_GAS_PRICE = 1232;
    let provider;
    let mockedProvider;
    beforeEach(() => {
        mockedProvider = new mocks_1.MockedProvider();
        mockedProvider.setReturnValue("eth_gasPrice", (0, base_types_1.numberToRpcQuantity)(FIXED_GAS_PRICE));
        provider = new gas_providers_1.AutomaticGasPriceProvider(mockedProvider);
    });
    describe("When the fee price values are provided", function () {
        it("Shouldn't replace the provided gasPrice", async () => {
            await provider.request({
                method: "eth_sendTransaction",
                params: [
                    {
                        from: "0x0000000000000000000000000000000000000011",
                        to: "0x0000000000000000000000000000000000000011",
                        value: 1,
                        gasPrice: 456,
                    },
                ],
            });
            const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
            chai_1.assert.equal(tx.gasPrice, 456);
        });
        it("Shouldn't replace the provided maxFeePerGas and maxPriorityFeePerGas values", async () => {
            await provider.request({
                method: "eth_sendTransaction",
                params: [
                    {
                        from: "0x0000000000000000000000000000000000000011",
                        to: "0x0000000000000000000000000000000000000011",
                        value: 1,
                        maxFeePerGas: 456,
                        maxPriorityFeePerGas: 789,
                    },
                ],
            });
            const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
            chai_1.assert.equal(tx.maxFeePerGas, 456);
            chai_1.assert.equal(tx.maxPriorityFeePerGas, 789);
        });
    });
    describe("Default fee price values", function () {
        describe("When eth_feeHistory is available and EIP1559 is supported", function () {
            const latestBaseFeeInMockedProvider = 80;
            beforeEach(function () {
                mockedProvider.setReturnValue("eth_feeHistory", {
                    baseFeePerGas: [
                        (0, base_types_1.numberToRpcQuantity)(latestBaseFeeInMockedProvider),
                        (0, base_types_1.numberToRpcQuantity)(Math.floor((latestBaseFeeInMockedProvider * 9) / 8)),
                    ],
                    reward: [["0x4"]],
                });
                mockedProvider.setReturnValue("eth_getBlockByNumber", {
                    baseFeePerGas: "0x1",
                });
            });
            it("should use the reward return value as default maxPriorityFeePerGas", async function () {
                await provider.request({
                    method: "eth_sendTransaction",
                    params: [
                        {
                            from: "0x0000000000000000000000000000000000000011",
                            to: "0x0000000000000000000000000000000000000011",
                            value: 1,
                            maxFeePerGas: "0x99",
                        },
                    ],
                });
                const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
                chai_1.assert.equal(tx.maxPriorityFeePerGas, "0x4");
                chai_1.assert.equal(tx.maxFeePerGas, "0x99");
            });
            it("Should add the reward to the maxFeePerGas if not big enough", async function () {
                await provider.request({
                    method: "eth_sendTransaction",
                    params: [
                        {
                            from: "0x0000000000000000000000000000000000000011",
                            to: "0x0000000000000000000000000000000000000011",
                            value: 1,
                            maxFeePerGas: "0x1",
                        },
                    ],
                });
                const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
                chai_1.assert.equal(tx.maxPriorityFeePerGas, "0x4");
                chai_1.assert.equal(tx.maxFeePerGas, "0x5");
            });
            it("Should use the expected max base fee of N blocks in the future if maxFeePerGas is missing", async function () {
                await provider.request({
                    method: "eth_sendTransaction",
                    params: [
                        {
                            from: "0x0000000000000000000000000000000000000011",
                            to: "0x0000000000000000000000000000000000000011",
                            value: 1,
                            maxPriorityFeePerGas: "0x1",
                        },
                    ],
                });
                const expectedBaseFee = Math.floor(latestBaseFeeInMockedProvider *
                    (9 / 8) **
                        gas_providers_1.AutomaticGasPriceProvider.EIP1559_BASE_FEE_MAX_FULL_BLOCKS_PREFERENCE);
                const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
                chai_1.assert.equal(tx.maxPriorityFeePerGas, "0x1");
                chai_1.assert.equal(tx.maxFeePerGas, (0, base_types_1.numberToRpcQuantity)(expectedBaseFee));
            });
        });
        describe("When eth_feeHistory is available and EIP1559 is not supported", function () {
            const latestBaseFeeInMockedProvider = 80;
            beforeEach(function () {
                mockedProvider.setReturnValue("eth_feeHistory", {
                    baseFeePerGas: [
                        (0, base_types_1.numberToRpcQuantity)(latestBaseFeeInMockedProvider),
                        (0, base_types_1.numberToRpcQuantity)(Math.floor((latestBaseFeeInMockedProvider * 9) / 8)),
                    ],
                    reward: [["0x4"]],
                });
                mockedProvider.setReturnValue("eth_getBlockByNumber", {});
            });
            runTestUseLegacyGasPrice();
        });
        describe("When eth_feeHistory is not available", function () {
            beforeEach(function () {
                mockedProvider.setReturnValue("eth_getBlockByNumber", {});
            });
            runTestUseLegacyGasPrice();
        });
        /**
         * Group of tests that expect gasPrice to be used instead of EIP1559 fields
         */
        function runTestUseLegacyGasPrice() {
            it("Should use gasPrice when nothing is provided", async function () {
                await provider.request({
                    method: "eth_sendTransaction",
                    params: [
                        {
                            from: "0x0000000000000000000000000000000000000011",
                            to: "0x0000000000000000000000000000000000000011",
                            value: 1,
                        },
                    ],
                });
                const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
                chai_1.assert.equal(tx.gasPrice, FIXED_GAS_PRICE);
            });
            it("Should use gasPrice as default maxPriorityFeePerGas, adding it to maxFeePerGas if necessary", async function () {
                await provider.request({
                    method: "eth_sendTransaction",
                    params: [
                        {
                            from: "0x0000000000000000000000000000000000000011",
                            to: "0x0000000000000000000000000000000000000011",
                            value: 1,
                            maxFeePerGas: "0x1",
                        },
                    ],
                });
                const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
                chai_1.assert.equal(tx.maxPriorityFeePerGas, (0, base_types_1.numberToRpcQuantity)(FIXED_GAS_PRICE));
                chai_1.assert.equal(tx.maxFeePerGas, (0, base_types_1.numberToRpcQuantity)(FIXED_GAS_PRICE + 1));
            });
            it("Should use gasPrice as default maxFeePerGas, fixing maxPriorityFee to it if necessary", async function () {
                await provider.request({
                    method: "eth_sendTransaction",
                    params: [
                        {
                            from: "0x0000000000000000000000000000000000000011",
                            to: "0x0000000000000000000000000000000000000011",
                            value: 1,
                            maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(FIXED_GAS_PRICE + 2),
                        },
                    ],
                });
                const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
                chai_1.assert.equal(tx.maxPriorityFeePerGas, (0, base_types_1.numberToRpcQuantity)(FIXED_GAS_PRICE + 2));
                chai_1.assert.equal(tx.maxFeePerGas, (0, base_types_1.numberToRpcQuantity)(FIXED_GAS_PRICE * 2 + 2));
            });
        }
    });
    it("Should forward the other calls", async () => {
        const input = [1, 2, 3, 4];
        await provider.request({ method: "A", params: input });
        const params = mockedProvider.getLatestParams("A");
        chai_1.assert.deepEqual(params, input);
    });
});
describe("FixedGasProvider", () => {
    const FIXED_GAS_LIMIT = 1233;
    let mockedProvider;
    let provider;
    const MOCKED_GAS_ESTIMATION_VALUE = {};
    beforeEach(() => {
        mockedProvider = new mocks_1.MockedProvider();
        mockedProvider.setReturnValue("eth_estimateGas", MOCKED_GAS_ESTIMATION_VALUE);
        provider = new gas_providers_1.FixedGasProvider(mockedProvider, FIXED_GAS_LIMIT);
    });
    it("Should set the fixed gas if not present", async () => {
        await provider.request({
            method: "eth_sendTransaction",
            params: [
                {
                    from: "0x0000000000000000000000000000000000000011",
                    to: "0x0000000000000000000000000000000000000011",
                    value: 1,
                },
            ],
        });
        const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
        chai_1.assert.equal(tx.gas, FIXED_GAS_LIMIT);
    });
    it("Shouldn't replace the provided gas", async () => {
        await provider.request({
            method: "eth_sendTransaction",
            params: [
                {
                    from: "0x0000000000000000000000000000000000000011",
                    to: "0x0000000000000000000000000000000000000011",
                    value: 1,
                    gas: 1456,
                },
            ],
        });
        const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
        chai_1.assert.equal(tx.gas, 1456);
    });
    it("Should forward direct calls to eth_estimateGas", async () => {
        const estimated = await provider.request({
            method: "eth_estimateGas",
            params: [
                {
                    from: "0x0000000000000000000000000000000000000011",
                    to: "0x0000000000000000000000000000000000000011",
                    value: 1,
                    gas: 1456123,
                },
            ],
        });
        chai_1.assert.equal(estimated, MOCKED_GAS_ESTIMATION_VALUE);
    });
    it("Should forward the other calls", async () => {
        const input = [1, 2, 3, 4, 5];
        await provider.request({ method: "A", params: input });
        const params = mockedProvider.getLatestParams("A");
        chai_1.assert.deepEqual(params, input);
    });
});
describe("FixedGasPriceProvider", () => {
    const FIXED_GAS_PRICE = 1234;
    let mockedProvider;
    let provider;
    const MOCKED_GAS_PRICE_VALUE = {};
    beforeEach(() => {
        mockedProvider = new mocks_1.MockedProvider();
        mockedProvider.setReturnValue("eth_gasPrice", MOCKED_GAS_PRICE_VALUE);
        provider = new gas_providers_1.FixedGasPriceProvider(mockedProvider, FIXED_GAS_PRICE);
    });
    it("Should set the fixed gasPrice if not present", async () => {
        await provider.request({
            method: "eth_sendTransaction",
            params: [
                {
                    from: "0x0000000000000000000000000000000000000011",
                    to: "0x0000000000000000000000000000000000000011",
                    value: 1,
                },
            ],
        });
        const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
        chai_1.assert.equal(tx.gasPrice, FIXED_GAS_PRICE);
    });
    it("Shouldn't replace the provided gasPrice", async () => {
        await provider.request({
            method: "eth_sendTransaction",
            params: [
                {
                    from: "0x0000000000000000000000000000000000000011",
                    to: "0x0000000000000000000000000000000000000011",
                    value: 1,
                    gasPrice: 14567,
                },
            ],
        });
        const [tx] = mockedProvider.getLatestParams("eth_sendTransaction");
        chai_1.assert.equal(tx.gasPrice, 14567);
    });
    it("Should forward direct calls to eth_gasPrice", async () => {
        const price = await provider.request({ method: "eth_gasPrice" });
        chai_1.assert.equal(price, MOCKED_GAS_PRICE_VALUE);
    });
    it("Should forward the other calls", async () => {
        const input = [1, 2, 3, 4, 5, 6];
        await provider.request({ method: "A", params: input });
        const params = mockedProvider.getLatestParams("A");
        chai_1.assert.deepEqual(params, input);
    });
});
describe("GanacheGasMultiplierProvider", () => {
    it("Should multiply the gas if connected to Ganache", async () => {
        const mockedProvider = new mocks_1.MockedProvider();
        mockedProvider.setReturnValue("eth_estimateGas", (0, base_types_1.numberToRpcQuantity)(123));
        mockedProvider.setReturnValue("web3_clientVersion", "EthereumJS TestRPC/v2.5.5/ethereum-js");
        mockedProvider.setReturnValue("eth_getBlockByNumber", {
            gasLimit: (0, base_types_1.numberToRpcQuantity)(12300000),
        });
        const wrapped = new gas_providers_1.GanacheGasMultiplierProvider(mockedProvider);
        const estimation = (await wrapped.request({
            method: "eth_estimateGas",
            params: [
                {
                    from: "0x0000000000000000000000000000000000000011",
                    to: "0x0000000000000000000000000000000000000011",
                    value: 1,
                },
            ],
        }));
        const gas = (0, base_types_1.rpcQuantityToNumber)(estimation);
        chai_1.assert.equal(gas, Math.floor(123 * gas_providers_1.GANACHE_GAS_MULTIPLIER));
    });
    it("Should not multiply the gas if connected to other node", async () => {
        const mockedProvider = new mocks_1.MockedProvider();
        mockedProvider.setReturnValue("eth_estimateGas", (0, base_types_1.numberToRpcQuantity)(123));
        mockedProvider.setReturnValue("web3_clientVersion", "Parity-Ethereum//v2.5.1-beta-e0141f8-20190510/x86_64-linux-gnu/rustc1.34.1");
        mockedProvider.setReturnValue("eth_getBlockByNumber", {
            gasLimit: (0, base_types_1.numberToRpcQuantity)(12300000),
        });
        const wrapped = new gas_providers_1.GanacheGasMultiplierProvider(mockedProvider);
        const estimation = (await wrapped.request({
            method: "eth_estimateGas",
            params: [
                {
                    from: "0x0000000000000000000000000000000000000011",
                    to: "0x0000000000000000000000000000000000000011",
                    value: 1,
                },
            ],
        }));
        const gas = (0, base_types_1.rpcQuantityToNumber)(estimation);
        chai_1.assert.equal(gas, 123);
    });
});
//# sourceMappingURL=gas-providers.js.map