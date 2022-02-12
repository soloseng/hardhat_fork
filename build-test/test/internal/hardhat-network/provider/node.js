"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneChainsConfig = void 0;
const block_1 = require("@ethereumjs/block");
const common_1 = __importDefault(require("@ethereumjs/common"));
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const ethers_1 = require("ethers");
const sinon_1 = __importDefault(require("sinon"));
const default_config_1 = require("../../../../src/internal/core/config/default-config");
const rpcToBlockData_1 = require("../../../../src/internal/hardhat-network/provider/fork/rpcToBlockData");
const node_1 = require("../../../../src/internal/hardhat-network/provider/node");
const FakeSenderTransaction_1 = require("../../../../src/internal/hardhat-network/provider/transactions/FakeSenderTransaction");
const getCurrentTimestamp_1 = require("../../../../src/internal/hardhat-network/provider/utils/getCurrentTimestamp");
const makeForkClient_1 = require("../../../../src/internal/hardhat-network/provider/utils/makeForkClient");
const hardforks_1 = require("../../../../src/internal/util/hardforks");
const setup_1 = require("../../../setup");
const assertions_1 = require("../helpers/assertions");
const constants_1 = require("../helpers/constants");
const errors_1 = require("../../../helpers/errors");
const providers_1 = require("../helpers/providers");
const assertEqualBlocks_1 = require("./utils/assertEqualBlocks");
function cloneChainsConfig(source) {
    const clone = new Map();
    source.forEach((sourceChainConfig, chainId) => {
        const clonedChainConfig = Object.assign({}, sourceChainConfig);
        clonedChainConfig.hardforkHistory = new Map(sourceChainConfig.hardforkHistory);
        clone.set(chainId, clonedChainConfig);
    });
    return clone;
}
exports.cloneChainsConfig = cloneChainsConfig;
describe("HardhatNode", () => {
    const config = {
        automine: false,
        hardfork: providers_1.DEFAULT_HARDFORK,
        networkName: providers_1.DEFAULT_NETWORK_NAME,
        chainId: providers_1.DEFAULT_CHAIN_ID,
        networkId: providers_1.DEFAULT_NETWORK_ID,
        blockGasLimit: providers_1.DEFAULT_BLOCK_GAS_LIMIT,
        minGasPrice: new ethereumjs_util_1.BN(0),
        genesisAccounts: providers_1.DEFAULT_ACCOUNTS,
        initialBaseFeePerGas: 10,
        mempoolOrder: "priority",
        coinbase: "0x0000000000000000000000000000000000000000",
        chains: default_config_1.defaultHardhatNetworkParams.chains,
    };
    const gasPrice = 20;
    let node;
    let createTestTransaction;
    beforeEach(async () => {
        [, node] = await node_1.HardhatNode.create(config);
        createTestTransaction = (txData) => {
            const tx = new FakeSenderTransaction_1.FakeSenderTransaction(ethereumjs_util_1.Address.fromString(txData.from), Object.assign({ gasPrice }, txData));
            tx.hash();
            return tx;
        };
    });
    describe("getPendingTransactions", () => {
        it("returns both pending and queued transactions from TxPool", async () => {
            const tx1 = createTestTransaction({
                nonce: 0,
                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                gasLimit: 21000,
            });
            const tx2 = createTestTransaction({
                nonce: 2,
                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                gasLimit: 21000,
            });
            const tx3 = createTestTransaction({
                nonce: 3,
                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                gasLimit: 21000,
            });
            await node.sendTransaction(tx1);
            await node.sendTransaction(tx2);
            await node.sendTransaction(tx3);
            const nodePendingTxs = await node.getPendingTransactions();
            chai_1.assert.sameDeepMembers(nodePendingTxs.map((tx) => tx.raw), [tx1, tx2, tx3].map((tx) => tx.raw));
        });
    });
    describe("mineBlock", () => {
        async function assertTransactionsWereMined(txs) {
            for (const tx of txs) {
                const txReceipt = await node.getTransactionReceipt(tx.hash());
                chai_1.assert.isDefined(txReceipt);
            }
            const block = await node.getLatestBlock();
            chai_1.assert.lengthOf(block.transactions, txs.length);
            chai_1.assert.deepEqual(block.transactions.map((tx) => (0, ethereumjs_util_1.bufferToHex)(tx.hash())), txs.map((tx) => (0, ethereumjs_util_1.bufferToHex)(tx.hash())));
        }
        describe("basic tests", () => {
            it("can mine an empty block", async () => {
                const beforeBlock = await node.getLatestBlockNumber();
                await node.mineBlock();
                const currentBlock = await node.getLatestBlockNumber();
                chai_1.assert.equal(currentBlock.toString(), beforeBlock.addn(1).toString());
            });
            it("can mine a block with one transaction", async () => {
                const tx = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 21000,
                    value: 1234,
                });
                await node.sendTransaction(tx);
                await node.mineBlock();
                await assertTransactionsWereMined([tx]);
                const balance = await node.getAccountBalance(constants_1.EMPTY_ACCOUNT_ADDRESS);
                chai_1.assert.equal(balance.toString(), "1234");
            });
            it("can mine a block with two transactions from different senders", async () => {
                const tx1 = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 21000,
                    value: 1234,
                });
                const tx2 = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 21000,
                    value: 1234,
                });
                await node.sendTransaction(tx1);
                await node.sendTransaction(tx2);
                await node.mineBlock();
                await assertTransactionsWereMined([tx1, tx2]);
                const balance = await node.getAccountBalance(constants_1.EMPTY_ACCOUNT_ADDRESS);
                chai_1.assert.equal(balance.toString(), "2468");
            });
            it("can keep the transaction ordering when mining a block", async () => {
                [, node] = await node_1.HardhatNode.create(Object.assign(Object.assign({}, config), { mempoolOrder: "fifo" }));
                const tx1 = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 21000,
                    value: 1234,
                    gasPrice: 42,
                });
                const tx2 = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 21000,
                    value: 1234,
                    gasPrice: 84,
                });
                await node.sendTransaction(tx1);
                await node.sendTransaction(tx2);
                await node.mineBlock();
                const txReceipt1 = await node.getTransactionReceipt(tx1.hash());
                const txReceipt2 = await node.getTransactionReceipt(tx2.hash());
                chai_1.assert.equal(txReceipt1 === null || txReceipt1 === void 0 ? void 0 : txReceipt1.transactionIndex, "0x0");
                chai_1.assert.equal(txReceipt2 === null || txReceipt2 === void 0 ? void 0 : txReceipt2.transactionIndex, "0x1");
            });
            it("can mine a block with two transactions from the same sender", async () => {
                const tx1 = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 21000,
                    value: 1234,
                });
                const tx2 = createTestTransaction({
                    nonce: 1,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 21000,
                    value: 1234,
                });
                await node.sendTransaction(tx1);
                await node.sendTransaction(tx2);
                await node.mineBlock();
                await assertTransactionsWereMined([tx1, tx2]);
                const balance = await node.getAccountBalance(constants_1.EMPTY_ACCOUNT_ADDRESS);
                chai_1.assert.equal(balance.toString(), "2468");
            });
            it("removes the mined transaction from the tx pool", async () => {
                const tx = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 21000,
                    value: 1234,
                });
                await node.sendTransaction(tx);
                const pendingTransactionsBefore = await node.getPendingTransactions();
                chai_1.assert.lengthOf(pendingTransactionsBefore, 1);
                await node.mineBlock();
                const pendingTransactionsAfter = await node.getPendingTransactions();
                chai_1.assert.lengthOf(pendingTransactionsAfter, 0);
            });
            it("leaves the transactions in the tx pool that did not fit in a block", async () => {
                await node.setBlockGasLimit(55000);
                const tx1 = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 30000, // actual gas used is 21_000
                });
                const expensiveTx2 = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 40000,
                });
                const tx3 = createTestTransaction({
                    nonce: 1,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 30000, // actual gas used is 21_000
                });
                await node.sendTransaction(tx1);
                await node.sendTransaction(expensiveTx2);
                await node.sendTransaction(tx3);
                const pendingTransactionsBefore = await node.getPendingTransactions();
                chai_1.assert.sameDeepMembers(pendingTransactionsBefore.map((tx) => tx.raw), [tx1, expensiveTx2, tx3].map((tx) => tx.raw));
                await node.mineBlock();
                await assertTransactionsWereMined([tx1, tx3]);
                const pendingTransactionsAfter = await node.getPendingTransactions();
                chai_1.assert.sameDeepMembers(pendingTransactionsAfter.map((tx) => tx.raw), [expensiveTx2.raw]);
            });
            it("sets correct gasUsed values", async () => {
                const tx1 = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 100000,
                    value: 1234,
                });
                const tx2 = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 100000,
                    value: 1234,
                });
                await node.sendTransaction(tx1);
                await node.sendTransaction(tx2);
                await node.mineBlock();
                const tx1Receipt = await node.getTransactionReceipt(tx1.hash());
                const tx2Receipt = await node.getTransactionReceipt(tx2.hash());
                (0, assertions_1.assertQuantity)(tx1Receipt === null || tx1Receipt === void 0 ? void 0 : tx1Receipt.gasUsed, 21000);
                (0, assertions_1.assertQuantity)(tx2Receipt === null || tx2Receipt === void 0 ? void 0 : tx2Receipt.gasUsed, 21000);
                const block = await node.getLatestBlock();
                chai_1.assert.equal(block.header.gasUsed.toNumber(), 42000);
            });
            it("assigns miner rewards", async () => {
                const gasPriceBN = new ethereumjs_util_1.BN(1);
                let baseFeePerGas = new ethereumjs_util_1.BN(0);
                const pendingBlock = await node.getBlockByNumber("pending");
                if (pendingBlock.header.baseFeePerGas !== undefined) {
                    baseFeePerGas = pendingBlock.header.baseFeePerGas;
                }
                const miner = node.getCoinbaseAddress();
                const initialMinerBalance = await node.getAccountBalance(miner);
                const oneEther = new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18));
                const txFee = gasPriceBN.add(baseFeePerGas).muln(21000);
                const burnedTxFee = baseFeePerGas.muln(21000);
                // the miner reward is 2 ETH plus the tx fee, minus the part
                // of the fee that is burned
                const minerReward = oneEther.muln(2).add(txFee).sub(burnedTxFee);
                const tx = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasPrice: gasPriceBN.add(baseFeePerGas),
                    gasLimit: 21000,
                    value: 1234,
                });
                await node.sendTransaction(tx);
                await node.mineBlock();
                const minerBalance = await node.getAccountBalance(miner);
                chai_1.assert.equal(minerBalance.toString(), initialMinerBalance.add(minerReward).toString());
            });
        });
        describe("gas limit tests", () => {
            it("mines only as many transactions as would fit in a block", async () => {
                await node.setBlockGasLimit(30000);
                const tx1 = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 21000,
                });
                const tx2 = createTestTransaction({
                    nonce: 1,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 21000,
                });
                await node.sendTransaction(tx1);
                await node.sendTransaction(tx2);
                await node.mineBlock();
                await assertTransactionsWereMined([tx1]);
                chai_1.assert.isUndefined(await node.getTransactionReceipt(tx2.hash()));
            });
            it("uses gasLimit value for determining if a new transaction will fit in a block (1 fits)", async () => {
                await node.setBlockGasLimit(50000);
                const tx1 = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 30000, // actual gas used is 21_000
                });
                const tx2 = createTestTransaction({
                    nonce: 1,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 30000, // actual gas used is 21_000
                });
                await node.sendTransaction(tx1);
                await node.sendTransaction(tx2);
                await node.mineBlock();
                await assertTransactionsWereMined([tx1]);
                chai_1.assert.isUndefined(await node.getTransactionReceipt(tx2.hash()));
            });
            it("uses gasLimit value for determining if a new transaction will fit in a block (2 fit)", async () => {
                // here the first tx is added, and it uses 21_000 gas
                // this leaves 31_000 of gas in the block, so the second one is also included
                await node.setBlockGasLimit(52000);
                const tx1 = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 30000, // actual gas used is 21_000
                });
                const tx2 = createTestTransaction({
                    nonce: 1,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 30000, // actual gas used is 21_000
                });
                await node.sendTransaction(tx1);
                await node.sendTransaction(tx2);
                await node.mineBlock();
                await assertTransactionsWereMined([tx1, tx2]);
            });
            it("uses the rest of the txs when one is dropped because of its gas limit", async () => {
                await node.setBlockGasLimit(50000);
                const tx1 = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 30000,
                    gasPrice: 40,
                });
                const tx2 = createTestTransaction({
                    nonce: 1,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 30000,
                    gasPrice: 40,
                });
                const tx3 = createTestTransaction({
                    nonce: 0,
                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    to: constants_1.EMPTY_ACCOUNT_ADDRESS,
                    gasLimit: 21000,
                    gasPrice: 20,
                });
                await node.sendTransaction(tx1);
                await node.sendTransaction(tx2);
                await node.sendTransaction(tx3);
                await node.mineBlock();
                await assertTransactionsWereMined([tx1, tx3]);
                chai_1.assert.isUndefined(await node.getTransactionReceipt(tx2.hash()));
            });
        });
        describe("timestamp tests", () => {
            let clock;
            const assertIncreaseTime = async (expectedTime) => {
                const block = await node.getLatestBlock();
                const blockTimestamp = block.header.timestamp.toNumber();
                // We check that the time increased at least what we had expected
                // but allow a little bit of POSITIVE difference(i.e. that the
                // actual timestamp is a little bit bigger) because time may have ellapsed
                // We assume that the test CAN NOT have taken more than a second
                chai_1.assert.isAtLeast(blockTimestamp, expectedTime);
                chai_1.assert.isAtMost(blockTimestamp, expectedTime + 1);
            };
            beforeEach(() => {
                clock = sinon_1.default.useFakeTimers(Date.now());
            });
            afterEach(() => {
                clock.restore();
            });
            it("mines a block with the current timestamp", async () => {
                clock.tick(15000);
                const now = (0, getCurrentTimestamp_1.getCurrentTimestamp)();
                await node.mineBlock();
                const block = await node.getLatestBlock();
                chai_1.assert.equal(block.header.timestamp.toNumber(), now);
            });
            it("mines a block with an incremented timestamp if it clashes with the previous block", async () => {
                const firstBlock = await node.getLatestBlock();
                const firstBlockTimestamp = firstBlock.header.timestamp.toNumber();
                await node.mineBlock();
                const latestBlock = await node.getLatestBlock();
                const latestBlockTimestamp = latestBlock.header.timestamp.toNumber();
                chai_1.assert.equal(latestBlockTimestamp, firstBlockTimestamp + 1);
            });
            it("assigns an incremented timestamp to each new block mined within the same second", async () => {
                const firstBlock = await node.getLatestBlock();
                const firstBlockTimestamp = firstBlock.header.timestamp.toNumber();
                await node.mineBlock();
                const secondBlock = await node.getLatestBlock();
                const secondBlockTimestamp = secondBlock.header.timestamp.toNumber();
                await node.mineBlock();
                const thirdBlock = await node.getLatestBlock();
                const thirdBlockTimestamp = thirdBlock.header.timestamp.toNumber();
                chai_1.assert.equal(secondBlockTimestamp, firstBlockTimestamp + 1);
                chai_1.assert.equal(thirdBlockTimestamp, secondBlockTimestamp + 1);
            });
            it("mines a block with a preset timestamp", async () => {
                const now = (0, getCurrentTimestamp_1.getCurrentTimestamp)();
                const timestamp = new ethereumjs_util_1.BN(now).addn(30);
                node.setNextBlockTimestamp(timestamp);
                await node.mineBlock();
                const block = await node.getLatestBlock();
                const blockTimestamp = block.header.timestamp.toNumber();
                chai_1.assert.equal(blockTimestamp, timestamp.toNumber());
            });
            it("mines the next block normally after a block with preset timestamp", async () => {
                const now = (0, getCurrentTimestamp_1.getCurrentTimestamp)();
                const timestamp = new ethereumjs_util_1.BN(now).addn(30);
                node.setNextBlockTimestamp(timestamp);
                await node.mineBlock();
                clock.tick(3000);
                await node.mineBlock();
                const block = await node.getLatestBlock();
                const blockTimestamp = block.header.timestamp.toNumber();
                chai_1.assert.equal(blockTimestamp, timestamp.toNumber() + 3);
            });
            it("mines a block with the timestamp passed as a parameter irrespective of the preset timestamp", async () => {
                const now = (0, getCurrentTimestamp_1.getCurrentTimestamp)();
                const presetTimestamp = new ethereumjs_util_1.BN(now).addn(30);
                node.setNextBlockTimestamp(presetTimestamp);
                const timestamp = new ethereumjs_util_1.BN(now).addn(60);
                await node.mineBlock(timestamp);
                const block = await node.getLatestBlock();
                const blockTimestamp = block.header.timestamp.toNumber();
                chai_1.assert.equal(blockTimestamp, timestamp.toNumber());
            });
            it("mines a block with correct timestamp after time increase", async () => {
                const now = (0, getCurrentTimestamp_1.getCurrentTimestamp)();
                const delta = 30;
                node.increaseTime(new ethereumjs_util_1.BN(delta));
                await node.mineBlock();
                await assertIncreaseTime(now + delta);
            });
            it("mining a block having increaseTime called twice counts both calls", async () => {
                const now = (0, getCurrentTimestamp_1.getCurrentTimestamp)();
                const delta = 30;
                node.increaseTime(new ethereumjs_util_1.BN(delta));
                node.increaseTime(new ethereumjs_util_1.BN(delta));
                await node.mineBlock();
                await assertIncreaseTime(now + delta * 2);
            });
            it("mining a block having called increaseTime takes into account 'real' passing time", async () => {
                const now = (0, getCurrentTimestamp_1.getCurrentTimestamp)();
                const delta = 30;
                const elapsedTimeInSeconds = 3;
                node.increaseTime(new ethereumjs_util_1.BN(delta));
                clock.tick(elapsedTimeInSeconds * 1000);
                await node.mineBlock();
                await assertIncreaseTime(now + delta + elapsedTimeInSeconds);
            });
            describe("when time is increased by 30s", () => {
                function testPresetTimestamp(offset) {
                    it("mines a block with the preset timestamp", async () => {
                        const now = (0, getCurrentTimestamp_1.getCurrentTimestamp)();
                        const timestamp = new ethereumjs_util_1.BN(now).addn(offset);
                        node.increaseTime(new ethereumjs_util_1.BN(30));
                        node.setNextBlockTimestamp(timestamp);
                        await node.mineBlock();
                        const block = await node.getLatestBlock();
                        const blockTimestamp = block.header.timestamp.toNumber();
                        chai_1.assert.equal(blockTimestamp, timestamp.toNumber());
                    });
                    it("mining a block with a preset timestamp changes the time offset", async () => {
                        const now = (0, getCurrentTimestamp_1.getCurrentTimestamp)();
                        const timestamp = new ethereumjs_util_1.BN(now).addn(offset);
                        node.increaseTime(new ethereumjs_util_1.BN(30));
                        node.setNextBlockTimestamp(timestamp);
                        await node.mineBlock();
                        clock.tick(3000);
                        await node.mineBlock();
                        const block = await node.getLatestBlock();
                        const blockTimestamp = block.header.timestamp.toNumber();
                        chai_1.assert.equal(blockTimestamp, timestamp.toNumber() + 3);
                    });
                }
                describe("when preset timestamp is 20s into the future", () => {
                    testPresetTimestamp(20);
                });
                describe("when preset timestamp is 40s into the future", () => {
                    testPresetTimestamp(40);
                });
            });
        });
    });
    describe("full block", function () {
        if (setup_1.ALCHEMY_URL === undefined) {
            return;
        }
        const forkedBlocks = [
            // We don't run this test against spurious dragon because
            // its receipts contain the state root, and we can't compute it
            {
                networkName: "mainnet",
                url: setup_1.ALCHEMY_URL,
                blockToRun: 4370001,
                chainId: 1,
            },
            {
                networkName: "mainnet",
                url: setup_1.ALCHEMY_URL,
                blockToRun: 7280001,
                chainId: 1,
            },
            {
                networkName: "mainnet",
                url: setup_1.ALCHEMY_URL,
                blockToRun: 9069001,
                chainId: 1,
            },
            {
                networkName: "mainnet",
                url: setup_1.ALCHEMY_URL,
                blockToRun: 9300077,
                chainId: 1,
            },
            {
                networkName: "kovan",
                url: setup_1.ALCHEMY_URL.replace("mainnet", "kovan"),
                blockToRun: 23115227,
                chainId: 42,
            },
            {
                networkName: "rinkeby",
                url: setup_1.ALCHEMY_URL.replace("mainnet", "rinkeby"),
                blockToRun: 8004365,
                chainId: 4,
            },
            {
                networkName: "ropsten",
                url: setup_1.ALCHEMY_URL.replace("mainnet", "ropsten"),
                blockToRun: 9812365,
                chainId: 3,
            },
            {
                networkName: "ropsten",
                url: setup_1.ALCHEMY_URL.replace("mainnet", "ropsten"),
                blockToRun: 10499406,
                chainId: 3,
            },
        ];
        for (const { url, blockToRun, networkName, chainId } of forkedBlocks) {
            const remoteCommon = new common_1.default({ chain: chainId });
            const hardfork = remoteCommon.getHardforkByBlockNumber(blockToRun);
            it(`should run a ${networkName} block from ${hardfork} and produce the same results`, async function () {
                this.timeout(240000);
                const forkConfig = {
                    jsonRpcUrl: url,
                    blockNumber: blockToRun - 1,
                };
                const { forkClient } = await (0, makeForkClient_1.makeForkClient)(forkConfig);
                const rpcBlock = await forkClient.getBlockByNumber(new ethereumjs_util_1.BN(blockToRun), true);
                if (rpcBlock === null) {
                    chai_1.assert.fail();
                }
                const forkedNodeConfig = {
                    automine: true,
                    networkName: "mainnet",
                    chainId,
                    networkId: 1,
                    hardfork,
                    forkConfig,
                    forkCachePath: constants_1.FORK_TESTS_CACHE_PATH,
                    blockGasLimit: rpcBlock.gasLimit.toNumber(),
                    minGasPrice: new ethereumjs_util_1.BN(0),
                    genesisAccounts: [],
                    mempoolOrder: "priority",
                    coinbase: "0x0000000000000000000000000000000000000000",
                    chains: default_config_1.defaultHardhatNetworkParams.chains,
                };
                const [common, forkedNode] = await node_1.HardhatNode.create(forkedNodeConfig);
                const block = block_1.Block.fromBlockData((0, rpcToBlockData_1.rpcToBlockData)(Object.assign(Object.assign({}, rpcBlock), { 
                    // We wipe the receipt root to make sure we get a new one
                    receiptsRoot: Buffer.alloc(32, 0) })), {
                    common,
                    freeze: false,
                });
                forkedNode["_vmTracer"].disableTracing();
                const afterBlockEvent = await runBlockAndGetAfterBlockEvent(forkedNode["_vm"], {
                    block,
                    generate: true,
                    skipBlockValidation: true,
                });
                const modifiedBlock = afterBlockEvent.block;
                await forkedNode["_vm"].blockchain.putBlock(modifiedBlock);
                await forkedNode["_saveBlockAsSuccessfullyRun"](modifiedBlock, afterBlockEvent);
                const newBlock = await forkedNode.getBlockByNumber(new ethereumjs_util_1.BN(blockToRun));
                if (newBlock === undefined) {
                    chai_1.assert.fail();
                }
                await (0, assertEqualBlocks_1.assertEqualBlocks)(newBlock, afterBlockEvent, rpcBlock, forkClient);
            });
        }
    });
    describe("should run calls in the right hardfork context", async function () {
        this.timeout(10000);
        before(function () {
            if (setup_1.ALCHEMY_URL === undefined) {
                this.skip();
                return;
            }
        });
        const eip1559ActivationBlock = 12965000;
        // some shorthand for code below:
        const post1559Block = eip1559ActivationBlock;
        const blockBefore1559 = eip1559ActivationBlock - 1;
        const pre1559GasOpts = { gasPrice: new ethereumjs_util_1.BN(0) };
        const post1559GasOpts = { maxFeePerGas: new ethereumjs_util_1.BN(0) };
        const baseNodeConfig = {
            automine: true,
            networkName: "mainnet",
            chainId: 1,
            networkId: 1,
            hardfork: "london",
            forkConfig: {
                jsonRpcUrl: setup_1.ALCHEMY_URL,
                blockNumber: eip1559ActivationBlock,
            },
            forkCachePath: constants_1.FORK_TESTS_CACHE_PATH,
            blockGasLimit: 1000000,
            minGasPrice: new ethereumjs_util_1.BN(0),
            genesisAccounts: [],
            chains: default_config_1.defaultHardhatNetworkParams.chains,
            mempoolOrder: "priority",
            coinbase: "0x0000000000000000000000000000000000000000",
        };
        /** execute a call to method Hello() on contract HelloWorld, deployed to
         * mainnet years ago, which should return a string, "Hello World". */
        async function runCall(gasParams, block, targetNode) {
            const contractInterface = new ethers_1.ethers.utils.Interface([
                "function Hello() public pure returns (string)",
            ]);
            const callOpts = {
                to: (0, ethereumjs_util_1.toBuffer)("0xe36613A299bA695aBA8D0c0011FCe95e681f6dD3"),
                from: (0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0]),
                value: new ethereumjs_util_1.BN(0),
                data: (0, ethereumjs_util_1.toBuffer)(contractInterface.encodeFunctionData("Hello", [])),
                gasLimit: new ethereumjs_util_1.BN(1000000),
            };
            function decodeResult(runCallResult) {
                return contractInterface.decodeFunctionResult("Hello", (0, ethereumjs_util_1.bufferToHex)(runCallResult.result.value))[0];
            }
            return decodeResult(await targetNode.runCall(Object.assign(Object.assign({}, callOpts), gasParams), new ethereumjs_util_1.BN(block)));
        }
        describe("when forking with a default hardfork activation history", function () {
            let hardhatNode;
            before(async function () {
                [, hardhatNode] = await node_1.HardhatNode.create(baseNodeConfig);
            });
            it("should accept post-EIP-1559 gas semantics when running in the context of a post-EIP-1559 block", async function () {
                chai_1.assert.equal("Hello World", await runCall(post1559GasOpts, post1559Block, hardhatNode));
            });
            it("should accept pre-EIP-1559 gas semantics when running in the context of a pre-EIP-1559 block", async function () {
                chai_1.assert.equal("Hello World", await runCall(pre1559GasOpts, blockBefore1559, hardhatNode));
            });
            it("should throw when given post-EIP-1559 gas semantics and when running in the context of a pre-EIP-1559 block", async function () {
                await (0, errors_1.expectErrorAsync)(async () => {
                    chai_1.assert.equal("Hello World", await runCall(post1559GasOpts, blockBefore1559, hardhatNode));
                }, /Cannot run transaction: EIP 1559 is not activated./);
            });
            it("should accept pre-EIP-1559 gas semantics when running in the context of a post-EIP-1559 block", async function () {
                chai_1.assert.equal("Hello World", await runCall(pre1559GasOpts, post1559Block, hardhatNode));
            });
        });
        describe("when forking with a hardfork activation history that indicates London happened one block early", function () {
            let nodeWithEarlyLondon;
            before(async function () {
                var _a;
                const nodeConfig = Object.assign(Object.assign({}, baseNodeConfig), { chains: cloneChainsConfig(baseNodeConfig.chains) });
                const chainConfig = (_a = nodeConfig.chains.get(1)) !== null && _a !== void 0 ? _a : {
                    hardforkHistory: new Map(),
                };
                chainConfig.hardforkHistory.set(hardforks_1.HardforkName.LONDON, eip1559ActivationBlock - 1);
                nodeConfig.chains.set(1, chainConfig);
                [, nodeWithEarlyLondon] = await node_1.HardhatNode.create(nodeConfig);
            });
            it("should accept post-EIP-1559 gas semantics when running in the context of the block of the EIP-1559 activation", async function () {
                chai_1.assert.equal("Hello World", await runCall(post1559GasOpts, blockBefore1559, nodeWithEarlyLondon));
            });
            it("should throw when given post-EIP-1559 gas semantics and when running in the context of the block before EIP-1559 activation", async function () {
                await (0, errors_1.expectErrorAsync)(async () => {
                    await runCall(post1559GasOpts, blockBefore1559 - 1, nodeWithEarlyLondon);
                }, /Cannot run transaction: EIP 1559 is not activated./);
            });
            it("should accept post-EIP-1559 gas semantics when running in the context of a block after EIP-1559 activation", async function () {
                chai_1.assert.equal("Hello World", await runCall(post1559GasOpts, post1559Block, nodeWithEarlyLondon));
            });
            it("should accept pre-EIP-1559 gas semantics when running in the context of the block of the EIP-1559 activation", async function () {
                chai_1.assert.equal("Hello World", await runCall(pre1559GasOpts, blockBefore1559, nodeWithEarlyLondon));
            });
        });
        describe("when forking with a weird hardfork activation history", function () {
            let hardhatNode;
            before(async function () {
                const nodeConfig = Object.assign(Object.assign({}, baseNodeConfig), { chains: new Map([
                        [
                            1,
                            {
                                hardforkHistory: new Map([["london", 100]]),
                            },
                        ],
                    ]) });
                [, hardhatNode] = await node_1.HardhatNode.create(nodeConfig);
            });
            it("should throw when making a call with a block below the only hardfork activation", async function () {
                await (0, errors_1.expectErrorAsync)(async () => {
                    await runCall(pre1559GasOpts, 99, hardhatNode);
                }, /Could not find a hardfork to run for block 99, after having looked for one in the HardhatNode's hardfork activation history/);
            });
        });
        describe("when forking WITHOUT a hardfork activation history", function () {
            let nodeWithoutHardforkHistory;
            before(async function () {
                const nodeCfgWithoutHFHist = Object.assign(Object.assign({}, baseNodeConfig), { chains: cloneChainsConfig(baseNodeConfig.chains) });
                nodeCfgWithoutHFHist.chains.set(1, { hardforkHistory: new Map() });
                [, nodeWithoutHardforkHistory] = await node_1.HardhatNode.create(nodeCfgWithoutHFHist);
            });
            it("should throw when running in the context of a historical block", async function () {
                await (0, errors_1.expectErrorAsync)(async () => {
                    await runCall(pre1559GasOpts, blockBefore1559, nodeWithoutHardforkHistory);
                }, /node was not configured with a hardfork activation history/);
            });
        });
    });
});
async function runBlockAndGetAfterBlockEvent(vm, runBlockOpts) {
    let results;
    function handler(event) {
        results = event;
    }
    try {
        vm.once("afterBlock", handler);
        await vm.runBlock(runBlockOpts);
    }
    finally {
        // We need this in case `runBlock` throws before emitting the event.
        // Otherwise we'd be leaking the listener until the next call to runBlock.
        vm.removeListener("afterBlock", handler);
    }
    return results;
}
//# sourceMappingURL=node.js.map