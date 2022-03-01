"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const sinon_1 = __importDefault(require("sinon"));
const base_types_1 = require("../../../../../src/internal/core/jsonrpc/types/base-types");
const getCurrentTimestamp_1 = require("../../../../../src/internal/hardhat-network/provider/utils/getCurrentTimestamp");
const environment_1 = require("../../../../helpers/environment");
const project_1 = require("../../../../helpers/project");
const workaround_windows_ci_failures_1 = require("../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../helpers/assertions");
const constants_1 = require("../../helpers/constants");
const contracts_1 = require("../../helpers/contracts");
const cwd_1 = require("../../helpers/cwd");
const getPendingBaseFeePerGas_1 = require("../../helpers/getPendingBaseFeePerGas");
const providers_1 = require("../../helpers/providers");
const retrieveForkBlockNumber_1 = require("../../helpers/retrieveForkBlockNumber");
const sleep_1 = require("../../helpers/sleep");
const transactions_1 = require("../../helpers/transactions");
describe("Evm module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork }) => {
        if (isFork) {
            this.timeout(50000);
        }
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork });
        describe(`${name} provider`, function () {
            (0, cwd_1.setCWD)();
            useProvider();
            const getFirstBlock = async () => isFork ? (0, retrieveForkBlockNumber_1.retrieveForkBlockNumber)(this.ctx.hardhatNetworkProvider) : 0;
            const getBlockNumber = async () => {
                return (0, base_types_1.rpcQuantityToNumber)(await this.ctx.provider.send("eth_blockNumber"));
            };
            describe("evm_increaseTime", async function () {
                it("should increase the offset of time used for block timestamps", async function () {
                    const blockNumber = (0, base_types_1.rpcQuantityToNumber)(await this.provider.send("eth_blockNumber"));
                    const accounts = await this.provider.send("eth_accounts");
                    const burnTxParams = {
                        from: accounts[0],
                        to: (0, ethereumjs_util_1.zeroAddress)(),
                        value: (0, base_types_1.numberToRpcQuantity)(1),
                        gas: (0, base_types_1.numberToRpcQuantity)(21000),
                        maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                    };
                    const firstBlock = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(blockNumber),
                        false,
                    ]);
                    await this.provider.send("evm_increaseTime", [123]);
                    await this.provider.send("eth_sendTransaction", [burnTxParams]);
                    const secondBlock = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(blockNumber + 1),
                        false,
                    ]);
                    await this.provider.send("evm_increaseTime", [456]);
                    await this.provider.send("eth_sendTransaction", [burnTxParams]);
                    const thirdBlock = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(blockNumber + 2),
                        false,
                    ]);
                    const firstTimestamp = (0, base_types_1.rpcQuantityToNumber)(firstBlock.timestamp);
                    const secondTimestamp = (0, base_types_1.rpcQuantityToNumber)(secondBlock.timestamp);
                    const thirdTimestamp = (0, base_types_1.rpcQuantityToNumber)(thirdBlock.timestamp);
                    chai_1.assert.isAtLeast(secondTimestamp - firstTimestamp, 123);
                    chai_1.assert.isAtLeast(thirdTimestamp - secondTimestamp, 456);
                });
                it("should return the total offset as a decimal string, not a QUANTITY", async function () {
                    // get the current offset
                    const initialOffset = parseInt(await this.provider.send("evm_increaseTime", [0]), 10);
                    let totalOffset = await this.provider.send("evm_increaseTime", [123]);
                    chai_1.assert.isString(totalOffset);
                    chai_1.assert.strictEqual(parseInt(totalOffset, 10), initialOffset + 123);
                    totalOffset = await this.provider.send("evm_increaseTime", [3456789]);
                    chai_1.assert.isString(totalOffset);
                    chai_1.assert.strictEqual(parseInt(totalOffset, 10), initialOffset + 123 + 3456789);
                });
                it("should accept a hex string param", async function () {
                    const offset1 = 123;
                    const offset2 = 1000;
                    const totalOffset1 = parseInt(await this.provider.send("evm_increaseTime", [
                        (0, base_types_1.numberToRpcQuantity)(offset1),
                    ]), 10);
                    const totalOffset2 = parseInt(await this.provider.send("evm_increaseTime", [
                        (0, base_types_1.numberToRpcQuantity)(offset2),
                    ]), 10);
                    chai_1.assert.strictEqual(totalOffset1, offset1);
                    chai_1.assert.strictEqual(totalOffset2, offset1 + offset2);
                });
            });
            describe("evm_setNextBlockTimestamp", async function () {
                it("should set next block timestamp and the next EMPTY block will be mined with that timestamp", async function () {
                    const timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 60;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    await this.provider.send("evm_mine", []);
                    const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    (0, assertions_1.assertQuantity)(block.timestamp, timestamp);
                });
                it("should set next block timestamp and the next tx will be mined with that timestamp", async function () {
                    const timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 70;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    (0, assertions_1.assertQuantity)(block.timestamp, timestamp);
                });
                it("should be able to set and replace an existing 'next block timestamp'", async function () {
                    const timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 60;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    await this.provider.send("evm_setNextBlockTimestamp", [
                        timestamp + 10,
                    ]);
                    await this.provider.send("evm_mine", []);
                    const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    (0, assertions_1.assertQuantity)(block.timestamp, timestamp + 10);
                });
                it("should be reset after the next block is mined", async function () {
                    const timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 60;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    await this.provider.send("evm_mine", []);
                    await this.provider.send("evm_mine", []);
                    const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    chai_1.assert.isTrue((0, base_types_1.rpcQuantityToNumber)(block.timestamp) > timestamp);
                });
                it("should be overridden if next EMPTY block is mined with timestamp", async function () {
                    const timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 90;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    await this.provider.send("evm_mine", [timestamp + 100]);
                    const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    (0, assertions_1.assertQuantity)(block.timestamp, timestamp + 100);
                });
                it("should also advance time offset for future blocks", async function () {
                    let timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 70;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    await this.provider.send("evm_mine", []);
                    timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 90;
                    await this.provider.send("evm_mine", [timestamp]);
                    timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 120;
                    await this.provider.send("evm_mine", [timestamp]);
                    await this.provider.send("evm_mine", []);
                    const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    chai_1.assert.isTrue((0, base_types_1.rpcQuantityToNumber)(block.timestamp) > timestamp);
                });
                it("shouldn't set if specified timestamp is less or equal to the previous block", async function () {
                    const timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 70;
                    await this.provider.send("evm_mine", [timestamp]);
                    await (0, assertions_1.assertInvalidInputError)(this.provider, "evm_setNextBlockTimestamp", [timestamp - 1], `Timestamp ${timestamp - 1} is lower than or equal to previous block's timestamp ${timestamp}`);
                    await (0, assertions_1.assertInvalidInputError)(this.provider, "evm_setNextBlockTimestamp", [timestamp], `Timestamp ${timestamp} is lower than or equal to previous block's timestamp ${timestamp}`);
                });
                it("should advance the time offset accordingly to the timestamp", async function () {
                    let timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 70;
                    await this.provider.send("evm_mine", [timestamp]);
                    await this.provider.send("evm_mine");
                    await this.provider.send("evm_setNextBlockTimestamp", [
                        timestamp + 100,
                    ]);
                    await this.provider.send("evm_mine");
                    await this.provider.send("evm_increaseTime", [30]);
                    await this.provider.send("evm_mine");
                    timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)();
                    // 200 - 1 as we use ceil to round time to seconds
                    chai_1.assert.isTrue(timestamp >= 199);
                });
                it("should accept a hex string param", async function () {
                    const timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 60;
                    await this.provider.send("evm_setNextBlockTimestamp", [
                        (0, base_types_1.numberToRpcQuantity)(timestamp),
                    ]);
                    await this.provider.send("evm_mine", []);
                    const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    (0, assertions_1.assertQuantity)(block.timestamp, timestamp);
                });
                describe("When the initial date is in the past", function () {
                    // These test use a Hardhat Network instance with an initialDate in the
                    // past. We do this by using a fixture project and useEnvironment(),
                    // so instead of using this.provider they must use
                    // this.env.network.provider
                    (0, project_1.useFixtureProject)("hardhat-network-initial-date");
                    (0, environment_1.useEnvironment)();
                    it("should still set the nextBlockTimestamp if it is less than the real time but larger than the previous block", async function () {
                        const timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)();
                        await this.env.network.provider.send("evm_mine", [
                            timestamp - 1000,
                        ]);
                        const latestBlock = await this.env.network.provider.send("eth_getBlockByNumber", ["latest", false]);
                        (0, assertions_1.assertQuantity)(latestBlock.timestamp, timestamp - 1000);
                        await this.env.network.provider.send("evm_setNextBlockTimestamp", [
                            timestamp - 500,
                        ]);
                        await this.env.network.provider.send("evm_mine");
                        const latestBlock2 = await this.env.network.provider.send("eth_getBlockByNumber", ["latest", false]);
                        (0, assertions_1.assertQuantity)(latestBlock2.timestamp, timestamp - 500);
                    });
                });
            });
            describe("evm_setBlockGasLimit", () => {
                it("validates block gas limit", async function () {
                    await (0, assertions_1.assertInvalidInputError)(this.provider, "evm_setBlockGasLimit", [(0, base_types_1.numberToRpcQuantity)(0)], "Block gas limit must be greater than 0");
                });
                it("sets a new block gas limit", async function () {
                    const blockBefore = await this.provider.send("eth_getBlockByNumber", [
                        "pending",
                        false,
                    ]);
                    const gasLimitBefore = (0, base_types_1.rpcQuantityToBN)(blockBefore.gasLimit);
                    const newBlockGasLimit = new ethereumjs_util_1.BN(34228);
                    await this.provider.send("evm_setBlockGasLimit", [
                        (0, base_types_1.numberToRpcQuantity)(newBlockGasLimit),
                    ]);
                    const blockAfter = await this.provider.send("eth_getBlockByNumber", [
                        "pending",
                        false,
                    ]);
                    const gasLimitAfter = (0, base_types_1.rpcQuantityToBN)(blockAfter.gasLimit);
                    chai_1.assert.isFalse(gasLimitBefore.eq(gasLimitAfter));
                    chai_1.assert.isTrue(gasLimitAfter.eq(newBlockGasLimit));
                });
                it("removes transactions that exceed the new block gas limit from the mempool", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    const tx1Hash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                            gas: (0, base_types_1.numberToRpcQuantity)(40000),
                        },
                    ]);
                    await this.provider.send("evm_setBlockGasLimit", [
                        (0, base_types_1.numberToRpcQuantity)(21000),
                    ]);
                    const pendingTransactions = await this.provider.send("eth_pendingTransactions");
                    chai_1.assert.lengthOf(pendingTransactions, 1);
                    chai_1.assert.equal(pendingTransactions[0].hash, tx1Hash);
                });
                it("pending block works after removing a pending tx (first tx is dropped)", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                            gas: (0, base_types_1.numberToRpcQuantity)(30000),
                            nonce: (0, base_types_1.numberToRpcQuantity)(0),
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            nonce: (0, base_types_1.numberToRpcQuantity)(1),
                        },
                    ]);
                    // this removes the first transaction
                    await this.provider.send("evm_setBlockGasLimit", [
                        (0, base_types_1.numberToRpcQuantity)(25000),
                    ]);
                    const pendingBlock = await this.provider.send("eth_getBlockByNumber", ["pending", false]);
                    chai_1.assert.lengthOf(pendingBlock.transactions, 0);
                });
                it("pending block works after removing a pending tx (second tx is dropped)", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    const tx1Hash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            nonce: (0, base_types_1.numberToRpcQuantity)(0),
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                            gas: (0, base_types_1.numberToRpcQuantity)(30000),
                            nonce: (0, base_types_1.numberToRpcQuantity)(1),
                        },
                    ]);
                    // this removes the second transaction
                    await this.provider.send("evm_setBlockGasLimit", [
                        (0, base_types_1.numberToRpcQuantity)(25000),
                    ]);
                    const pendingBlock = await this.provider.send("eth_getBlockByNumber", ["pending", false]);
                    chai_1.assert.deepEqual(pendingBlock.transactions, [tx1Hash]);
                });
            });
            describe("evm_mine", async function () {
                it("should mine empty blocks", async function () {
                    const firstBlock = await getFirstBlock();
                    await this.provider.send("evm_mine");
                    const block = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(firstBlock + 1), false]);
                    chai_1.assert.isEmpty(block.transactions);
                    await this.provider.send("evm_mine");
                    const block2 = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(firstBlock + 2), false]);
                    chai_1.assert.isEmpty(block2.transactions);
                });
                it("should mine an empty block with exact timestamp", async function () {
                    const blockNumber = (0, base_types_1.rpcQuantityToNumber)(await this.provider.send("eth_blockNumber"));
                    const timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 60;
                    await this.provider.send("evm_mine", [timestamp]);
                    const block = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(blockNumber + 1), false]);
                    (0, assertions_1.assertQuantity)(block.timestamp, timestamp);
                });
                it("should mine an empty block with the timestamp and other later blocks have higher timestamp", async function () {
                    const blockNumber = (0, base_types_1.rpcQuantityToNumber)(await this.provider.send("eth_blockNumber"));
                    const timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 60;
                    await this.provider.send("evm_mine", [timestamp]);
                    await this.provider.send("evm_mine");
                    await this.provider.send("evm_mine");
                    const block = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(blockNumber + 2), false]);
                    chai_1.assert.isTrue((0, base_types_1.rpcQuantityToNumber)(block.timestamp) > timestamp);
                });
                it("should mine transactions with original gasLimit values", async function () {
                    const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_READ_CONTRACT.bytecode.object}`, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]);
                    await this.provider.send("evm_setAutomine", [false]);
                    await this.provider.send("evm_setBlockGasLimit", [
                        (0, base_types_1.numberToRpcQuantity)(2 * providers_1.DEFAULT_BLOCK_GAS_LIMIT),
                    ]);
                    const tx1Hash = await this.provider.send("eth_sendTransaction", [
                        {
                            nonce: (0, base_types_1.numberToRpcQuantity)(1),
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.gasLeft,
                            gas: (0, base_types_1.numberToRpcQuantity)(providers_1.DEFAULT_BLOCK_GAS_LIMIT),
                        },
                    ]);
                    const tx2Hash = await this.provider.send("eth_sendTransaction", [
                        {
                            nonce: (0, base_types_1.numberToRpcQuantity)(2),
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: contractAddress,
                            data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.gasLeft,
                            gas: (0, base_types_1.numberToRpcQuantity)(providers_1.DEFAULT_BLOCK_GAS_LIMIT),
                        },
                    ]);
                    await this.provider.send("evm_mine");
                    const [logTx1, logTx2] = await this.provider.send("eth_getLogs", [
                        { address: contractAddress },
                    ]);
                    const gasUsedUntilGasLeftCall = 21185; // value established empirically using Remix on Rinkeby network
                    const expectedGasLeft = providers_1.DEFAULT_BLOCK_GAS_LIMIT - gasUsedUntilGasLeftCall;
                    chai_1.assert.equal(logTx1.transactionHash, tx1Hash);
                    chai_1.assert.equal(logTx2.transactionHash, tx2Hash);
                    chai_1.assert.equal((0, base_types_1.rpcDataToNumber)(logTx1.data), expectedGasLeft);
                    chai_1.assert.equal((0, base_types_1.rpcDataToNumber)(logTx2.data), expectedGasLeft);
                });
                it("should accept a hex string param", async function () {
                    const blockNumber = (0, base_types_1.rpcQuantityToNumber)(await this.provider.send("eth_blockNumber"));
                    const timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 60;
                    await this.provider.send("evm_mine", [
                        (0, base_types_1.numberToRpcQuantity)(timestamp),
                    ]);
                    const block = await this.provider.send("eth_getBlockByNumber", [(0, base_types_1.numberToRpcQuantity)(blockNumber + 1), false]);
                    (0, assertions_1.assertQuantity)(block.timestamp, timestamp);
                });
                describe("tests using sinon", () => {
                    let sinonClock;
                    beforeEach(() => {
                        sinonClock = sinon_1.default.useFakeTimers({
                            now: Date.now(),
                            toFake: ["Date", "setTimeout", "clearTimeout"],
                        });
                    });
                    afterEach(async function () {
                        await this.provider.send("evm_setIntervalMining", [0]);
                        sinonClock.restore();
                    });
                    it("should handle race condition with interval mining", async function () {
                        const interval = 5000;
                        const initialBlock = await getBlockNumber();
                        await this.provider.send("evm_setIntervalMining", [interval]);
                        await sinonClock.tickAsync(interval);
                        await this.provider.send("evm_mine");
                        const currentBlock = await getBlockNumber();
                        chai_1.assert.equal(currentBlock, initialBlock + 2);
                    });
                });
            });
            describe("evm_setAutomine", () => {
                it("should allow disabling automine", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    const previousBlock = await this.provider.send("eth_blockNumber");
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: "0x1111111111111111111111111111111111111111",
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                        },
                    ]);
                    const currentBlock = await this.provider.send("eth_blockNumber");
                    chai_1.assert.equal(currentBlock, previousBlock);
                });
                it("should allow re-enabling of automine", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    await this.provider.send("evm_setAutomine", [true]);
                    const previousBlock = await this.provider.send("eth_blockNumber");
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: "0x1111111111111111111111111111111111111111",
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                        },
                    ]);
                    const currentBlock = await this.provider.send("eth_blockNumber");
                    (0, assertions_1.assertQuantity)(currentBlock, (0, base_types_1.rpcQuantityToBN)(previousBlock).addn(1));
                });
                it("should mine all pending transactions after re-enabling automine", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    const txHash1 = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: "0x1111111111111111111111111111111111111111",
                            gas: (0, base_types_1.numberToRpcQuantity)(100000),
                            maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                            nonce: (0, base_types_1.numberToRpcQuantity)(1),
                        },
                    ]);
                    await this.provider.send("evm_setAutomine", [true]);
                    const txHash2 = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: "0x1111111111111111111111111111111111111111",
                            gas: (0, base_types_1.numberToRpcQuantity)(100000),
                            maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                            nonce: (0, base_types_1.numberToRpcQuantity)(0),
                        },
                    ]);
                    const currentBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    chai_1.assert.lengthOf(currentBlock.transactions, 2);
                    chai_1.assert.sameDeepMembers(currentBlock.transactions, [txHash1, txHash2]);
                });
            });
            describe("evm_setIntervalMining", () => {
                it("validates blockTime parameter", async function () {
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "evm_setIntervalMining", [-10]);
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "evm_setIntervalMining", [[2000, 1000]]);
                });
                describe("time based tests", () => {
                    beforeEach(async function () {
                        await this.provider.send("evm_setAutomine", [false]);
                        if (isFork) {
                            // This is done to speed up subsequent mineBlock calls made by MiningTimer.
                            // On first mineBlock call there are many calls to JSON RPC provider which slow things down.
                            await this.provider.send("evm_mine");
                        }
                    });
                    describe("using sinon", () => {
                        let sinonClock;
                        beforeEach(() => {
                            sinonClock = sinon_1.default.useFakeTimers({
                                now: Date.now(),
                                toFake: ["Date", "setTimeout", "clearTimeout"],
                            });
                        });
                        afterEach(async function () {
                            await this.provider.send("evm_setIntervalMining", [0]);
                            sinonClock.restore();
                        });
                        it("should allow enabling interval mining", async function () {
                            const interval = 5000;
                            const initialBlock = await getBlockNumber();
                            await this.provider.send("evm_setIntervalMining", [interval]);
                            await sinonClock.tickAsync(interval);
                            const currentBlock = await getBlockNumber();
                            chai_1.assert.equal(currentBlock, initialBlock + 1);
                        });
                        it("should continuously mine new blocks after each interval", async function () {
                            const interval = 5000;
                            const initialBlock = await getBlockNumber();
                            await this.provider.send("evm_setIntervalMining", [interval]);
                            await sinonClock.tickAsync(interval);
                            chai_1.assert.equal(await getBlockNumber(), initialBlock + 1);
                            await sinonClock.tickAsync(interval);
                            chai_1.assert.equal(await getBlockNumber(), initialBlock + 2);
                            await sinonClock.tickAsync(interval);
                            chai_1.assert.equal(await getBlockNumber(), initialBlock + 3);
                        });
                        it("should mine blocks when a range is used", async function () {
                            const interval = [4000, 5000];
                            const initialBlock = await getBlockNumber();
                            await this.provider.send("evm_setIntervalMining", [interval]);
                            // no block should be mined before the min value of the range
                            await sinonClock.tickAsync(3999);
                            chai_1.assert.equal(await getBlockNumber(), initialBlock);
                            // when the max value has passed, one block should'be been mined
                            await sinonClock.tickAsync(1001);
                            chai_1.assert.equal(await getBlockNumber(), initialBlock + 1);
                            // after another 5 seconds, another block should be mined
                            await sinonClock.tickAsync(5000);
                            chai_1.assert.equal(await getBlockNumber(), initialBlock + 2);
                        });
                        it("should disable interval mining when 0 is passed", async function () {
                            const interval = 5000;
                            const initialBlock = await getBlockNumber();
                            await this.provider.send("evm_setIntervalMining", [interval]);
                            await sinonClock.tickAsync(interval);
                            chai_1.assert.equal(await getBlockNumber(), initialBlock + 1);
                            await sinonClock.tickAsync(interval);
                            chai_1.assert.equal(await getBlockNumber(), initialBlock + 2);
                            await this.provider.send("evm_setIntervalMining", [0]);
                            await sinonClock.tickAsync(interval);
                            chai_1.assert.equal(await getBlockNumber(), initialBlock + 2);
                            await sinonClock.tickAsync(interval);
                            chai_1.assert.equal(await getBlockNumber(), initialBlock + 2);
                        });
                        const sendTx = async (nonce) => this.ctx.provider.send("eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: "0x1111111111111111111111111111111111111111",
                                nonce: (0, base_types_1.numberToRpcQuantity)(nonce),
                            },
                        ]);
                        const assertBlockWasMined = async (blockNumber, txHashes) => {
                            const block = await this.ctx.provider.send("eth_getBlockByNumber", ["latest", false]);
                            chai_1.assert.equal((0, base_types_1.rpcQuantityToNumber)(block.number), blockNumber);
                            chai_1.assert.deepEqual(block.transactions, txHashes);
                        };
                        it("automine and interval mining don't interfere with each other", async function () {
                            const interval = 5000;
                            const initialBlock = await getBlockNumber();
                            await this.provider.send("evm_setAutomine", [false]);
                            await this.provider.send("evm_setIntervalMining", [interval]);
                            await sinonClock.tickAsync(interval);
                            await assertBlockWasMined(initialBlock + 1, []);
                            const txHash1 = await sendTx(0);
                            await sinonClock.tickAsync(interval);
                            await assertBlockWasMined(initialBlock + 2, [txHash1]);
                            await this.provider.send("evm_setAutomine", [true]);
                            await sinonClock.tickAsync(interval / 2);
                            const txHash2 = await sendTx(1);
                            await assertBlockWasMined(initialBlock + 3, [txHash2]);
                            await sinonClock.tickAsync(interval / 2);
                            await assertBlockWasMined(initialBlock + 4, []);
                        });
                    });
                    describe("using sleep", () => {
                        afterEach(async function () {
                            await this.provider.send("evm_setIntervalMining", [0]);
                        });
                        it("should allow disabling interval mining", async function () {
                            const interval = 1000;
                            const initialBlock = await getBlockNumber();
                            await this.provider.send("evm_setIntervalMining", [interval]);
                            await (0, sleep_1.sleep)(1.7 * interval);
                            const nextBlock = await getBlockNumber();
                            chai_1.assert.equal(nextBlock, initialBlock + 1);
                            await this.provider.send("evm_setIntervalMining", [interval * 2]);
                            await (0, sleep_1.sleep)(interval);
                            const currentBlock = await getBlockNumber();
                            chai_1.assert.equal(currentBlock, initialBlock + 1);
                        });
                        it("should mine block with transaction after the interval", async function () {
                            const interval = 1000;
                            const txHash = await this.provider.send("eth_sendTransaction", [
                                {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                    to: "0x1111111111111111111111111111111111111111",
                                    nonce: (0, base_types_1.numberToRpcQuantity)(0),
                                },
                            ]);
                            await this.provider.send("evm_setIntervalMining", [interval]);
                            await (0, sleep_1.sleep)(1.7 * interval);
                            const currentBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                            chai_1.assert.lengthOf(currentBlock.transactions, 1);
                            chai_1.assert.equal(currentBlock.transactions[0], txHash);
                            const txReceipt = await this.provider.send("eth_getTransactionReceipt", [txHash]);
                            chai_1.assert.isNotNull(txReceipt);
                        });
                    });
                });
            });
            describe("evm_snapshot", async function () {
                it("returns the snapshot id starting at 1", async function () {
                    const id1 = await this.provider.send("evm_snapshot", []);
                    const id2 = await this.provider.send("evm_snapshot", []);
                    const id3 = await this.provider.send("evm_snapshot", []);
                    chai_1.assert.equal(id1, "0x1");
                    chai_1.assert.equal(id2, "0x2");
                    chai_1.assert.equal(id3, "0x3");
                });
                it("Doesn't repeat snapshot ids after revert is called", async function () {
                    const id1 = await this.provider.send("evm_snapshot", []);
                    const reverted = await this.provider.send("evm_revert", [
                        id1,
                    ]);
                    const id2 = await this.provider.send("evm_snapshot", []);
                    chai_1.assert.equal(id1, "0x1");
                    chai_1.assert.isTrue(reverted);
                    chai_1.assert.equal(id2, "0x2");
                });
            });
            describe("evm_revert", async function () {
                it("Returns false for non-existing ids", async function () {
                    const reverted1 = await this.provider.send("evm_revert", [
                        "0x1",
                    ]);
                    const reverted2 = await this.provider.send("evm_revert", [
                        "0x2",
                    ]);
                    const reverted3 = await this.provider.send("evm_revert", [
                        "0x0",
                    ]);
                    chai_1.assert.isFalse(reverted1);
                    chai_1.assert.isFalse(reverted2);
                    chai_1.assert.isFalse(reverted3);
                });
                it("Returns false for already reverted ids", async function () {
                    const id1 = await this.provider.send("evm_snapshot", []);
                    const reverted = await this.provider.send("evm_revert", [
                        id1,
                    ]);
                    const reverted2 = await this.provider.send("evm_revert", [
                        id1,
                    ]);
                    chai_1.assert.isTrue(reverted);
                    chai_1.assert.isFalse(reverted2);
                });
                it("Deletes blocks mined after snapshot", async function () {
                    const snapshotId = await this.provider.send("evm_snapshot", []);
                    const initialLatestBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    await this.provider.send("evm_mine");
                    await this.provider.send("evm_mine");
                    await this.provider.send("evm_mine");
                    await this.provider.send("evm_mine");
                    const latestBlockBeforeReverting = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    const reverted = await this.provider.send("evm_revert", [
                        snapshotId,
                    ]);
                    chai_1.assert.isTrue(reverted);
                    const newLatestBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    chai_1.assert.equal(newLatestBlock.hash, initialLatestBlock.hash);
                    const blockByHash = await this.provider.send("eth_getBlockByHash", [
                        (0, base_types_1.bufferToRpcData)(latestBlockBeforeReverting.hash),
                        false,
                    ]);
                    chai_1.assert.isNull(blockByHash);
                    const blockByNumber = await this.provider.send("eth_getBlockByNumber", [latestBlockBeforeReverting.number, false]);
                    chai_1.assert.isNull(blockByNumber);
                });
                it("Deletes transactions mined after snapshot", async function () {
                    const [, from] = await this.provider.send("eth_accounts");
                    const snapshotId = await this.provider.send("evm_snapshot", []);
                    const txHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from,
                            to: "0x1111111111111111111111111111111111111111",
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(100000),
                            maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                            nonce: (0, base_types_1.numberToRpcQuantity)(0),
                        },
                    ]);
                    const reverted = await this.provider.send("evm_revert", [
                        snapshotId,
                    ]);
                    chai_1.assert.isTrue(reverted);
                    const txHashAfter = await this.provider.send("eth_getTransactionByHash", [txHash]);
                    chai_1.assert.isNull(txHashAfter);
                });
                it("Deletes pending transactions added after snapshot", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    const [, from] = await this.provider.send("eth_accounts");
                    const snapshotId = await this.provider.send("evm_snapshot");
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from,
                            to: "0x1111111111111111111111111111111111111111",
                            value: (0, base_types_1.numberToRpcQuantity)(0),
                            gas: (0, base_types_1.numberToRpcQuantity)(100000),
                            maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                            nonce: (0, base_types_1.numberToRpcQuantity)(0),
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from,
                            to: "0x1111111111111111111111111111111111111111",
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(100000),
                            maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                            nonce: (0, base_types_1.numberToRpcQuantity)(1),
                        },
                    ]);
                    const pendingTransactionsBefore = await this.provider.send("eth_pendingTransactions");
                    chai_1.assert.lengthOf(pendingTransactionsBefore, 2);
                    const reverted = await this.provider.send("evm_revert", [
                        snapshotId,
                    ]);
                    chai_1.assert.isTrue(reverted);
                    const pendingTransactionsAfter = await this.provider.send("eth_pendingTransactions");
                    chai_1.assert.lengthOf(pendingTransactionsAfter, 0);
                });
                it("Re-adds the transactions that were mined after snapshot to the tx pool", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    const [, from] = await this.provider.send("eth_accounts");
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from,
                            to: "0x1111111111111111111111111111111111111111",
                            value: (0, base_types_1.numberToRpcQuantity)(0),
                            gas: (0, base_types_1.numberToRpcQuantity)(100000),
                            maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                            nonce: (0, base_types_1.numberToRpcQuantity)(0),
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from,
                            to: "0x1111111111111111111111111111111111111111",
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(100000),
                            maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                            nonce: (0, base_types_1.numberToRpcQuantity)(1),
                        },
                    ]);
                    const snapshotId = await this.provider.send("evm_snapshot");
                    await this.provider.send("evm_mine");
                    const pendingTransactionsBefore = await this.provider.send("eth_pendingTransactions");
                    chai_1.assert.lengthOf(pendingTransactionsBefore, 0);
                    const reverted = await this.provider.send("evm_revert", [
                        snapshotId,
                    ]);
                    chai_1.assert.isTrue(reverted);
                    const pendingTransactionsAfter = await this.provider.send("eth_pendingTransactions");
                    chai_1.assert.lengthOf(pendingTransactionsAfter, 2);
                });
                it("TxPool state reverts back correctly to the snapshot state", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    const txHash1 = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            nonce: (0, base_types_1.numberToRpcQuantity)(0),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                        },
                    ]);
                    const txHash2 = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            nonce: (0, base_types_1.numberToRpcQuantity)(3),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                        },
                    ]);
                    const snapshotId = await this.provider.send("evm_snapshot");
                    const txHash3 = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            nonce: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                        },
                    ]);
                    await this.provider.send("evm_mine");
                    const currentBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    chai_1.assert.lengthOf(currentBlock.transactions, 2);
                    chai_1.assert.sameDeepMembers(currentBlock.transactions, [txHash1, txHash3]);
                    const reverted = await this.provider.send("evm_revert", [
                        snapshotId,
                    ]);
                    chai_1.assert.isTrue(reverted);
                    const pendingTransactions = await this.provider.send("eth_pendingTransactions");
                    chai_1.assert.sameDeepMembers(pendingTransactions.map((tx) => tx.hash), [txHash1, txHash2]);
                });
                it("Allows resending the same tx after a revert", async function () {
                    const [, from] = await this.provider.send("eth_accounts");
                    const snapshotId = await this.provider.send("evm_snapshot", []);
                    const txParams = {
                        from,
                        to: "0x1111111111111111111111111111111111111111",
                        value: (0, base_types_1.numberToRpcQuantity)(1),
                        gas: (0, base_types_1.numberToRpcQuantity)(100000),
                        maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        nonce: (0, base_types_1.numberToRpcQuantity)(0),
                    };
                    const txHash = await this.provider.send("eth_sendTransaction", [
                        txParams,
                    ]);
                    const reverted = await this.provider.send("evm_revert", [
                        snapshotId,
                    ]);
                    chai_1.assert.isTrue(reverted);
                    const txHash2 = await this.provider.send("eth_sendTransaction", [
                        txParams,
                    ]);
                    chai_1.assert.equal(txHash2, txHash);
                });
                it("Deletes the used snapshot and the following ones", async function () {
                    const snapshotId1 = await this.provider.send("evm_snapshot", []);
                    const snapshotId2 = await this.provider.send("evm_snapshot", []);
                    const snapshotId3 = await this.provider.send("evm_snapshot", []);
                    const revertedTo2 = await this.provider.send("evm_revert", [
                        snapshotId2,
                    ]);
                    chai_1.assert.isTrue(revertedTo2);
                    const revertedTo3 = await this.provider.send("evm_revert", [
                        snapshotId3,
                    ]);
                    // snapshot 3 didn't exist anymore
                    chai_1.assert.isFalse(revertedTo3);
                    const revertedTo1 = await this.provider.send("evm_revert", [
                        snapshotId1,
                    ]);
                    // snapshot 1 still existed
                    chai_1.assert.isTrue(revertedTo1);
                });
                it("Resets the blockchain so that new blocks are added with the right numbers", async function () {
                    const blockNumber = (0, base_types_1.rpcQuantityToNumber)(await this.provider.send("eth_blockNumber"));
                    await this.provider.send("evm_mine");
                    await this.provider.send("evm_mine");
                    await (0, assertions_1.assertLatestBlockNumber)(this.provider, blockNumber + 2);
                    const snapshotId1 = await this.provider.send("evm_snapshot", []);
                    await this.provider.send("evm_mine");
                    await (0, assertions_1.assertLatestBlockNumber)(this.provider, blockNumber + 3);
                    const revertedTo1 = await this.provider.send("evm_revert", [
                        snapshotId1,
                    ]);
                    chai_1.assert.isTrue(revertedTo1);
                    await (0, assertions_1.assertLatestBlockNumber)(this.provider, blockNumber + 2);
                    await this.provider.send("evm_mine");
                    await (0, assertions_1.assertLatestBlockNumber)(this.provider, blockNumber + 3);
                    await this.provider.send("evm_mine");
                    const snapshotId2 = await this.provider.send("evm_snapshot", []);
                    await this.provider.send("evm_mine");
                    await this.provider.send("evm_mine");
                    await (0, assertions_1.assertLatestBlockNumber)(this.provider, blockNumber + 6);
                    const revertedTo2 = await this.provider.send("evm_revert", [
                        snapshotId2,
                    ]);
                    chai_1.assert.isTrue(revertedTo2);
                    await (0, assertions_1.assertLatestBlockNumber)(this.provider, blockNumber + 4);
                });
                it("Restores the previous state", async function () {
                    // This is a very coarse test, as we know that the entire state is
                    // managed by the vm, and is restored as a whole
                    const [, from] = await this.provider.send("eth_accounts");
                    const balanceBeforeTx = await this.provider.send("eth_getBalance", [
                        from,
                    ]);
                    const snapshotId = await this.provider.send("evm_snapshot", []);
                    const txParams = {
                        from,
                        to: "0x1111111111111111111111111111111111111111",
                        value: (0, base_types_1.numberToRpcQuantity)(1),
                        gas: (0, base_types_1.numberToRpcQuantity)(100000),
                        maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        nonce: (0, base_types_1.numberToRpcQuantity)(0),
                    };
                    await this.provider.send("eth_sendTransaction", [txParams]);
                    const balanceAfterTx = await this.provider.send("eth_getBalance", [
                        from,
                    ]);
                    chai_1.assert.notEqual(balanceAfterTx, balanceBeforeTx);
                    const reverted = await this.provider.send("evm_revert", [
                        snapshotId,
                    ]);
                    chai_1.assert.isTrue(reverted);
                    const balanceAfterRevert = await this.provider.send("eth_getBalance", [from]);
                    chai_1.assert.equal(balanceAfterRevert, balanceBeforeTx);
                });
                describe("tests using sinon", () => {
                    let sinonClock;
                    beforeEach(() => {
                        sinonClock = sinon_1.default.useFakeTimers({
                            now: Date.now(),
                            toFake: ["Date", "setTimeout", "clearTimeout"],
                        });
                    });
                    afterEach(async function () {
                        sinonClock.restore();
                    });
                    it("Resets the date to the right time", async function () {
                        const mineEmptyBlock = async () => {
                            await this.provider.send("evm_mine");
                            return this.provider.send("eth_getBlockByNumber", [
                                "latest",
                                false,
                            ]);
                        };
                        const firstBlock = await mineEmptyBlock();
                        await this.provider.send("evm_increaseTime", [100]);
                        const snapshotBlock = await mineEmptyBlock();
                        const snapshotId = await this.provider.send("evm_snapshot");
                        chai_1.assert.equal((0, base_types_1.rpcQuantityToNumber)(snapshotBlock.timestamp), (0, base_types_1.rpcQuantityToNumber)(firstBlock.timestamp) + 100);
                        sinonClock.tick(20 * 1000);
                        await this.provider.send("evm_revert", [snapshotId]);
                        const afterRevertBlock = await mineEmptyBlock();
                        // Check that time was correctly reverted to the snapshot time and that the new
                        // block's timestamp has been incremented to avoid timestamp collision
                        chai_1.assert.equal((0, base_types_1.rpcQuantityToNumber)(afterRevertBlock.timestamp), (0, base_types_1.rpcQuantityToNumber)(snapshotBlock.timestamp) + 1);
                    });
                    describe("when interval mining is enabled", () => {
                        afterEach(async function () {
                            await this.provider.send("evm_setIntervalMining", [0]);
                        });
                        it("should handle race condition", async function () {
                            const interval = 5000;
                            const initialBlock = await getBlockNumber();
                            const snapshotId = await this.provider.send("evm_snapshot");
                            await this.provider.send("evm_setIntervalMining", [interval]);
                            await sinonClock.tickAsync(interval);
                            await this.provider.send("evm_revert", [snapshotId]);
                            const currentBlock = await getBlockNumber();
                            chai_1.assert.equal(currentBlock, initialBlock);
                        });
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=evm.js.map