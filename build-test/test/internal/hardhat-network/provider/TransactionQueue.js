"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const crypto_1 = require("crypto");
const TransactionQueue_1 = require("../../../../src/internal/hardhat-network/provider/TransactionQueue");
const blockchain_1 = require("../helpers/blockchain");
const makeOrderedTxMap_1 = require("../helpers/makeOrderedTxMap");
const errors_1 = require("../../../../src/internal/core/providers/errors");
function getTestTransactionFactory() {
    let orderId = 0;
    return (data) => (0, blockchain_1.createTestOrderedTransaction)(Object.assign({ orderId: orderId++ }, data));
}
const SEED = (0, crypto_1.randomBytes)(8);
let lastValue = (0, ethereumjs_util_1.keccak256)(SEED);
function weakRandomComparator(_left, _right) {
    lastValue = (0, ethereumjs_util_1.keccak256)(lastValue);
    const leftRandomId = new ethereumjs_util_1.BN(lastValue);
    lastValue = (0, ethereumjs_util_1.keccak256)(lastValue);
    const rightRandomId = new ethereumjs_util_1.BN(lastValue);
    return leftRandomId.cmp(rightRandomId);
}
describe(`TxPriorityHeap (tests using seed ${(0, ethereumjs_util_1.bufferToHex)(SEED)})`, () => {
    let createTestTransaction;
    beforeEach(() => {
        createTestTransaction = getTestTransactionFactory();
    });
    describe("Without base fee", function () {
        describe("EIP-1559 validation", function () {
            it("Should not accept an EIP-1559 tx if no base fee is used", function () {
                const tx1 = createTestTransaction({
                    maxFeePerGas: 1,
                    maxPriorityFeePerGas: 1,
                });
                chai_1.assert.throws(() => new TransactionQueue_1.TransactionQueue((0, makeOrderedTxMap_1.makeOrderedTxMap)([tx1]), "priority"), errors_1.InternalError);
            });
            describe("Sorting transactions", function () {
                it("Should use the gasPrice and order to sort txs", function () {
                    const tx1 = createTestTransaction({ gasPrice: 123 });
                    const tx2 = createTestTransaction({
                        gasPrice: 1000,
                    });
                    // This has the same gasPrice than tx2, but arrived later, so it's
                    // placed later in the queue
                    const tx3 = createTestTransaction({
                        gasPrice: 1000,
                    });
                    const tx4 = createTestTransaction({
                        gasPrice: 2000,
                    });
                    const txs = [tx1, tx2, tx3, tx4];
                    txs.sort(weakRandomComparator);
                    const queue = new TransactionQueue_1.TransactionQueue((0, makeOrderedTxMap_1.makeOrderedTxMap)(txs), "priority");
                    chai_1.assert.equal(queue.getNextTransaction(), tx4.data);
                    chai_1.assert.equal(queue.getNextTransaction(), tx2.data);
                    chai_1.assert.equal(queue.getNextTransaction(), tx3.data);
                    chai_1.assert.equal(queue.getNextTransaction(), tx1.data);
                });
            });
            it("Should not include transactions from a sender whose next tx was discarded", function () {
                const senderWithFirstTxNotMined = "0x0000000000000000000000000000000000000001";
                const senderWithThirdTxNotMined = "0x0000000000000000000000000000000000000002";
                const tx1 = createTestTransaction({
                    gasPrice: 100,
                });
                const tx2 = createTestTransaction({
                    gasPrice: 99,
                });
                // Not mined
                const tx3 = createTestTransaction({
                    gasPrice: 98,
                    from: senderWithFirstTxNotMined,
                    nonce: 0,
                });
                // Discarded
                const tx4 = createTestTransaction({
                    gasPrice: 97,
                    from: senderWithFirstTxNotMined,
                    nonce: 1,
                });
                const tx5 = createTestTransaction({
                    gasPrice: 96,
                    from: senderWithThirdTxNotMined,
                    nonce: 0,
                });
                const tx6 = createTestTransaction({
                    gasPrice: 95,
                    from: senderWithThirdTxNotMined,
                    nonce: 1,
                });
                // Not mined
                const tx7 = createTestTransaction({
                    gasPrice: 94,
                    from: senderWithThirdTxNotMined,
                    nonce: 2,
                });
                // Discarded
                const tx8 = createTestTransaction({
                    gasPrice: 93,
                    from: senderWithThirdTxNotMined,
                    nonce: 3,
                });
                const tx9 = createTestTransaction({
                    gasPrice: 92,
                });
                const tx10 = createTestTransaction({
                    gasPrice: 91,
                });
                const txs = [tx1, tx2, tx3, tx4, tx5, tx6, tx7, tx8, tx9, tx10];
                txs.sort(weakRandomComparator);
                const queue = new TransactionQueue_1.TransactionQueue((0, makeOrderedTxMap_1.makeOrderedTxMap)(txs), "priority");
                chai_1.assert.equal(queue.getNextTransaction(), tx1.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx2.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx3.data);
                queue.removeLastSenderTransactions();
                chai_1.assert.equal(queue.getNextTransaction(), tx5.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx6.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx7.data);
                queue.removeLastSenderTransactions();
                chai_1.assert.equal(queue.getNextTransaction(), tx9.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx10.data);
            });
        });
    });
    describe("With base fee", function () {
        describe("EIP-1559 validation", function () {
            it("Should accept an EIP-1559 tx", function () {
                const tx1 = createTestTransaction({
                    maxFeePerGas: 1,
                    maxPriorityFeePerGas: 1,
                });
                chai_1.assert.doesNotThrow(() => new TransactionQueue_1.TransactionQueue((0, makeOrderedTxMap_1.makeOrderedTxMap)([tx1]), "priority", new ethereumjs_util_1.BN(1)));
            });
        });
        describe("Sorting", function () {
            it("Should use the effective miner fee to sort txs", function () {
                const baseFee = new ethereumjs_util_1.BN(15);
                // Effective miner fee: 96
                const tx1 = createTestTransaction({ gasPrice: 111 });
                // Effective miner fee: 100
                const tx2 = createTestTransaction({
                    maxFeePerGas: 120,
                    maxPriorityFeePerGas: 100,
                });
                // Effective miner fee: 110
                const tx3 = createTestTransaction({
                    maxFeePerGas: 140,
                    maxPriorityFeePerGas: 110,
                });
                // Effective miner fee: 125
                const tx4 = createTestTransaction({
                    maxFeePerGas: 140,
                    maxPriorityFeePerGas: 130,
                });
                // Effective miner fee: 155
                const tx5 = createTestTransaction({ gasPrice: 170 });
                const txs = [tx1, tx2, tx3, tx4, tx5];
                txs.sort(weakRandomComparator);
                const queue = new TransactionQueue_1.TransactionQueue((0, makeOrderedTxMap_1.makeOrderedTxMap)(txs), "priority", baseFee);
                chai_1.assert.equal(queue.getNextTransaction(), tx5.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx4.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx3.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx2.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx1.data);
            });
            it("Should use the order to sort txs in FIFO mode", function () {
                const baseFee = new ethereumjs_util_1.BN(15);
                // Effective miner fee: 96
                const tx1 = createTestTransaction({ gasPrice: 111 });
                // Effective miner fee: 100
                const tx2 = createTestTransaction({
                    maxFeePerGas: 120,
                    maxPriorityFeePerGas: 100,
                });
                // Effective miner fee: 110
                const tx3 = createTestTransaction({
                    maxFeePerGas: 140,
                    maxPriorityFeePerGas: 110,
                });
                const txs = [tx1, tx2, tx3];
                const queue = new TransactionQueue_1.TransactionQueue((0, makeOrderedTxMap_1.makeOrderedTxMap)(txs), "fifo", baseFee);
                chai_1.assert.equal(queue.getNextTransaction(), tx1.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx2.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx3.data);
            });
            it("Should not include transactions from a sender whose next tx was discarded", function () {
                const baseFee = new ethereumjs_util_1.BN(20);
                const senderWithFirstTxNotMined = "0x0000000000000000000000000000000000000001";
                const senderWithSecondTxNotMined = "0x0000000000000000000000000000000000000002";
                // Effective miner fee: 80
                const tx1 = createTestTransaction({
                    gasPrice: 100,
                });
                // Effective miner fee: 79
                const tx2 = createTestTransaction({
                    maxPriorityFeePerGas: 79,
                    maxFeePerGas: 1000,
                });
                // Effective miner fee: 78
                const tx3 = createTestTransaction({
                    maxPriorityFeePerGas: 97,
                    maxFeePerGas: 98,
                });
                // Not mined
                // Effective miner fee: 77
                const tx4 = createTestTransaction({
                    gasPrice: 97,
                    from: senderWithFirstTxNotMined,
                    nonce: 2,
                });
                // Discarded
                // Effective miner fee: 76
                const tx5 = createTestTransaction({
                    gasPrice: 96,
                    from: senderWithFirstTxNotMined,
                    nonce: 3,
                });
                // Effective miner fee: 75
                const tx6 = createTestTransaction({
                    gasPrice: 95,
                    from: senderWithSecondTxNotMined,
                    nonce: 1,
                });
                // Not mined
                // Effective miner fee: 74
                const tx7 = createTestTransaction({
                    gasPrice: 94,
                    from: senderWithSecondTxNotMined,
                    nonce: 2,
                });
                // Discarded
                // Effective miner fee: 73
                const tx8 = createTestTransaction({
                    gasPrice: 93,
                    from: senderWithSecondTxNotMined,
                    nonce: 3,
                });
                // Discarded
                // Effective miner fee: 72
                const tx9 = createTestTransaction({
                    maxFeePerGas: 92,
                    maxPriorityFeePerGas: 80,
                    from: senderWithSecondTxNotMined,
                    nonce: 4,
                });
                // Effective miner fee: 71
                const tx10 = createTestTransaction({
                    gasPrice: 91,
                });
                const txs = [tx1, tx2, tx3, tx4, tx5, tx6, tx7, tx8, tx9, tx10];
                txs.sort(weakRandomComparator);
                const queue = new TransactionQueue_1.TransactionQueue((0, makeOrderedTxMap_1.makeOrderedTxMap)(txs), "priority", baseFee);
                chai_1.assert.equal(queue.getNextTransaction(), tx1.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx2.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx3.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx4.data);
                queue.removeLastSenderTransactions();
                chai_1.assert.equal(queue.getNextTransaction(), tx6.data);
                chai_1.assert.equal(queue.getNextTransaction(), tx7.data);
                queue.removeLastSenderTransactions();
                chai_1.assert.equal(queue.getNextTransaction(), tx10.data);
            });
        });
    });
});
//# sourceMappingURL=TransactionQueue.js.map