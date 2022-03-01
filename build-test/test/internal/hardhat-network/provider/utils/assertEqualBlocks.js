"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertEqualBlocks = void 0;
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const base_types_1 = require("../../../../../src/internal/core/jsonrpc/types/base-types");
/* eslint-disable @typescript-eslint/dot-notation */
async function assertEqualBlocks(block, afterBlockEvent, expectedBlock, forkClient) {
    const localReceiptRoot = block.header.receiptTrie.toString("hex");
    const remoteReceiptRoot = expectedBlock.receiptsRoot.toString("hex");
    // We do some manual comparisons here to understand why the root of the receipt tries differ.
    if (localReceiptRoot !== remoteReceiptRoot) {
        for (let i = 0; i < block.transactions.length; i++) {
            const tx = block.transactions[i];
            const txHash = (0, ethereumjs_util_1.bufferToHex)(tx.hash());
            const remoteReceipt = (await forkClient["_httpProvider"].request({
                method: "eth_getTransactionReceipt",
                params: [txHash],
            }));
            const localReceipt = afterBlockEvent.receipts[i];
            const evmResult = afterBlockEvent.results[i];
            chai_1.assert.equal((0, ethereumjs_util_1.bufferToHex)(localReceipt.bitvector), remoteReceipt.logsBloom, `Logs bloom of tx index ${i} (${txHash}) should match`);
            chai_1.assert.equal((0, base_types_1.numberToRpcQuantity)(evmResult.gasUsed.toNumber()), remoteReceipt.gasUsed, `Gas used of tx index ${i} (${txHash}) should match`);
            chai_1.assert.equal(localReceipt.status, remoteReceipt.status, `Status of tx index ${i} (${txHash}) should be the same`);
            chai_1.assert.equal(evmResult.createdAddress === undefined
                ? undefined
                : `0x${evmResult.createdAddress.toString()}`, remoteReceipt.contractAddress, `Contract address created by tx index ${i} (${txHash}) should be the same`);
        }
    }
    chai_1.assert.equal(localReceiptRoot, remoteReceiptRoot, "The root of the receipts trie is different than expected");
}
exports.assertEqualBlocks = assertEqualBlocks;
//# sourceMappingURL=assertEqualBlocks.js.map