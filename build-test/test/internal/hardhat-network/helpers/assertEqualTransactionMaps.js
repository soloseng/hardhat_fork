"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertEqualTransactionLists = exports.assertEqualTransactionMaps = void 0;
const chai_1 = require("chai");
const random_1 = require("../../../../src/internal/hardhat-network/provider/fork/random");
const blockchain_1 = require("./blockchain");
function assertEqualTransactionMaps(actual, expected) {
    chai_1.assert.equal(actual.size, expected.size, "Map sizes do not match");
    actual.forEach((actualList, key) => {
        const expectedList = expected.get(key);
        chai_1.assert.exists(expectedList, `Expected map doesn't have ${key} value`);
        assertEqualTransactionLists(actualList, expectedList);
    });
}
exports.assertEqualTransactionMaps = assertEqualTransactionMaps;
function assertEqualTransactionLists(actual, expected) {
    chai_1.assert.deepEqual(actual.map((tx) => tx.orderId), expected.map((tx) => tx.orderId));
    chai_1.assert.deepEqual(actual.map((tx) => tx.data.raw), expected.map((tx) => tx.data.raw));
}
exports.assertEqualTransactionLists = assertEqualTransactionLists;
// TODO: This probably is wrong, as we are returning the same data,
// whereas it was copied before. This should be removed along with
// immutable.js
function cloneTransaction({ orderId, data, }) {
    return {
        orderId,
        data,
    };
}
describe("assertEqualTransactionMaps", () => {
    it("does not throw if maps are equal", async () => {
        const tx1 = (0, blockchain_1.createTestOrderedTransaction)({ orderId: 0 });
        const tx2 = (0, blockchain_1.createTestOrderedTransaction)({ orderId: 1 });
        const tx1Copy = cloneTransaction(tx1);
        const tx2Copy = cloneTransaction(tx2);
        const actualMap = new Map();
        actualMap.set(tx1.data.getSenderAddress().toString(), [tx1]);
        actualMap.set(tx2.data.getSenderAddress().toString(), [tx2]);
        const expectedMap = new Map(actualMap);
        expectedMap.set(tx1.data.getSenderAddress().toString(), [tx1Copy]);
        expectedMap.set(tx2.data.getSenderAddress().toString(), [tx2Copy]);
        chai_1.assert.doesNotThrow(() => {
            assertEqualTransactionMaps(actualMap, expectedMap);
        });
    });
    it("throws if maps don't have the same size", () => {
        // Actual:
        // A -> [1, 2]
        // Expected:
        // A -> [1, 2]
        // B -> [1]
        const accountA = (0, random_1.randomAddress)();
        const accountB = (0, random_1.randomAddress)();
        const txA1 = (0, blockchain_1.createTestOrderedTransaction)({
            orderId: 0,
            nonce: 1,
            from: accountA,
        });
        const txA2 = (0, blockchain_1.createTestOrderedTransaction)({
            orderId: 1,
            nonce: 2,
            from: accountA,
        });
        const txB1 = (0, blockchain_1.createTestOrderedTransaction)({
            orderId: 2,
            nonce: 1,
            from: accountB,
        });
        const txA1Copy = cloneTransaction(txA1);
        const txA2Copy = cloneTransaction(txA2);
        const txB1Copy = cloneTransaction(txB1);
        const actualMap = new Map();
        actualMap.set(accountA.toString(), [txA1, txA2]);
        const expectedMap = new Map(actualMap);
        expectedMap.set(accountA.toString(), [txA1Copy, txA2Copy]);
        expectedMap.set(accountB.toString(), [txB1Copy]);
        chai_1.assert.throws(() => {
            assertEqualTransactionMaps(actualMap, expectedMap);
        });
    });
    it("throws if maps have the same size but the elements don't match", async () => {
        // Actual:
        // A -> [1, 2]
        // B -> []
        // Expected:
        // A -> [1, 2]
        // C -> []
        const accountA = (0, random_1.randomAddress)();
        const accountB = (0, random_1.randomAddress)();
        const accountC = (0, random_1.randomAddress)();
        const txA1 = (0, blockchain_1.createTestOrderedTransaction)({
            orderId: 0,
            nonce: 1,
            from: accountA,
        });
        const txA2 = (0, blockchain_1.createTestOrderedTransaction)({
            orderId: 1,
            nonce: 2,
            from: accountA,
        });
        const txA1Copy = cloneTransaction(txA1);
        const txA2Copy = cloneTransaction(txA2);
        const actualMap = new Map();
        actualMap.set(accountA.toString(), [txA1, txA2]);
        actualMap.set(accountB.toString(), []);
        const expectedMap = new Map(actualMap);
        expectedMap.set(accountA.toString(), [txA1Copy, txA2Copy]);
        actualMap.set(accountC.toString(), []);
        chai_1.assert.throws(() => {
            assertEqualTransactionMaps(actualMap, expectedMap);
        });
    });
    it("throws if one of map values don't match", async () => {
        // Actual:
        // A -> [1, 3]
        // B -> [1]
        // Expected:
        // A -> [1, 2]
        // B -> [1]
        const accountA = (0, random_1.randomAddress)();
        const accountB = (0, random_1.randomAddress)();
        const txA1 = (0, blockchain_1.createTestOrderedTransaction)({
            orderId: 0,
            nonce: 1,
            from: accountA,
        });
        const txA2 = (0, blockchain_1.createTestOrderedTransaction)({
            orderId: 1,
            nonce: 2,
            from: accountA,
        });
        const txA3 = (0, blockchain_1.createTestOrderedTransaction)({
            orderId: 2,
            nonce: 3,
            from: accountA,
        });
        const txB1 = (0, blockchain_1.createTestOrderedTransaction)({
            orderId: 3,
            nonce: 1,
            from: accountB,
        });
        const txA1Copy = cloneTransaction(txA1);
        const txA2Copy = cloneTransaction(txA2);
        const txB1Copy = cloneTransaction(txB1);
        const actualMap = new Map();
        actualMap.set(accountA.toString(), [txA1, txA3]);
        actualMap.set(accountB.toString(), [txB1]);
        const expectedMap = new Map(actualMap);
        expectedMap.set(accountA.toString(), [txA1Copy, txA2Copy]);
        expectedMap.set(accountB.toString(), [txB1Copy]);
        chai_1.assert.throws(() => {
            assertEqualTransactionMaps(actualMap, expectedMap);
        });
    });
});
describe("assertEqualTransactionLists", () => {
    it("does not throw if the lists have the same content", async () => {
        const tx1 = (0, blockchain_1.createTestOrderedTransaction)({ orderId: 0 });
        const tx2 = (0, blockchain_1.createTestOrderedTransaction)({ orderId: 1 });
        const tx1Copy = cloneTransaction(tx1);
        const tx2Copy = cloneTransaction(tx2);
        chai_1.assert.doesNotThrow(() => assertEqualTransactionLists([tx1, tx2], [tx1Copy, tx2Copy]));
    });
    it("throws if the order of elements in lists is not the same", async () => {
        const tx1 = (0, blockchain_1.createTestOrderedTransaction)({ orderId: 0 });
        const tx2 = (0, blockchain_1.createTestOrderedTransaction)({ orderId: 1 });
        const tx1Copy = cloneTransaction(tx1);
        const tx2Copy = cloneTransaction(tx2);
        chai_1.assert.throws(() => assertEqualTransactionLists([tx1, tx2], [tx2Copy, tx1Copy]));
    });
    it("throws if the lists don't have the same content", async () => {
        const tx1 = (0, blockchain_1.createTestOrderedTransaction)({ orderId: 0 });
        const tx2 = (0, blockchain_1.createTestOrderedTransaction)({ orderId: 1 });
        const tx1Copy = cloneTransaction(tx1);
        chai_1.assert.throws(() => assertEqualTransactionLists([tx1, tx2], [tx1Copy, tx1Copy]));
    });
    it("throws if the lists don't have the same length", async () => {
        const tx1 = (0, blockchain_1.createTestOrderedTransaction)({ orderId: 0 });
        const tx2 = (0, blockchain_1.createTestOrderedTransaction)({ orderId: 1 });
        const tx1Copy = cloneTransaction(tx1);
        chai_1.assert.throws(() => assertEqualTransactionLists([tx1, tx2], [tx1Copy]));
    });
});
//# sourceMappingURL=assertEqualTransactionMaps.js.map