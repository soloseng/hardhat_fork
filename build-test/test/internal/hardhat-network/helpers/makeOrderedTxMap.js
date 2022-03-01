"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeOrderedTxMap = void 0;
function makeOrderedTxMap(txs) {
    var _a;
    const map = new Map();
    for (const tx of txs) {
        const address = tx.data.getSenderAddress().toString();
        const txList = (_a = map.get(address)) !== null && _a !== void 0 ? _a : [];
        txList.push(tx);
        map.set(address, txList);
    }
    for (const txList of map.values()) {
        txList.sort((tx1, tx2) => tx1.data.nonce.cmp(tx2.data.nonce));
    }
    return map;
}
exports.makeOrderedTxMap = makeOrderedTxMap;
//# sourceMappingURL=makeOrderedTxMap.js.map