"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const immutable_1 = require("immutable");
const TxPool_1 = require("../../../../../src/internal/hardhat-network/provider/TxPool");
const reorganizeTransactionsLists_1 = require("../../../../../src/internal/hardhat-network/provider/utils/reorganizeTransactionsLists");
const blockchain_1 = require("../../helpers/blockchain");
function getTestTransactionFactory() {
    let orderId = 0;
    return (data) => (0, blockchain_1.createTestSerializedTransaction)(Object.assign({ orderId: orderId++ }, data));
}
function retrieveNonce(tx) {
    // We create this tx to get the same common
    const txForCommon = (0, blockchain_1.createTestOrderedTransaction)({ orderId: 0 });
    return (0, TxPool_1.deserializeTransaction)(tx, txForCommon.data.common).data.nonce;
}
describe("reorganizeTransactionsLists", () => {
    let createTestTransaction;
    beforeEach(() => {
        createTestTransaction = getTestTransactionFactory();
    });
    describe("when there are no transactions to move", () => {
        it("does not move", () => {
            // pending: [1]
            // queued: [3, 4]
            const tx1 = createTestTransaction({ nonce: 1 });
            const tx3 = createTestTransaction({ nonce: 3 });
            const tx4 = createTestTransaction({ nonce: 4 });
            const pending = immutable_1.List.of(tx1);
            const queued = immutable_1.List.of(tx3, tx4);
            const { newPending, newQueued } = (0, reorganizeTransactionsLists_1.reorganizeTransactionsLists)(pending, queued, retrieveNonce);
            chai_1.assert.deepEqual(newPending.toArray(), pending.toArray());
            chai_1.assert.deepEqual(newQueued.toArray(), queued.toArray());
        });
    });
    describe("when all transactions should be moved", () => {
        it("moves all transactions", () => {
            // pending: [1]
            // queued: [2, 3]
            const tx1 = createTestTransaction({ nonce: 1 });
            const tx2 = createTestTransaction({ nonce: 2 });
            const tx3 = createTestTransaction({ nonce: 3 });
            const { newPending, newQueued } = (0, reorganizeTransactionsLists_1.reorganizeTransactionsLists)(immutable_1.List.of(tx1), immutable_1.List.of(tx2, tx3), retrieveNonce);
            chai_1.assert.deepEqual(newPending.toArray(), [tx1, tx2, tx3]);
            chai_1.assert.deepEqual(newQueued.toArray(), []);
        });
    });
    describe("when some but not all transactions should be moved", () => {
        it("moves proper transactions from sorted queued list", () => {
            // pending: [1]
            // queued: [2, 4]
            const tx1 = createTestTransaction({ nonce: 1 });
            const tx2 = createTestTransaction({ nonce: 2 });
            const tx4 = createTestTransaction({ nonce: 4 });
            const { newPending, newQueued } = (0, reorganizeTransactionsLists_1.reorganizeTransactionsLists)(immutable_1.List.of(tx1), immutable_1.List.of(tx2, tx4), retrieveNonce);
            chai_1.assert.deepEqual(newPending.toArray(), [tx1, tx2]);
            chai_1.assert.deepEqual(newQueued.toArray(), [tx4]);
        });
        it("moves proper transactions from unsorted queued list", () => {
            // pending: [1]
            // queued: [4, 2]
            const tx1 = createTestTransaction({ nonce: 1 });
            const tx2 = createTestTransaction({ nonce: 2 });
            const tx4 = createTestTransaction({ nonce: 4 });
            const { newPending, newQueued } = (0, reorganizeTransactionsLists_1.reorganizeTransactionsLists)(immutable_1.List.of(tx1), immutable_1.List.of(tx4, tx2), retrieveNonce);
            chai_1.assert.deepEqual(newPending.toArray(), [tx1, tx2]);
            chai_1.assert.deepEqual(newQueued.toArray(), [tx4]);
        });
        it("moves transactions from unsorted queued list leaving the ones that should stay", () => {
            // pending: [1]
            // queued: [3, 4, 2, 5, 8]
            const tx1 = createTestTransaction({ nonce: 1 });
            const tx2 = createTestTransaction({ nonce: 2 });
            const tx3 = createTestTransaction({ nonce: 3 });
            const tx4 = createTestTransaction({ nonce: 4 });
            const tx5 = createTestTransaction({ nonce: 5 });
            const tx8 = createTestTransaction({ nonce: 8 });
            const { newPending, newQueued } = (0, reorganizeTransactionsLists_1.reorganizeTransactionsLists)(immutable_1.List.of(tx1), immutable_1.List.of(tx3, tx4, tx2, tx5, tx8), retrieveNonce);
            chai_1.assert.deepEqual(newPending.toArray(), [tx1, tx2, tx3, tx4, tx5]);
            chai_1.assert.deepEqual(newQueued.toArray(), [tx8]);
        });
    });
});
//# sourceMappingURL=reorganizeTransactionsLists.js.map