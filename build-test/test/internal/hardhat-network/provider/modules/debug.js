"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const lodash_1 = __importDefault(require("lodash"));
const default_config_1 = require("../../../../../src/internal/core/config/default-config");
const backwards_compatibility_1 = require("../../../../../src/internal/core/providers/backwards-compatibility");
const logger_1 = require("../../../../../src/internal/hardhat-network/provider/modules/logger");
const provider_1 = require("../../../../../src/internal/hardhat-network/provider/provider");
const mainnetReturnsDataTrace_1 = require("../../../../fixture-debug-traces/mainnetReturnsDataTrace");
const mainnetReturnsDataTraceGeth_1 = require("../../../../fixture-debug-traces/mainnetReturnsDataTraceGeth");
const mainnetRevertTrace_1 = require("../../../../fixture-debug-traces/mainnetRevertTrace");
const modifiesStateTrace_1 = require("../../../../fixture-debug-traces/modifiesStateTrace");
const setup_1 = require("../../../../setup");
const assertions_1 = require("../../helpers/assertions");
const constants_1 = require("../../helpers/constants");
const contracts_1 = require("../../helpers/contracts");
const cwd_1 = require("../../helpers/cwd");
const providers_1 = require("../../helpers/providers");
const sendDummyTransaction_1 = require("../../helpers/sendDummyTransaction");
const transactions_1 = require("../../helpers/transactions");
const assertEqualTraces_1 = require("../utils/assertEqualTraces");
describe("Debug module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider }) => {
        describe(`${name} provider`, function () {
            (0, cwd_1.setCWD)();
            useProvider();
            describe("debug_traceTransaction", function () {
                it("Should throw for unknown txs", async function () {
                    const unknownTxHash = "0x1234567876543234567876543456765434567aeaeaed67616732632762762373";
                    await (0, assertions_1.assertInvalidInputError)(this.provider, "debug_traceTransaction", [unknownTxHash], `Unable to find a block containing transaction ${unknownTxHash}`);
                });
                it("Should return the right values for successful value transfer txs", async function () {
                    const txHash = await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 0, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    });
                    const trace = await this.provider.send("debug_traceTransaction", [txHash]);
                    chai_1.assert.deepEqual(trace, {
                        gas: 21000,
                        failed: false,
                        returnValue: "",
                        structLogs: [],
                    });
                });
                it("Should return the right values for fake sender txs", async function () {
                    const impersonatedAddress = "0xC014BA5EC014ba5ec014Ba5EC014ba5Ec014bA5E";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: impersonatedAddress,
                            value: "0x100",
                        },
                    ]);
                    await this.provider.send("hardhat_impersonateAccount", [
                        impersonatedAddress,
                    ]);
                    const txHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: impersonatedAddress,
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        },
                    ]);
                    const trace = await this.provider.send("debug_traceTransaction", [txHash]);
                    chai_1.assert.deepEqual(trace, {
                        gas: 21000,
                        failed: false,
                        returnValue: "",
                        structLogs: [],
                    });
                });
                it("Should return the right values for successful contract tx", async function () {
                    const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]);
                    const txHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: contractAddress,
                            data: `${contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState}000000000000000000000000000000000000000000000000000000000000000a`,
                        },
                    ]);
                    const trace = await this.provider.send("debug_traceTransaction", [txHash]);
                    (0, assertEqualTraces_1.assertEqualTraces)(trace, modifiesStateTrace_1.trace);
                });
                describe("berlin", function () {
                    useProvider({ hardfork: "berlin" });
                    it("Should work with EIP-2930 txs", async function () {
                        const txHash = await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 0, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            accessList: [
                                {
                                    address: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    storageKeys: [],
                                },
                            ],
                            gas: 25000,
                        });
                        const trace = await this.provider.send("debug_traceTransaction", [txHash]);
                        chai_1.assert.deepEqual(trace, {
                            gas: 23400,
                            failed: false,
                            returnValue: "",
                            structLogs: [],
                        });
                    });
                });
            });
        });
    });
    describe("fork tests", function () {
        this.timeout(240000);
        let provider;
        beforeEach(function () {
            if (setup_1.ALCHEMY_URL === undefined) {
                this.skip();
            }
            const forkConfig = {
                jsonRpcUrl: setup_1.ALCHEMY_URL,
                blockNumber: 11954000,
            };
            const logger = new logger_1.ModulesLogger(false);
            const hardhatNetworkProvider = new provider_1.HardhatNetworkProvider(providers_1.DEFAULT_HARDFORK, providers_1.DEFAULT_NETWORK_NAME, providers_1.DEFAULT_CHAIN_ID, providers_1.DEFAULT_NETWORK_ID, 13000000, undefined, new ethereumjs_util_1.BN(0), true, true, false, // mining.auto
            0, // mining.interval
            "priority", // mining.mempool.order
            default_config_1.defaultHardhatNetworkParams.chains, logger, providers_1.DEFAULT_ACCOUNTS, undefined, providers_1.DEFAULT_ALLOW_UNLIMITED_CONTRACT_SIZE, undefined, undefined, forkConfig, constants_1.FORK_TESTS_CACHE_PATH);
            provider = new backwards_compatibility_1.BackwardsCompatibilityProviderAdapter(hardhatNetworkProvider);
        });
        it("Should return the right values for a successful tx", async function () {
            const trace = await provider.send("debug_traceTransaction", ["0x89ebeb319fcd7bda9c7f8c1b78a7571842a705425b175f24f34fe8e6c60580d4"]);
            (0, assertEqualTraces_1.assertEqualTraces)(trace, mainnetReturnsDataTrace_1.trace);
            (0, assertEqualTraces_1.assertEqualTraces)(trace, mainnetReturnsDataTraceGeth_1.trace);
        });
        it("Should return the right values for a reverted tx", async function () {
            const trace = await provider.send("debug_traceTransaction", ["0x6214b912cc9916d8b7bf5f4ff876e259f5f3754ddebb6df8c8e897cad31ae148"]);
            (0, assertEqualTraces_1.assertEqualTraces)(trace, mainnetRevertTrace_1.trace);
        });
        it("Should respect the disableMemory option", async function () {
            const trace = await provider.send("debug_traceTransaction", [
                "0x6214b912cc9916d8b7bf5f4ff876e259f5f3754ddebb6df8c8e897cad31ae148",
                {
                    disableMemory: true,
                },
            ]);
            const structLogs = mainnetRevertTrace_1.trace.structLogs.map((x) => lodash_1.default.omit(x, "memory"));
            (0, assertEqualTraces_1.assertEqualTraces)(trace, Object.assign(Object.assign({}, mainnetRevertTrace_1.trace), { structLogs }));
        });
        it("Should respect the disableStack option", async function () {
            const trace = await provider.send("debug_traceTransaction", [
                "0x6214b912cc9916d8b7bf5f4ff876e259f5f3754ddebb6df8c8e897cad31ae148",
                {
                    disableStack: true,
                },
            ]);
            const structLogs = mainnetRevertTrace_1.trace.structLogs.map((x) => lodash_1.default.omit(x, "stack"));
            (0, assertEqualTraces_1.assertEqualTraces)(trace, Object.assign(Object.assign({}, mainnetRevertTrace_1.trace), { structLogs }));
        });
        it("Should respect the disableStorage option", async function () {
            const trace = await provider.send("debug_traceTransaction", [
                "0x6214b912cc9916d8b7bf5f4ff876e259f5f3754ddebb6df8c8e897cad31ae148",
                {
                    disableStorage: true,
                },
            ]);
            const structLogs = mainnetRevertTrace_1.trace.structLogs.map((x) => lodash_1.default.omit(x, "storage"));
            (0, assertEqualTraces_1.assertEqualTraces)(trace, Object.assign(Object.assign({}, mainnetRevertTrace_1.trace), { structLogs }));
        });
    });
});
//# sourceMappingURL=debug.js.map