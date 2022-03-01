"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestLog = exports.createTestReceipt = exports.createTestSerializedTransaction = exports.createTestOrderedTransaction = exports.createTestFakeTransaction = exports.createTestTransaction = void 0;
const tx_1 = require("@ethereumjs/tx");
const ethereumjs_util_1 = require("ethereumjs-util");
const base_types_1 = require("../../../../src/internal/core/jsonrpc/types/base-types");
const random_1 = require("../../../../src/internal/hardhat-network/provider/fork/random");
const FakeSenderTransaction_1 = require("../../../../src/internal/hardhat-network/provider/transactions/FakeSenderTransaction");
const TxPool_1 = require("../../../../src/internal/hardhat-network/provider/TxPool");
const FakeSenderAccessListEIP2930Transaction_1 = require("../../../../src/internal/hardhat-network/provider/transactions/FakeSenderAccessListEIP2930Transaction");
const FakeSenderEIP1559Transaction_1 = require("../../../../src/internal/hardhat-network/provider/transactions/FakeSenderEIP1559Transaction");
function createTestTransaction(data = {}) {
    return new tx_1.Transaction(Object.assign({ to: (0, random_1.randomAddress)() }, data));
}
exports.createTestTransaction = createTestTransaction;
function createTestFakeTransaction(data = {}) {
    var _a;
    const from = (_a = data.from) !== null && _a !== void 0 ? _a : (0, random_1.randomAddress)();
    const fromAddress = Buffer.isBuffer(from)
        ? new ethereumjs_util_1.Address(from)
        : typeof from === "string"
            ? ethereumjs_util_1.Address.fromString(from)
            : from;
    if ("gasPrice" in data &&
        ("maxFeePerGas" in data || "maxPriorityFeePerGas" in data)) {
        throw new Error("Invalid test fake transaction being created: both gasPrice and EIP-1559 params received");
    }
    if ("maxFeePerGas" in data !== "maxPriorityFeePerGas" in data) {
        throw new Error("Invalid test fake transaction being created: both EIP-1559 params should be provided, or none of them");
    }
    const type = data.type !== undefined
        ? new ethereumjs_util_1.BN((0, ethereumjs_util_1.toBuffer)(data.type))
        : "maxFeePerGas" in data || "maxPriorityFeePerGas" in data
            ? new ethereumjs_util_1.BN(2)
            : "accessList" in data
                ? new ethereumjs_util_1.BN(1)
                : new ethereumjs_util_1.BN(0);
    const dataWithDefaults = Object.assign({ to: (0, random_1.randomAddress)(), nonce: 1, gasLimit: 30000 }, data);
    if (type.eqn(0)) {
        return new FakeSenderTransaction_1.FakeSenderTransaction(fromAddress, dataWithDefaults);
    }
    if (type.eqn(1)) {
        return new FakeSenderAccessListEIP2930Transaction_1.FakeSenderAccessListEIP2930Transaction(fromAddress, dataWithDefaults);
    }
    return new FakeSenderEIP1559Transaction_1.FakeSenderEIP1559Transaction(fromAddress, Object.assign(Object.assign({}, dataWithDefaults), { gasPrice: undefined }));
}
exports.createTestFakeTransaction = createTestFakeTransaction;
function createTestOrderedTransaction(_a) {
    var { orderId } = _a, rest = __rest(_a, ["orderId"]);
    return {
        orderId,
        data: createTestFakeTransaction(rest),
    };
}
exports.createTestOrderedTransaction = createTestOrderedTransaction;
function createTestSerializedTransaction(data) {
    const tx = createTestOrderedTransaction(data);
    return (0, TxPool_1.serializeTransaction)(tx);
}
exports.createTestSerializedTransaction = createTestSerializedTransaction;
function createTestReceipt(transaction, logs = []) {
    const receipt = {
        transactionHash: (0, ethereumjs_util_1.bufferToHex)(transaction.hash()),
        logs,
        // we ignore other properties for test purposes
    };
    return receipt;
}
exports.createTestReceipt = createTestReceipt;
function createTestLog(blockNumber) {
    const log = {
        address: (0, random_1.randomAddress)(),
        blockNumber: (0, base_types_1.numberToRpcQuantity)(blockNumber),
        // we ignore other properties for test purposes
    };
    return log;
}
exports.createTestLog = createTestLog;
//# sourceMappingURL=blockchain.js.map