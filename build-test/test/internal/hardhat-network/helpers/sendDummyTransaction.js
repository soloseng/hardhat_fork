"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDummyTransaction = void 0;
const base_types_1 = require("../../../../src/internal/core/jsonrpc/types/base-types");
const providers_1 = require("./providers");
async function sendDummyTransaction(provider, nonce, { from = providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0], to = providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1], accessList, gas = 21000, } = {}) {
    const tx = {
        from,
        to,
        nonce: (0, base_types_1.numberToRpcQuantity)(nonce),
        gas: (0, base_types_1.numberToRpcQuantity)(gas),
    };
    if (accessList !== undefined) {
        tx.accessList = accessList;
    }
    return provider.send("eth_sendTransaction", [tx]);
}
exports.sendDummyTransaction = sendDummyTransaction;
//# sourceMappingURL=sendDummyTransaction.js.map