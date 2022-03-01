"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingBaseFeePerGas = void 0;
const base_types_1 = require("../../../../src/internal/core/jsonrpc/types/base-types");
async function getPendingBaseFeePerGas(provider) {
    var _a;
    const pendingBlock = await provider.send("eth_getBlockByNumber", [
        "pending",
        false,
    ]);
    return (0, base_types_1.rpcQuantityToBN)((_a = pendingBlock.baseFeePerGas) !== null && _a !== void 0 ? _a : "0x1");
}
exports.getPendingBaseFeePerGas = getPendingBaseFeePerGas;
//# sourceMappingURL=getPendingBaseFeePerGas.js.map