"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertLatestBlockNumber = exports.assertEqualAccessLists = exports.assertEIP1559Transaction = exports.assertAccessListTransaction = exports.assertLegacyTransaction = exports.assertReceiptMatchesGethOne = exports.assertTransactionFailure = exports.assertPendingNodeBalances = exports.assertNodeBalances = exports.assertQuantity = exports.assertInvalidInputError = exports.assertInvalidArgumentsError = exports.assertInternalError = exports.assertNotSupported = exports.assertProviderError = void 0;
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const base_types_1 = require("../../../../src/internal/core/jsonrpc/types/base-types");
const errors_1 = require("../../../../src/internal/core/providers/errors");
const solidity_errors_1 = require("../../../../src/internal/hardhat-network/stack-traces/solidity-errors");
async function assertProviderError(provider, method, params = [], message, code) {
    let res;
    try {
        res = await provider.send(method, params);
    }
    catch (error) {
        if (!isProviderError(error)) {
            // This is not a provider error, so we rethrow it, as something broke
            throw error;
        }
        if (code !== undefined) {
            chai_1.assert.equal(error.code, code);
        }
        if (message !== undefined) {
            chai_1.assert.include(error.message, message);
        }
        return;
    }
    chai_1.assert.fail(`Method ${method} should have thrown [${code}] ${message} but returned ${res}`);
}
exports.assertProviderError = assertProviderError;
async function assertNotSupported(provider, method) {
    return assertProviderError(provider, method, [], `Method ${method} is not supported`, errors_1.MethodNotSupportedError.CODE);
}
exports.assertNotSupported = assertNotSupported;
async function assertInternalError(provider, method, params = [], message) {
    return assertProviderError(provider, method, params, message, errors_1.InternalError.CODE);
}
exports.assertInternalError = assertInternalError;
async function assertInvalidArgumentsError(provider, method, params = [], message) {
    return assertProviderError(provider, method, params, message, errors_1.InvalidArgumentsError.CODE);
}
exports.assertInvalidArgumentsError = assertInvalidArgumentsError;
async function assertInvalidInputError(provider, method, params = [], message) {
    return assertProviderError(provider, method, params, message, errors_1.InvalidInputError.CODE);
}
exports.assertInvalidInputError = assertInvalidInputError;
function assertQuantity(actual, quantity, message) {
    chai_1.assert.strictEqual(actual, (0, base_types_1.numberToRpcQuantity)(quantity), message);
}
exports.assertQuantity = assertQuantity;
async function assertNodeBalances(provider, expectedBalances) {
    const accounts = await provider.send("eth_accounts");
    const balances = await Promise.all(accounts.map((acc) => provider.send("eth_getBalance", [acc])));
    chai_1.assert.deepEqual(balances, expectedBalances.map(base_types_1.numberToRpcQuantity));
}
exports.assertNodeBalances = assertNodeBalances;
async function assertPendingNodeBalances(provider, expectedBalances) {
    const accounts = await provider.send("eth_accounts");
    const balances = await Promise.all(accounts.map((acc) => provider.send("eth_getBalance", [acc, "pending"])));
    chai_1.assert.deepEqual(balances, expectedBalances.map(base_types_1.numberToRpcQuantity));
}
exports.assertPendingNodeBalances = assertPendingNodeBalances;
function isProviderError(error) {
    return typeof error.code === "number" && typeof error.message === "string";
}
async function assertTransactionFailure(provider, txData, message, code) {
    try {
        await provider.send("eth_sendTransaction", [txData]);
    }
    catch (error) {
        if (!(error instanceof solidity_errors_1.SolidityError) && !isProviderError(error)) {
            // Something broke here, so we rethrow
            throw error;
        }
        if (code !== undefined) {
            if (error instanceof solidity_errors_1.SolidityError) {
                chai_1.assert.fail(`Expected a ProviderError with code ${code} but got a SolidityError instead`);
            }
            chai_1.assert.equal(error.code, code);
        }
        if (message !== undefined) {
            chai_1.assert.include(error.message, message);
        }
        return;
    }
    chai_1.assert.fail("Transaction should have failed");
}
exports.assertTransactionFailure = assertTransactionFailure;
function assertReceiptMatchesGethOne(actual, gethReceipt, expectedBlockNumber) {
    assertQuantity(actual.blockNumber, expectedBlockNumber);
    chai_1.assert.strictEqual(actual.transactionIndex, gethReceipt.transactionIndex);
    chai_1.assert.strictEqual(actual.to, gethReceipt.to);
    chai_1.assert.strictEqual(actual.logsBloom, gethReceipt.logsBloom);
    chai_1.assert.deepEqual(actual.logs, gethReceipt.logs);
    chai_1.assert.strictEqual(actual.status, gethReceipt.status);
    chai_1.assert.deepEqual(actual.cumulativeGasUsed, gethReceipt.cumulativeGasUsed);
}
exports.assertReceiptMatchesGethOne = assertReceiptMatchesGethOne;
function assertTransaction(tx, txHash, txParams, blockNumber, blockHash, txIndex) {
    chai_1.assert.equal(tx.from, (0, ethereumjs_util_1.bufferToHex)(txParams.from));
    assertQuantity(tx.gas, txParams.gasLimit);
    chai_1.assert.equal(tx.hash, txHash);
    chai_1.assert.equal(tx.input, (0, ethereumjs_util_1.bufferToHex)(txParams.data));
    assertQuantity(tx.nonce, txParams.nonce);
    chai_1.assert.equal(tx.to, txParams.to === undefined ? null : (0, ethereumjs_util_1.bufferToHex)(txParams.to));
    assertQuantity(tx.value, txParams.value);
    if (blockHash !== undefined) {
        chai_1.assert.equal(tx.blockHash, blockHash);
    }
    else {
        chai_1.assert.isNull(tx.blockHash);
    }
    if (txIndex !== undefined) {
        assertQuantity(tx.transactionIndex, txIndex);
    }
    else {
        chai_1.assert.isNull(tx.transactionIndex);
    }
    if (blockNumber !== undefined) {
        assertQuantity(tx.blockNumber, blockNumber);
    }
    else {
        chai_1.assert.isNull(tx.blockNumber);
    }
    // We just want to validate that these are QUANTITY encoded
    chai_1.assert.isTrue(base_types_1.rpcQuantity.decode(tx.r).isRight());
    chai_1.assert.isTrue(base_types_1.rpcQuantity.decode(tx.s).isRight());
    chai_1.assert.isTrue(base_types_1.rpcQuantity.decode(tx.v).isRight());
}
function assertLegacyTransaction(tx, txHash, txParams, blockNumber, blockHash, txIndex) {
    assertTransaction(tx, txHash, txParams, blockNumber, blockHash, txIndex);
    assertQuantity(tx.gasPrice, txParams.gasPrice);
}
exports.assertLegacyTransaction = assertLegacyTransaction;
function assertAccessListTransaction(tx, txHash, txParams, blockNumber, blockHash, txIndex) {
    var _a;
    assertTransaction(tx, txHash, txParams, blockNumber, blockHash, txIndex);
    chai_1.assert.equal(tx.type, "0x1");
    assertQuantity(tx.gasPrice, txParams.gasPrice);
    assertEqualAccessLists((_a = tx.accessList) !== null && _a !== void 0 ? _a : [], txParams.accessList);
}
exports.assertAccessListTransaction = assertAccessListTransaction;
function assertEIP1559Transaction(tx, txHash, txParams, blockNumber, blockHash, txIndex) {
    var _a;
    assertTransaction(tx, txHash, txParams, blockNumber, blockHash, txIndex);
    chai_1.assert.equal(tx.type, "0x2");
    assertQuantity(tx.maxFeePerGas, txParams.maxFeePerGas);
    assertQuantity(tx.maxPriorityFeePerGas, txParams.maxPriorityFeePerGas);
    assertEqualAccessLists((_a = tx.accessList) !== null && _a !== void 0 ? _a : [], txParams.accessList);
}
exports.assertEIP1559Transaction = assertEIP1559Transaction;
function assertEqualAccessLists(txAccessList, txParamsAccessList) {
    chai_1.assert.equal(txAccessList.length, txParamsAccessList.length);
    for (const [i, txAccessListItem] of txAccessList.entries()) {
        const txParamsAccessListItem = txParamsAccessList[i];
        chai_1.assert.equal(txAccessListItem.address, (0, ethereumjs_util_1.bufferToHex)(txParamsAccessListItem[0]));
        chai_1.assert.deepEqual(txAccessListItem.storageKeys, txParamsAccessListItem[1].map(ethereumjs_util_1.bufferToHex));
    }
}
exports.assertEqualAccessLists = assertEqualAccessLists;
async function assertLatestBlockNumber(provider, latestBlockNumber) {
    const block = await provider.send("eth_getBlockByNumber", ["latest", false]);
    chai_1.assert.isNotNull(block);
    chai_1.assert.equal(block.number, (0, base_types_1.numberToRpcQuantity)(latestBlockNumber));
}
exports.assertLatestBlockNumber = assertLatestBlockNumber;
//# sourceMappingURL=assertions.js.map