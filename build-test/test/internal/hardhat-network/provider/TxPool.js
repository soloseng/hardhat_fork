"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = __importDefault(require("@ethereumjs/common"));
const stateManager_1 = __importDefault(require("@ethereumjs/vm/dist/state/stateManager"));
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const errors_1 = require("../../../../src/internal/core/providers/errors");
const random_1 = require("../../../../src/internal/hardhat-network/provider/fork/random");
const TxPool_1 = require("../../../../src/internal/hardhat-network/provider/TxPool");
const txMapToArray_1 = require("../../../../src/internal/hardhat-network/provider/utils/txMapToArray");
const assertEqualTransactionMaps_1 = require("../helpers/assertEqualTransactionMaps");
const blockchain_1 = require("../helpers/blockchain");
const makeOrderedTxMap_1 = require("../helpers/makeOrderedTxMap");
const providers_1 = require("../helpers/providers");
describe("Tx Pool", () => {
    const blockGasLimit = new ethereumjs_util_1.BN(10000000);
    let stateManager;
    let txPool;
    beforeEach(() => {
        stateManager = new stateManager_1.default();
        const common = new common_1.default({ chain: "mainnet", hardfork: "muirGlacier" });
        txPool = new TxPool_1.TxPool(stateManager, blockGasLimit, common);
    });
    describe("addTransaction", () => {
        describe("for a single transaction sender", () => {
            const address = (0, random_1.randomAddress)();
            describe("when the first transaction is added", () => {
                describe("when transaction nonce is equal to account nonce", () => {
                    it("adds the transaction to pending", async () => {
                        await stateManager.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ nonce: new ethereumjs_util_1.BN(0) }));
                        const tx = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 0,
                        });
                        await txPool.addTransaction(tx);
                        const pendingTxs = txPool.getPendingTransactions();
                        chai_1.assert.lengthOf((0, txMapToArray_1.txMapToArray)(pendingTxs), 1);
                        chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(pendingTxs)[0].raw, tx.raw);
                    });
                });
                describe("when transaction nonce is higher than account nonce", () => {
                    it("queues the transaction", async () => {
                        await stateManager.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ nonce: new ethereumjs_util_1.BN(0) }));
                        const tx = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 3,
                        });
                        await txPool.addTransaction(tx);
                        const pendingTxs = txPool.getPendingTransactions();
                        chai_1.assert.equal(pendingTxs.size, 0);
                    });
                });
                describe("when transaction nonce is lower than account nonce", () => {
                    it("throws an error", async () => {
                        await stateManager.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ nonce: new ethereumjs_util_1.BN(1) }));
                        const tx = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 0,
                        });
                        await chai_1.assert.isRejected(txPool.addTransaction(tx), Error, "Nonce too low");
                    });
                });
            });
            describe("when a subsequent transaction is added", () => {
                beforeEach(async () => {
                    await stateManager.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ nonce: new ethereumjs_util_1.BN(0) }));
                });
                describe("when transaction nonce is equal to account next nonce", () => {
                    it("adds the transaction to pending", async () => {
                        const tx1 = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 0,
                        });
                        const tx2 = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 1,
                        });
                        await txPool.addTransaction(tx1);
                        await txPool.addTransaction(tx2);
                        const pendingTxs = txPool.getPendingTransactions();
                        chai_1.assert.sameDeepMembers((0, txMapToArray_1.txMapToArray)(pendingTxs).map((tx) => tx.raw), [tx1, tx2].map((tx) => tx.raw));
                    });
                    it("moves queued transactions with subsequent nonces to pending", async () => {
                        const tx1 = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 0,
                        });
                        const tx2 = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 2,
                        });
                        const tx3 = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 1,
                        });
                        await txPool.addTransaction(tx1);
                        await txPool.addTransaction(tx2);
                        await txPool.addTransaction(tx3);
                        const pendingTxs = txPool.getPendingTransactions();
                        chai_1.assert.sameDeepMembers((0, txMapToArray_1.txMapToArray)(pendingTxs).map((tx) => tx.raw), [tx1, tx2, tx3].map((tx) => tx.raw));
                    });
                    it("does not move queued transactions to pending which have too high nonces", async () => {
                        const tx1 = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 0,
                        });
                        const tx2 = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 2,
                        });
                        const tx3 = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 4,
                        });
                        const tx4 = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 1,
                        });
                        await txPool.addTransaction(tx1);
                        await txPool.addTransaction(tx2);
                        await txPool.addTransaction(tx3);
                        await txPool.addTransaction(tx4);
                        const pendingTxs = txPool.getPendingTransactions();
                        chai_1.assert.sameDeepMembers((0, txMapToArray_1.txMapToArray)(pendingTxs).map((tx) => tx.raw), [tx1, tx2, tx4].map((tx) => tx.raw));
                    });
                });
                describe("when transaction nonce is higher than account next nonce", () => {
                    it("queues the transaction", async () => {
                        const tx1 = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 0,
                        });
                        const tx2 = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 2,
                        });
                        await txPool.addTransaction(tx1);
                        await txPool.addTransaction(tx2);
                        const pendingTxs = txPool.getPendingTransactions();
                        chai_1.assert.sameDeepMembers((0, txMapToArray_1.txMapToArray)(pendingTxs).map((tx) => tx.raw), [tx1].map((tx) => tx.raw));
                    });
                });
                describe("when transaction nonce is lower than account's nonce", () => {
                    it("throws an error", async () => {
                        await stateManager.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ nonce: 1 }));
                        const tx = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 0,
                        });
                        await chai_1.assert.isRejected(txPool.addTransaction(tx), Error, "Nonce too low");
                    });
                });
                describe("when a transaction is replaced", () => {
                    it("should replace a pending transaction", async function () {
                        await stateManager.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)) }));
                        const tx1a = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 0,
                            gasPrice: 5,
                        });
                        const tx1b = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 0,
                            gasPrice: 10,
                        });
                        await txPool.addTransaction(tx1a);
                        await txPool.addTransaction(tx1b);
                        const pendingTxs = txPool.getPendingTransactions();
                        chai_1.assert.sameDeepMembers((0, txMapToArray_1.txMapToArray)(pendingTxs).map((tx) => tx.raw), [tx1b].map((tx) => tx.raw));
                    });
                    it("should replace a queued transaction", async function () {
                        await stateManager.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)) }));
                        const tx2a = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 1,
                            gasPrice: 5,
                        });
                        const tx2b = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 1,
                            gasPrice: 10,
                        });
                        await txPool.addTransaction(tx2a);
                        await txPool.addTransaction(tx2b);
                        const queuedTxs = txPool.getQueuedTransactions();
                        chai_1.assert.sameDeepMembers((0, txMapToArray_1.txMapToArray)(queuedTxs).map((tx) => tx.raw), [tx2b].map((tx) => tx.raw));
                    });
                    it("should throw if the new gas price is not at least 10% higher (pending tx)", async function () {
                        await stateManager.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)) }));
                        const tx1a = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 0,
                            gasPrice: 20,
                        });
                        await txPool.addTransaction(tx1a);
                        const tx1b = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 0,
                            gasPrice: 21,
                        });
                        await chai_1.assert.isRejected(txPool.addTransaction(tx1b), errors_1.InvalidInputError, `Replacement transaction underpriced. A gasPrice/maxFeePerGas of at least 22 is necessary to replace the existing transaction with nonce 0.`);
                        const tx1c = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 0,
                            maxFeePerGas: 21,
                            maxPriorityFeePerGas: 21,
                        });
                        await chai_1.assert.isRejected(txPool.addTransaction(tx1c), errors_1.InvalidInputError, `Replacement transaction underpriced. A gasPrice/maxFeePerGas of at least 22 is necessary to replace the existing transaction with nonce 0.`);
                        const tx1d = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 0,
                            maxFeePerGas: 100000,
                            maxPriorityFeePerGas: 21,
                        });
                        await chai_1.assert.isRejected(txPool.addTransaction(tx1d), errors_1.InvalidInputError, `Replacement transaction underpriced. A gasPrice/maxPriorityFeePerGas of at least 22 is necessary to replace the existing transaction with nonce 0.`);
                        const pendingTxs = txPool.getPendingTransactions();
                        chai_1.assert.sameDeepMembers((0, txMapToArray_1.txMapToArray)(pendingTxs).map((tx) => tx.raw), [tx1a].map((tx) => tx.raw));
                    });
                    it("should throw if the new gas price is not at least 10% higher (queued tx)", async function () {
                        await stateManager.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)) }));
                        const tx2a = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 1,
                            gasPrice: 20,
                        });
                        const tx2b = (0, blockchain_1.createTestFakeTransaction)({
                            from: address,
                            nonce: 1,
                            gasPrice: 21,
                        });
                        await txPool.addTransaction(tx2a);
                        await chai_1.assert.isRejected(txPool.addTransaction(tx2b), errors_1.InvalidInputError, `Replacement transaction underpriced. A gasPrice/maxFeePerGas of at least 22 is necessary to replace the existing transaction with nonce 1`);
                        const queuedTxs = txPool.getQueuedTransactions();
                        chai_1.assert.sameDeepMembers((0, txMapToArray_1.txMapToArray)(queuedTxs).map((tx) => tx.raw), [tx2a].map((tx) => tx.raw));
                    });
                });
            });
        });
        describe("for multiple transaction senders", () => {
            const address1 = (0, random_1.randomAddress)();
            const address2 = (0, random_1.randomAddress)();
            beforeEach(async () => {
                await stateManager.putAccount(address1, ethereumjs_util_1.Account.fromAccountData({ nonce: new ethereumjs_util_1.BN(0) }));
                await stateManager.putAccount(address2, ethereumjs_util_1.Account.fromAccountData({ nonce: new ethereumjs_util_1.BN(0) }));
            });
            it("can add transactions from many senders", async () => {
                const tx1 = (0, blockchain_1.createTestFakeTransaction)({
                    from: address1,
                    nonce: 0,
                });
                const tx2 = (0, blockchain_1.createTestFakeTransaction)({
                    from: address2,
                    nonce: 0,
                });
                await txPool.addTransaction(tx1);
                await txPool.addTransaction(tx2);
                const pendingTxs = txPool.getPendingTransactions();
                chai_1.assert.sameDeepMembers((0, txMapToArray_1.txMapToArray)(pendingTxs).map((tx) => tx.raw), [tx1, tx2].map((tx) => tx.raw));
            });
            describe("does not mix up queued transactions from different senders", () => {
                it("missing transaction", async () => {
                    const tx1 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address1,
                        nonce: 0,
                    });
                    const tx2 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address2,
                        nonce: 0,
                    });
                    const tx3 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address1,
                        nonce: 2,
                    });
                    const tx4 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address2,
                        nonce: 1,
                    });
                    await txPool.addTransaction(tx1);
                    await txPool.addTransaction(tx2);
                    await txPool.addTransaction(tx3);
                    await txPool.addTransaction(tx4);
                    const pendingTxs = txPool.getPendingTransactions();
                    chai_1.assert.sameDeepMembers((0, txMapToArray_1.txMapToArray)(pendingTxs).map((tx) => tx.raw), [tx1, tx2, tx4].map((tx) => tx.raw));
                });
                it("all transactions are present", async () => {
                    const tx1 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address1,
                        nonce: 0,
                    });
                    const tx2 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address2,
                        nonce: 0,
                    });
                    const tx3 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address1,
                        nonce: 2,
                    });
                    const tx4 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address2,
                        nonce: 1,
                    });
                    const tx5 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address1,
                        nonce: 1,
                    });
                    await txPool.addTransaction(tx1);
                    await txPool.addTransaction(tx2);
                    await txPool.addTransaction(tx3);
                    await txPool.addTransaction(tx4);
                    await txPool.addTransaction(tx5);
                    const pendingTxs = txPool.getPendingTransactions();
                    chai_1.assert.sameDeepMembers((0, txMapToArray_1.txMapToArray)(pendingTxs).map((tx) => tx.raw), [tx1, tx2, tx3, tx4, tx5].map((tx) => tx.raw));
                });
                it("some transactions are present", async () => {
                    const tx1 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address1,
                        nonce: 0,
                    });
                    const tx2 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address2,
                        nonce: 0,
                    });
                    const tx3 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address1,
                        nonce: 2,
                    });
                    const tx4 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address2,
                        nonce: 2,
                    });
                    const tx5 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address1,
                        nonce: 3,
                    });
                    const tx6 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address2,
                        nonce: 3,
                    });
                    const tx7 = (0, blockchain_1.createTestFakeTransaction)({
                        from: address2,
                        nonce: 1,
                    });
                    await txPool.addTransaction(tx1);
                    await txPool.addTransaction(tx2);
                    await txPool.addTransaction(tx3);
                    await txPool.addTransaction(tx4);
                    await txPool.addTransaction(tx5);
                    await txPool.addTransaction(tx6);
                    await txPool.addTransaction(tx7);
                    const pendingTxs = txPool.getPendingTransactions();
                    chai_1.assert.sameDeepMembers((0, txMapToArray_1.txMapToArray)(pendingTxs).map((tx) => tx.raw), [tx1, tx2, tx4, tx6, tx7].map((tx) => tx.raw));
                });
            });
        });
        describe("validation", () => {
            it("rejects if transaction is already pending in the tx pool", async () => {
                const to = (0, random_1.randomAddress)();
                const tx1 = (0, blockchain_1.createTestTransaction)({ to, gasLimit: 21000 });
                const tx2 = (0, blockchain_1.createTestTransaction)({ to, gasLimit: 21000 });
                const signedTx1 = tx1.sign((0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS[0].privateKey));
                const signedTx2 = tx2.sign((0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS[0].privateKey));
                await txPool.addTransaction(signedTx1);
                await chai_1.assert.isRejected(txPool.addTransaction(signedTx2), errors_1.InvalidInputError, `Known transaction: ${(0, ethereumjs_util_1.bufferToHex)(signedTx1.hash())}`);
            });
            it("rejects if transaction's gas limit exceeds block gas limit", async () => {
                const gasLimit = 15000000;
                const tx = (0, blockchain_1.createTestFakeTransaction)({ gasLimit });
                await chai_1.assert.isRejected(txPool.addTransaction(tx), errors_1.InvalidInputError, `Transaction gas limit is ${gasLimit} and exceeds block gas limit of ${blockGasLimit}`);
            });
            it("rejects if transaction is not signed", async () => {
                const tx = (0, blockchain_1.createTestTransaction)();
                await chai_1.assert.isRejected(txPool.addTransaction(tx), errors_1.InvalidInputError, "Invalid Signature");
            });
            it("rejects if transaction's nonce is too low", async () => {
                const address = (0, random_1.randomAddress)();
                await stateManager.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ nonce: 1 }));
                const tx = (0, blockchain_1.createTestFakeTransaction)({
                    from: address,
                    nonce: 0,
                });
                await chai_1.assert.isRejected(txPool.addTransaction(tx), errors_1.InvalidInputError, "Nonce too low");
            });
            it("rejects if transaction's gas limit is lower than transaction's base fee", async () => {
                const gasLimit = 100;
                const tx = (0, blockchain_1.createTestFakeTransaction)({ gasLimit });
                await chai_1.assert.isRejected(txPool.addTransaction(tx), errors_1.InvalidInputError, `Transaction requires at least 21000 gas but got ${gasLimit}`);
            });
            it("rejects if creating a contract and no data is provided", async () => {
                const tx = (0, blockchain_1.createTestFakeTransaction)({
                    to: undefined,
                });
                await chai_1.assert.isRejected(txPool.addTransaction(tx), errors_1.InvalidInputError, "contract creation without any data provided");
            });
            it("rejects if sender doesn't have enough ether on their balance", async () => {
                const address = (0, random_1.randomAddress)();
                await stateManager.putAccount(address, ethereumjs_util_1.Account.fromAccountData({
                    nonce: new ethereumjs_util_1.BN(0),
                    balance: new ethereumjs_util_1.BN(21000 * 900 + 5 - 1),
                }));
                const tx = (0, blockchain_1.createTestFakeTransaction)({
                    from: address,
                    gasLimit: 21000,
                    gasPrice: 900,
                    value: 5,
                });
                await chai_1.assert.isRejected(txPool.addTransaction(tx), errors_1.InvalidInputError, "sender doesn't have enough funds to send tx");
                const tx2 = (0, blockchain_1.createTestFakeTransaction)({
                    from: address,
                    maxFeePerGas: 21000,
                    maxPriorityFeePerGas: 0,
                    value: 5,
                });
                await chai_1.assert.isRejected(txPool.addTransaction(tx2), errors_1.InvalidInputError, "sender doesn't have enough funds to send tx");
            });
        });
        describe("assigning order ids", () => {
            const address = (0, random_1.randomAddress)();
            beforeEach(async () => {
                await stateManager.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ nonce: new ethereumjs_util_1.BN(0) }));
            });
            it("saves the order in which transactions were added", async () => {
                const txA = (0, blockchain_1.createTestOrderedTransaction)({
                    from: address,
                    orderId: 0,
                    nonce: 1,
                });
                const txB = (0, blockchain_1.createTestOrderedTransaction)({
                    from: address,
                    orderId: 1,
                    nonce: 4,
                });
                const txC = (0, blockchain_1.createTestOrderedTransaction)({
                    from: address,
                    orderId: 2,
                    nonce: 2,
                });
                const txD = (0, blockchain_1.createTestOrderedTransaction)({
                    from: address,
                    orderId: 3,
                    nonce: 0,
                });
                await txPool.addTransaction(txA.data);
                await txPool.addTransaction(txB.data);
                await txPool.addTransaction(txC.data);
                await txPool.addTransaction(txD.data);
                const pendingTxs = txPool.getPendingTransactions();
                (0, assertEqualTransactionMaps_1.assertEqualTransactionMaps)(pendingTxs, (0, makeOrderedTxMap_1.makeOrderedTxMap)([txD, txA, txC]));
            });
        });
    });
    describe("getTransactionByHash", () => {
        it("returns a transaction from pending based on hash", async () => {
            const tx = (0, blockchain_1.createTestFakeTransaction)({
                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                to: (0, random_1.randomAddress)(),
                nonce: 0,
                gasLimit: 21000,
            });
            await txPool.addTransaction(tx);
            const txFromTxPool = txPool.getTransactionByHash(tx.hash());
            chai_1.assert.deepEqual(txFromTxPool === null || txFromTxPool === void 0 ? void 0 : txFromTxPool.data.raw, tx.raw);
        });
        it("returns a transaction from queued based on hash", async () => {
            const tx = (0, blockchain_1.createTestFakeTransaction)({
                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                to: (0, random_1.randomAddress)(),
                nonce: 2,
                gasLimit: 21000,
            });
            await txPool.addTransaction(tx);
            const txFromTxPool = txPool.getTransactionByHash(tx.hash());
            chai_1.assert.deepEqual(txFromTxPool === null || txFromTxPool === void 0 ? void 0 : txFromTxPool.data.raw, tx.raw);
        });
        it("returns undefined if transaction is not in pending anymore", async () => {
            const tx = (0, blockchain_1.createTestTransaction)({
                to: (0, random_1.randomAddress)(),
                nonce: 0,
                gasLimit: 21000,
            });
            const signedTx = tx.sign((0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS[0].privateKey));
            await txPool.addTransaction(signedTx);
            const oldTxFromTxPool = txPool.getTransactionByHash(signedTx.hash());
            chai_1.assert.deepEqual(oldTxFromTxPool.data.raw(), signedTx.raw());
            await stateManager.putAccount(signedTx.getSenderAddress(), ethereumjs_util_1.Account.fromAccountData({
                nonce: 1,
                balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)),
            }));
            await txPool.updatePendingAndQueued();
            const actualTxFromTxPool = txPool.getTransactionByHash(signedTx.hash());
            chai_1.assert.isUndefined(actualTxFromTxPool);
        });
        it("returns undefined if transaction is not in queued anymore", async () => {
            const tx = (0, blockchain_1.createTestTransaction)({
                to: (0, random_1.randomAddress)(),
                nonce: 2,
                gasLimit: 21000,
            });
            const signedTx = tx.sign((0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS[0].privateKey));
            await txPool.addTransaction(signedTx);
            const oldTxFromTxPool = txPool.getTransactionByHash(signedTx.hash());
            chai_1.assert.deepEqual(oldTxFromTxPool.data.raw(), signedTx.raw());
            await stateManager.putAccount(signedTx.getSenderAddress(), ethereumjs_util_1.Account.fromAccountData({
                nonce: 3,
                balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)),
            }));
            await txPool.updatePendingAndQueued();
            const actualTxFromTxPool = txPool.getTransactionByHash(signedTx.hash());
            chai_1.assert.isUndefined(actualTxFromTxPool);
        });
    });
    describe("getNextPendingNonce", () => {
        const address = (0, random_1.randomAddress)();
        beforeEach(async () => {
            await stateManager.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ nonce: new ethereumjs_util_1.BN(0) }));
        });
        it("returns the next nonce", async () => {
            const tx1 = (0, blockchain_1.createTestFakeTransaction)({
                from: address,
                nonce: 0,
            });
            await txPool.addTransaction(tx1);
            chai_1.assert.isTrue((await txPool.getNextPendingNonce(address)).eq(new ethereumjs_util_1.BN(1)));
        });
        it("is not affected by queued transactions", async () => {
            const tx1 = (0, blockchain_1.createTestFakeTransaction)({
                from: address,
                nonce: 0,
            });
            const tx2 = (0, blockchain_1.createTestFakeTransaction)({
                from: address,
                nonce: 2,
            });
            await txPool.addTransaction(tx1);
            await txPool.addTransaction(tx2);
            chai_1.assert.isTrue((await txPool.getNextPendingNonce(address)).eq(new ethereumjs_util_1.BN(1)));
        });
        it("returns correct nonce after all queued transactions are moved to pending", async () => {
            const tx1 = (0, blockchain_1.createTestFakeTransaction)({
                from: address,
                nonce: 0,
            });
            const tx2 = (0, blockchain_1.createTestFakeTransaction)({
                from: address,
                nonce: 2,
            });
            const tx3 = (0, blockchain_1.createTestFakeTransaction)({
                from: address,
                nonce: 1,
            });
            await txPool.addTransaction(tx1);
            await txPool.addTransaction(tx2);
            await txPool.addTransaction(tx3);
            chai_1.assert.isTrue((await txPool.getNextPendingNonce(address)).eq(new ethereumjs_util_1.BN(3)));
        });
        it("returns correct nonce after some queued transactions are moved to pending", async () => {
            const tx1 = (0, blockchain_1.createTestFakeTransaction)({ from: address, nonce: 0 });
            const tx2 = (0, blockchain_1.createTestFakeTransaction)({ from: address, nonce: 2 });
            const tx3 = (0, blockchain_1.createTestFakeTransaction)({ from: address, nonce: 5 });
            const tx4 = (0, blockchain_1.createTestFakeTransaction)({ from: address, nonce: 1 });
            await txPool.addTransaction(tx1);
            await txPool.addTransaction(tx2);
            await txPool.addTransaction(tx3);
            await txPool.addTransaction(tx4);
            chai_1.assert.isTrue((await txPool.getNextPendingNonce(address)).eq(new ethereumjs_util_1.BN(3)));
        });
    });
    describe("updatePendingAndQueued", () => {
        const address1 = ethereumjs_util_1.Address.fromString(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0]);
        const address2 = ethereumjs_util_1.Address.fromString(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]);
        beforeEach(async () => {
            await stateManager.putAccount(address1, ethereumjs_util_1.Account.fromAccountData({
                nonce: new ethereumjs_util_1.BN(0),
                balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)),
            }));
            await stateManager.putAccount(address2, ethereumjs_util_1.Account.fromAccountData({
                nonce: new ethereumjs_util_1.BN(0),
                balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)),
            }));
        });
        it("removes pending transaction when it's gas limit exceeds block gas limit", async () => {
            const tx1 = (0, blockchain_1.createTestTransaction)({ nonce: 0, gasLimit: 9500000 });
            const signedTx1 = tx1.sign((0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS[0].privateKey));
            await txPool.addTransaction(signedTx1);
            txPool.setBlockGasLimit(5000000);
            await txPool.updatePendingAndQueued();
            const pendingTransactions = txPool.getPendingTransactions();
            (0, assertEqualTransactionMaps_1.assertEqualTransactionMaps)(pendingTransactions, (0, makeOrderedTxMap_1.makeOrderedTxMap)([]));
        });
        it("removes queued transaction when it's gas limit exceeds block gas limit", async () => {
            const tx1 = (0, blockchain_1.createTestTransaction)({ nonce: 1, gasLimit: 9500000 });
            const signedTx1 = tx1.sign((0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS[0].privateKey));
            await txPool.addTransaction(signedTx1);
            txPool.setBlockGasLimit(5000000);
            await txPool.updatePendingAndQueued();
            const queuedTransactions = txPool.getQueuedTransactions();
            (0, assertEqualTransactionMaps_1.assertEqualTransactionMaps)(queuedTransactions, (0, makeOrderedTxMap_1.makeOrderedTxMap)([]));
        });
        it("removes pending transactions with too low nonces", async () => {
            const tx1 = (0, blockchain_1.createTestOrderedTransaction)({
                orderId: 0,
                nonce: 0,
                gasLimit: 30000,
                from: address1,
            });
            const tx2 = (0, blockchain_1.createTestOrderedTransaction)({
                orderId: 1,
                nonce: 1,
                gasLimit: 30000,
                from: address1,
            });
            const tx3 = (0, blockchain_1.createTestOrderedTransaction)({
                orderId: 2,
                nonce: 0,
                gasLimit: 30000,
                from: address2,
            });
            const tx4 = (0, blockchain_1.createTestOrderedTransaction)({
                orderId: 3,
                nonce: 1,
                gasLimit: 30000,
                from: address2,
            });
            await txPool.addTransaction(tx1.data);
            await txPool.addTransaction(tx2.data);
            await txPool.addTransaction(tx3.data);
            await txPool.addTransaction(tx4.data);
            await stateManager.putAccount(address1, ethereumjs_util_1.Account.fromAccountData({
                nonce: new ethereumjs_util_1.BN(1),
                balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)),
            }));
            await stateManager.putAccount(address2, ethereumjs_util_1.Account.fromAccountData({
                nonce: new ethereumjs_util_1.BN(1),
                balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18)),
            }));
            await txPool.updatePendingAndQueued();
            const pendingTransactions = txPool.getPendingTransactions();
            (0, assertEqualTransactionMaps_1.assertEqualTransactionMaps)(pendingTransactions, (0, makeOrderedTxMap_1.makeOrderedTxMap)([tx2, tx4]));
        });
        it("removes pending transaction when sender doesn't have enough ether to make the transaction", async () => {
            const tx1 = (0, blockchain_1.createTestTransaction)({
                nonce: 0,
                gasLimit: 30000,
                gasPrice: 500,
            });
            const signedTx1 = tx1.sign((0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS[0].privateKey));
            await txPool.addTransaction(signedTx1);
            await stateManager.putAccount(address1, ethereumjs_util_1.Account.fromAccountData({ nonce: new ethereumjs_util_1.BN(0), balance: new ethereumjs_util_1.BN(0) }));
            await txPool.updatePendingAndQueued();
            const pendingTransactions = txPool.getPendingTransactions();
            (0, assertEqualTransactionMaps_1.assertEqualTransactionMaps)(pendingTransactions, (0, makeOrderedTxMap_1.makeOrderedTxMap)([]));
        });
        it("removes queued transaction when sender doesn't have enough ether to make the transaction", async () => {
            const tx1 = (0, blockchain_1.createTestTransaction)({
                nonce: 2,
                gasLimit: 30000,
                gasPrice: 500,
            });
            const signedTx1 = tx1.sign((0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS[0].privateKey));
            await txPool.addTransaction(signedTx1);
            await stateManager.putAccount(address1, ethereumjs_util_1.Account.fromAccountData({ nonce: new ethereumjs_util_1.BN(0), balance: new ethereumjs_util_1.BN(0) }));
            await txPool.updatePendingAndQueued();
            const queuedTransactions = txPool.getQueuedTransactions();
            (0, assertEqualTransactionMaps_1.assertEqualTransactionMaps)(queuedTransactions, (0, makeOrderedTxMap_1.makeOrderedTxMap)([]));
        });
        it("moves pending transactions to queued if needed", async () => {
            const sender = (0, random_1.randomAddress)();
            await stateManager.putAccount(sender, ethereumjs_util_1.Account.fromAccountData({
                nonce: new ethereumjs_util_1.BN(0),
                balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(20)),
            }));
            const tx0 = (0, blockchain_1.createTestFakeTransaction)({
                nonce: 0,
                gasLimit: 100000,
                from: sender,
            });
            const tx1 = (0, blockchain_1.createTestFakeTransaction)({
                nonce: 1,
                gasLimit: 200000,
                from: sender,
            });
            const tx2 = (0, blockchain_1.createTestFakeTransaction)({
                nonce: 2,
                gasLimit: 100000,
                from: sender,
            });
            const tx4 = (0, blockchain_1.createTestFakeTransaction)({
                nonce: 4,
                gasLimit: 100000,
                from: sender,
            });
            const tx5 = (0, blockchain_1.createTestFakeTransaction)({
                nonce: 5,
                gasLimit: 100000,
                from: sender,
            });
            await txPool.addTransaction(tx0);
            await txPool.addTransaction(tx1);
            await txPool.addTransaction(tx2);
            await txPool.addTransaction(tx4);
            await txPool.addTransaction(tx5);
            // pending: [0, 1, 2]
            // queued: [4, 5]
            let pendingTxs = txPool.getPendingTransactions();
            chai_1.assert.lengthOf((0, txMapToArray_1.txMapToArray)(pendingTxs), 3);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(pendingTxs)[0].raw, tx0.raw);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(pendingTxs)[1].raw, tx1.raw);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(pendingTxs)[2].raw, tx2.raw);
            let queuedTxs = txPool.getQueuedTransactions();
            chai_1.assert.lengthOf((0, txMapToArray_1.txMapToArray)(queuedTxs), 2);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(queuedTxs)[0].raw, tx4.raw);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(queuedTxs)[1].raw, tx5.raw);
            // this should drop tx1
            txPool.setBlockGasLimit(150000);
            await txPool.updatePendingAndQueued();
            // pending: [0]
            // queued: [2, 4, 5]
            pendingTxs = txPool.getPendingTransactions();
            chai_1.assert.lengthOf((0, txMapToArray_1.txMapToArray)(pendingTxs), 1);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(pendingTxs)[0].raw, tx0.raw);
            queuedTxs = txPool.getQueuedTransactions();
            chai_1.assert.lengthOf((0, txMapToArray_1.txMapToArray)(queuedTxs), 3);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(queuedTxs)[0].raw, tx4.raw);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(queuedTxs)[1].raw, tx5.raw);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(queuedTxs)[2].raw, tx2.raw);
        });
        it("handles dropped transactions properly", async () => {
            const sender = (0, random_1.randomAddress)();
            const tx1 = (0, blockchain_1.createTestFakeTransaction)({
                nonce: 0,
                gasLimit: 100000,
                from: sender,
            });
            await txPool.addTransaction(tx1);
            let pendingTxs = txPool.getPendingTransactions();
            chai_1.assert.lengthOf((0, txMapToArray_1.txMapToArray)(pendingTxs), 1);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(pendingTxs)[0].raw, tx1.raw);
            let queuedTxs = txPool.getQueuedTransactions();
            chai_1.assert.lengthOf((0, txMapToArray_1.txMapToArray)(queuedTxs), 0);
            txPool.setBlockGasLimit(90000);
            await txPool.updatePendingAndQueued();
            const tx2 = (0, blockchain_1.createTestFakeTransaction)({
                gasLimit: 80000,
                from: sender,
                nonce: 0,
            });
            await txPool.addTransaction(tx2);
            pendingTxs = txPool.getPendingTransactions();
            chai_1.assert.lengthOf((0, txMapToArray_1.txMapToArray)(pendingTxs), 1);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(pendingTxs)[0].raw, tx2.raw);
            queuedTxs = txPool.getQueuedTransactions();
            chai_1.assert.lengthOf((0, txMapToArray_1.txMapToArray)(queuedTxs), 0);
        });
        it("accepts transactions after a no-op update", async function () {
            const sender = (0, random_1.randomAddress)();
            await stateManager.putAccount(sender, ethereumjs_util_1.Account.fromAccountData({
                nonce: new ethereumjs_util_1.BN(0),
                balance: new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(20)),
            }));
            const tx0 = (0, blockchain_1.createTestFakeTransaction)({
                nonce: 0,
                from: sender,
            });
            const tx1 = (0, blockchain_1.createTestFakeTransaction)({
                nonce: 1,
                from: sender,
            });
            const tx2 = (0, blockchain_1.createTestFakeTransaction)({
                nonce: 2,
                from: sender,
            });
            await txPool.addTransaction(tx0);
            await txPool.addTransaction(tx1);
            await txPool.addTransaction(tx2);
            // pending: [0, 1, 2]
            // queued: [0]
            let pendingTxs = txPool.getPendingTransactions();
            chai_1.assert.lengthOf((0, txMapToArray_1.txMapToArray)(pendingTxs), 3);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(pendingTxs)[0].raw, tx0.raw);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(pendingTxs)[1].raw, tx1.raw);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(pendingTxs)[2].raw, tx2.raw);
            let queuedTxs = txPool.getQueuedTransactions();
            chai_1.assert.lengthOf((0, txMapToArray_1.txMapToArray)(queuedTxs), 0);
            // this should drop tx1
            txPool.setBlockGasLimit(100000);
            await txPool.updatePendingAndQueued();
            const tx3 = (0, blockchain_1.createTestFakeTransaction)({
                nonce: 3,
                from: sender,
            });
            await txPool.addTransaction(tx3);
            // pending: [0, 1, 2, 3]
            // queued: []
            pendingTxs = txPool.getPendingTransactions();
            chai_1.assert.lengthOf((0, txMapToArray_1.txMapToArray)(pendingTxs), 4);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(pendingTxs)[0].raw, tx0.raw);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(pendingTxs)[1].raw, tx1.raw);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(pendingTxs)[2].raw, tx2.raw);
            chai_1.assert.deepEqual((0, txMapToArray_1.txMapToArray)(pendingTxs)[3].raw, tx3.raw);
            queuedTxs = txPool.getQueuedTransactions();
            chai_1.assert.lengthOf((0, txMapToArray_1.txMapToArray)(queuedTxs), 0);
        });
    });
    describe("setBlockGasLimit", () => {
        it("sets a new block gas limit when new limit is a number", () => {
            chai_1.assert.equal(txPool.getBlockGasLimit().toNumber(), 10000000);
            txPool.setBlockGasLimit(15000000);
            chai_1.assert.equal(txPool.getBlockGasLimit().toNumber(), 15000000);
        });
        it("sets a new block gas limit when new limit is a BN", () => {
            chai_1.assert.equal(txPool.getBlockGasLimit().toNumber(), 10000000);
            txPool.setBlockGasLimit(new ethereumjs_util_1.BN(15000000));
            chai_1.assert.equal(txPool.getBlockGasLimit().toNumber(), 15000000);
        });
        it("makes the new block gas limit actually used for validating added transactions", async () => {
            txPool.setBlockGasLimit(21000);
            const tx = (0, blockchain_1.createTestFakeTransaction)({ gasLimit: 50000 });
            await chai_1.assert.isRejected(txPool.addTransaction(tx), errors_1.InvalidInputError, "Transaction gas limit is 50000 and exceeds block gas limit of 21000");
        });
    });
    describe("snapshot", () => {
        it("returns a snapshot id", () => {
            const id = txPool.snapshot();
            chai_1.assert.isNumber(id);
        });
        it("returns a bigger snapshot id if the state changed", async () => {
            const id1 = txPool.snapshot();
            const tx = (0, blockchain_1.createTestFakeTransaction)();
            await txPool.addTransaction(tx);
            const id2 = txPool.snapshot();
            chai_1.assert.isAbove(id2, id1);
        });
    });
    describe("revert", () => {
        it("throws if snapshot with given ID doesn't exist", async () => {
            chai_1.assert.throws(() => txPool.revert(5), Error, "There's no snapshot with such ID");
        });
        it("reverts to the previous state of transactions", async () => {
            const address = (0, random_1.randomAddress)();
            await stateManager.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ nonce: new ethereumjs_util_1.BN(0) }));
            const tx1 = (0, blockchain_1.createTestOrderedTransaction)({
                from: address,
                orderId: 0,
                nonce: 0,
            });
            await txPool.addTransaction(tx1.data);
            const id = txPool.snapshot();
            const tx2 = (0, blockchain_1.createTestOrderedTransaction)({
                from: address,
                orderId: 1,
                nonce: 1,
            });
            await txPool.addTransaction(tx2.data);
            txPool.revert(id);
            const pendingTransactions = txPool.getPendingTransactions();
            (0, assertEqualTransactionMaps_1.assertEqualTransactionMaps)(pendingTransactions, (0, makeOrderedTxMap_1.makeOrderedTxMap)([tx1]));
        });
        it("reverts to the previous state of block gas limit", () => {
            const id = txPool.snapshot();
            txPool.setBlockGasLimit(new ethereumjs_util_1.BN(5000000));
            txPool.revert(id);
            chai_1.assert.equal(txPool.getBlockGasLimit().toNumber(), blockGasLimit.toNumber());
        });
    });
    describe("hasPendingTransactions", () => {
        it("returns false when there are no pending transactions", async () => {
            chai_1.assert.isFalse(txPool.hasPendingTransactions());
        });
        it("returns true when there is at least one pending transaction", async () => {
            const tx1 = (0, blockchain_1.createTestFakeTransaction)({ nonce: 0 });
            const tx2 = (0, blockchain_1.createTestFakeTransaction)({ nonce: 0 });
            await txPool.addTransaction(tx1);
            chai_1.assert.isTrue(txPool.hasPendingTransactions());
            await txPool.addTransaction(tx2);
            chai_1.assert.isTrue(txPool.hasPendingTransactions());
        });
        it("returns false when there are only queued transactions", async () => {
            const tx1 = (0, blockchain_1.createTestFakeTransaction)({ nonce: 1 });
            const tx2 = (0, blockchain_1.createTestFakeTransaction)({ nonce: 1 });
            await txPool.addTransaction(tx1);
            await txPool.addTransaction(tx2);
            chai_1.assert.isFalse(txPool.hasPendingTransactions());
        });
    });
});
//# sourceMappingURL=TxPool.js.map