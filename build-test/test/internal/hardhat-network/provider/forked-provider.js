"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const base_types_1 = require("../../../../src/internal/core/jsonrpc/types/base-types");
const errors_1 = require("../../../../src/internal/core/providers/errors");
const setup_1 = require("../../../setup");
const workaround_windows_ci_failures_1 = require("../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../helpers/assertions");
const constants_1 = require("../helpers/constants");
const contracts_1 = require("../helpers/contracts");
const cwd_1 = require("../helpers/cwd");
const hexStripZeros_1 = require("../helpers/hexStripZeros");
const leftPad32_1 = require("../helpers/leftPad32");
const providers_1 = require("../helpers/providers");
const retrieveForkBlockNumber_1 = require("../helpers/retrieveForkBlockNumber");
const transactions_1 = require("../helpers/transactions");
const WETH_DEPOSIT_SELECTOR = "0xd0e30db0";
describe("Forked provider", function () {
    providers_1.FORKED_PROVIDERS.forEach(({ rpcProvider, useProvider }) => {
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork: true });
        describe(`Using ${rpcProvider}`, function () {
            (0, cwd_1.setCWD)();
            useProvider();
            const getForkBlockNumber = async () => (0, retrieveForkBlockNumber_1.retrieveForkBlockNumber)(this.ctx.hardhatNetworkProvider);
            let gasPrice;
            beforeEach(async function () {
                gasPrice = await this.provider.send("eth_gasPrice");
            });
            describe("eth_blockNumber", () => {
                it("returns the current block number", async function () {
                    const blockNumber = await this.provider.send("eth_blockNumber");
                    const minBlockNumber = 10494745; // mainnet block number at 20.07.2020
                    chai_1.assert.isAtLeast((0, base_types_1.rpcQuantityToNumber)(blockNumber), minBlockNumber);
                });
            });
            describe("eth_call", function () {
                it("can get DAI total supply", async function () {
                    const daiTotalSupplySelector = "0x18160ddd";
                    const result = await this.provider.send("eth_call", [
                        { to: constants_1.DAI_ADDRESS.toString(), data: daiTotalSupplySelector },
                    ]);
                    const bnResult = new ethereumjs_util_1.BN((0, ethereumjs_util_1.toBuffer)(result));
                    chai_1.assert.isTrue(bnResult.gtn(0));
                });
                describe("when used in the context of a past block", () => {
                    describe("when the block number is greater than the fork block number", () => {
                        it("does not affect previously added data", async function () {
                            const forkBlockNumber = await getForkBlockNumber();
                            const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                            const firstState = (0, leftPad32_1.leftPad32)("0xdeadbeef");
                            await this.provider.send("eth_sendTransaction", [
                                {
                                    to: contractAddress,
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + firstState,
                                },
                            ]);
                            const temporaryState = (0, leftPad32_1.leftPad32)("0xfeedface");
                            await this.provider.send("eth_call", [
                                {
                                    to: contractAddress,
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + temporaryState,
                                },
                                (0, base_types_1.numberToRpcQuantity)(forkBlockNumber + 1),
                            ]);
                            chai_1.assert.equal(await this.provider.send("eth_call", [
                                {
                                    to: contractAddress,
                                    data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                },
                                "latest",
                            ]), `0x${firstState}`);
                        });
                    });
                    describe("when the block number is less or equal to the fork block number", () => {
                        it("does not affect previously added storage data", async function () {
                            const forkBlockNumber = await getForkBlockNumber();
                            await this.provider.send("hardhat_impersonateAccount", [
                                constants_1.BITFINEX_WALLET_ADDRESS.toString(),
                            ]);
                            const getWrappedBalance = async () => {
                                const balanceOfSelector = `0x70a08231${(0, leftPad32_1.leftPad32)(constants_1.BITFINEX_WALLET_ADDRESS.toString())}`;
                                return (0, base_types_1.rpcDataToBN)(await this.provider.send("eth_call", [
                                    { to: constants_1.WETH_ADDRESS.toString(), data: balanceOfSelector },
                                ])).toString();
                            };
                            await this.provider.send("eth_sendTransaction", [
                                {
                                    from: constants_1.BITFINEX_WALLET_ADDRESS.toString(),
                                    to: constants_1.WETH_ADDRESS.toString(),
                                    data: WETH_DEPOSIT_SELECTOR,
                                    value: (0, base_types_1.numberToRpcQuantity)(123),
                                    gas: (0, base_types_1.numberToRpcQuantity)(50000),
                                    maxFeePerGas: gasPrice,
                                },
                            ]);
                            const balance = await getWrappedBalance();
                            await this.provider.send("eth_call", [
                                {
                                    from: constants_1.BITFINEX_WALLET_ADDRESS.toString(),
                                    to: constants_1.WETH_ADDRESS.toString(),
                                    data: WETH_DEPOSIT_SELECTOR,
                                    value: (0, base_types_1.numberToRpcQuantity)(321),
                                },
                                (0, base_types_1.numberToRpcQuantity)(forkBlockNumber - 3),
                            ]);
                            chai_1.assert.equal(await getWrappedBalance(), balance);
                        });
                        it("does not affect previously added balance data", async function () {
                            const forkBlockNumber = await getForkBlockNumber();
                            await this.provider.send("hardhat_impersonateAccount", [
                                constants_1.BITFINEX_WALLET_ADDRESS.toString(),
                            ]);
                            await this.provider.send("eth_sendTransaction", [
                                {
                                    from: constants_1.BITFINEX_WALLET_ADDRESS.toString(),
                                    to: constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                                    value: (0, base_types_1.numberToRpcQuantity)(123),
                                    gas: (0, base_types_1.numberToRpcQuantity)(21000),
                                    maxFeePerGas: gasPrice,
                                },
                            ]);
                            await this.provider.send("eth_call", [
                                {
                                    from: constants_1.BITFINEX_WALLET_ADDRESS.toString(),
                                    to: constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                                    value: (0, base_types_1.numberToRpcQuantity)(321),
                                },
                                (0, base_types_1.numberToRpcQuantity)(forkBlockNumber - 1),
                            ]);
                            const balance = await this.provider.send("eth_getBalance", [
                                constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                            ]);
                            chai_1.assert.equal((0, base_types_1.rpcQuantityToNumber)(balance), 123);
                        });
                    });
                });
            });
            describe("eth_getBalance", function () {
                it("can get the balance of the WETH contract", async function () {
                    const result = await this.provider.send("eth_getBalance", [
                        constants_1.WETH_ADDRESS.toString(),
                    ]);
                    chai_1.assert.isTrue((0, base_types_1.rpcQuantityToBN)(result).gtn(0));
                });
            });
            describe("eth_sendTransaction", () => {
                it("supports Ether transfers to remote accounts", async function () {
                    const result = await this.provider.send("eth_getBalance", [
                        constants_1.BITFINEX_WALLET_ADDRESS.toString(),
                    ]);
                    const initialBalance = (0, base_types_1.rpcQuantityToBN)(result);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: constants_1.BITFINEX_WALLET_ADDRESS.toString(),
                            value: (0, base_types_1.numberToRpcQuantity)(100),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            maxFeePerGas: gasPrice,
                        },
                    ]);
                    const balance = await this.provider.send("eth_getBalance", [
                        constants_1.BITFINEX_WALLET_ADDRESS.toString(),
                    ]);
                    (0, assertions_1.assertQuantity)(balance, initialBalance.addn(100));
                });
                it("supports wrapping of Ether", async function () {
                    const wethBalanceOfSelector = `0x70a08231${(0, leftPad32_1.leftPad32)(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0])}`;
                    const getWrappedBalance = async () => (0, base_types_1.rpcDataToBN)(await this.provider.send("eth_call", [
                        { to: constants_1.WETH_ADDRESS.toString(), data: wethBalanceOfSelector },
                    ]));
                    const initialBalance = await getWrappedBalance();
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: constants_1.WETH_ADDRESS.toString(),
                            data: WETH_DEPOSIT_SELECTOR,
                            value: (0, base_types_1.numberToRpcQuantity)(100),
                            gas: (0, base_types_1.numberToRpcQuantity)(50000),
                            maxFeePerGas: gasPrice,
                        },
                    ]);
                    const balance = await getWrappedBalance();
                    chai_1.assert.equal(balance.toString("hex"), initialBalance.addn(100).toString("hex"));
                });
            });
            describe("eth_getTransactionByHash", () => {
                it("supports local transactions", async function () {
                    const transactionHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            maxFeePerGas: gasPrice,
                        },
                    ]);
                    const transaction = await this.provider.send("eth_getTransactionByHash", [transactionHash]);
                    chai_1.assert.equal(transaction.from, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0]);
                    chai_1.assert.equal(transaction.to, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]);
                    chai_1.assert.equal(transaction.value, (0, base_types_1.numberToRpcQuantity)(1));
                    chai_1.assert.equal(transaction.gas, (0, base_types_1.numberToRpcQuantity)(21000));
                    chai_1.assert.equal(transaction.maxFeePerGas, gasPrice);
                });
                it("supports remote transactions", async function () {
                    const transaction = await this.provider.send("eth_getTransactionByHash", [(0, ethereumjs_util_1.bufferToHex)(constants_1.FIRST_TX_HASH_OF_10496585)]);
                    chai_1.assert.equal(transaction.from, "0x4e87582f5e48f3e505b7d3b544972399ad9f2e5f");
                    chai_1.assert.equal(transaction.to, "0xdac17f958d2ee523a2206206994597c13d831ec7");
                });
            });
            describe("eth_getTransactionCount", () => {
                it("should have a non-zero nonce for the first unlocked account", async function () {
                    // this test works because the first unlocked accounts used by these
                    // tests happen to have transactions in mainnet
                    const [account] = await this.provider.send("eth_accounts");
                    const transactionCount = await this.provider.send("eth_getTransactionCount", [account]);
                    chai_1.assert.isTrue((0, base_types_1.rpcQuantityToBN)(transactionCount).gtn(0));
                });
            });
            describe("eth_getTransactionReceipt", () => {
                it("supports local transactions", async function () {
                    const transactionHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            maxFeePerGas: gasPrice,
                        },
                    ]);
                    const receipt = await this.provider.send("eth_getTransactionReceipt", [transactionHash]);
                    chai_1.assert.equal(receipt.from, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0]);
                    chai_1.assert.equal(receipt.to, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]);
                    chai_1.assert.equal(receipt.gasUsed, (0, base_types_1.numberToRpcQuantity)(21000));
                });
                it("supports remote transactions", async function () {
                    const receipt = await this.provider.send("eth_getTransactionReceipt", [(0, ethereumjs_util_1.bufferToHex)(constants_1.FIRST_TX_HASH_OF_10496585)]);
                    chai_1.assert.equal(receipt.from, "0x4e87582f5e48f3e505b7d3b544972399ad9f2e5f");
                    chai_1.assert.equal(receipt.to, "0xdac17f958d2ee523a2206206994597c13d831ec7");
                });
            });
            describe("eth_getLogs", () => {
                it("can get remote logs", async function () {
                    const logs = await this.provider.send("eth_getLogs", [
                        {
                            fromBlock: (0, base_types_1.numberToRpcQuantity)(constants_1.BLOCK_NUMBER_OF_10496585),
                            toBlock: (0, base_types_1.numberToRpcQuantity)(constants_1.BLOCK_NUMBER_OF_10496585),
                        },
                    ]);
                    chai_1.assert.equal(logs.length, 205);
                });
            });
            describe("evm_revert", () => {
                it("can revert the state of WETH contract to a previous snapshot", async function () {
                    const getWethBalance = async () => this.provider.send("eth_getBalance", [constants_1.WETH_ADDRESS.toString()]);
                    const initialBalance = await getWethBalance();
                    const snapshotId = await this.provider.send("evm_snapshot", []);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: constants_1.WETH_ADDRESS.toString(),
                            data: WETH_DEPOSIT_SELECTOR,
                            value: (0, base_types_1.numberToRpcQuantity)(100),
                            gas: (0, base_types_1.numberToRpcQuantity)(50000),
                            maxFeePerGas: gasPrice,
                        },
                    ]);
                    chai_1.assert.notEqual(await getWethBalance(), initialBalance);
                    const reverted = await this.provider.send("evm_revert", [snapshotId]);
                    chai_1.assert.isTrue(reverted);
                    chai_1.assert.equal(await getWethBalance(), initialBalance);
                });
            });
            describe("hardhat_impersonateAccount", () => {
                const oneEtherQuantity = (0, base_types_1.numberToRpcQuantity)(new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)));
                it("allows to impersonate a remote EOA", async function () {
                    await this.provider.send("hardhat_impersonateAccount", [
                        constants_1.BITFINEX_WALLET_ADDRESS.toString(),
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: constants_1.BITFINEX_WALLET_ADDRESS.toString(),
                            to: constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                            value: oneEtherQuantity,
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            maxFeePerGas: gasPrice,
                        },
                    ]);
                    const balance = await this.provider.send("eth_getBalance", [
                        constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                    ]);
                    chai_1.assert.equal(balance, oneEtherQuantity);
                });
                it("allows to impersonate a remote contract account", async function () {
                    // Get Uniswap DAI exchange address
                    const getExchangeSelector = `0x06f2bf62${(0, leftPad32_1.leftPad32)(constants_1.DAI_ADDRESS.toString())}`;
                    const result = await this.provider.send("eth_call", [
                        {
                            to: constants_1.UNISWAP_FACTORY_ADDRESS.toString(),
                            data: getExchangeSelector,
                        },
                    ]);
                    const daiExchangeAddress = (0, hexStripZeros_1.hexStripZeros)(result);
                    // Impersonate the DAI exchange contract
                    await this.provider.send("hardhat_impersonateAccount", [
                        daiExchangeAddress,
                    ]);
                    // Transfer 10^18 DAI from the exchange contract to the EMPTY_ACCOUNT_ADDRESS
                    const transferRawData = `0xa9059cbb${(0, leftPad32_1.leftPad32)(constants_1.EMPTY_ACCOUNT_ADDRESS.toString())}${(0, leftPad32_1.leftPad32)(oneEtherQuantity)}`;
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: daiExchangeAddress,
                            to: constants_1.DAI_ADDRESS.toString(),
                            gas: (0, base_types_1.numberToRpcQuantity)(200000),
                            maxFeePerGas: gasPrice,
                            data: transferRawData,
                        },
                    ]);
                    // Check DAI balance of EMPTY_ACCOUNT_ADDRESS
                    const balanceOfSelector = `0x70a08231${(0, leftPad32_1.leftPad32)(constants_1.EMPTY_ACCOUNT_ADDRESS.toString())}`;
                    const daiBalance = await this.provider.send("eth_call", [
                        { to: constants_1.DAI_ADDRESS.toString(), data: balanceOfSelector },
                    ]);
                    chai_1.assert.equal((0, hexStripZeros_1.hexStripZeros)(daiBalance), oneEtherQuantity);
                });
            });
            describe("hardhat_stopImpersonatingAccount", () => {
                it("disables account impersonating", async function () {
                    await this.provider.send("hardhat_impersonateAccount", [
                        constants_1.BITFINEX_WALLET_ADDRESS.toString(),
                    ]);
                    await this.provider.send("hardhat_stopImpersonatingAccount", [
                        constants_1.BITFINEX_WALLET_ADDRESS.toString(),
                    ]);
                    await (0, assertions_1.assertTransactionFailure)(this.provider, {
                        from: constants_1.BITFINEX_WALLET_ADDRESS.toString(),
                        to: constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                        value: (0, base_types_1.numberToRpcQuantity)(100),
                        gas: (0, base_types_1.numberToRpcQuantity)(21000),
                        maxFeePerGas: gasPrice,
                    }, "unknown account", errors_1.InvalidInputError.CODE);
                });
            });
            describe("blocks timestamps", () => {
                it("should use a timestamp relative to the forked block timestamp", async function () {
                    if (setup_1.ALCHEMY_URL === undefined) {
                        this.skip();
                    }
                    await this.provider.send("hardhat_reset", [
                        {
                            forking: {
                                jsonRpcUrl: setup_1.ALCHEMY_URL,
                                blockNumber: 11565019, // first block of 2021
                            },
                        },
                    ]);
                    await this.provider.send("evm_mine");
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        "latest",
                        false,
                    ]);
                    const timestamp = (0, base_types_1.rpcQuantityToNumber)(block.timestamp);
                    const date = new Date(timestamp * 1000);
                    // check that the new block date is 2021-Jan-01
                    chai_1.assert.equal(date.getUTCDate(), 1);
                    chai_1.assert.equal(date.getUTCMonth(), 0);
                    chai_1.assert.equal(date.getUTCFullYear(), 2021);
                });
            });
            it("legacy transactions before the berlin hardfork should have type 0", async function () {
                // last tx before the berlin hardfork
                const txHash = "0x8cd030cb5c760d76badf6e44b87b00210219a2180f044376f2ed3041d1f7e27b";
                const tx = await this.provider.send("eth_getTransactionByHash", [txHash]);
                chai_1.assert.equal(tx.type, "0x0");
            });
        });
    });
});
//# sourceMappingURL=forked-provider.js.map