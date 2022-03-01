"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHelpers = void 0;
const chai_1 = require("chai");
const base_types_1 = require("../../../../src/internal/core/jsonrpc/types/base-types");
const providers_1 = require("./providers");
/**
 * @deprecated
 */
function useHelpers() {
    beforeEach("Initialize helpers", async function () {
        if (this.provider === undefined) {
            throw new Error("useHelpers has to be called after useProvider");
        }
        this.sendTx = async ({ from = providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1], to = providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2], gas = 21000, gasPrice, data, nonce, value, } = {}) => {
            const price = gasPrice !== null && gasPrice !== void 0 ? gasPrice : (0, base_types_1.rpcQuantityToBN)(await this.provider.send("eth_gasPrice", []));
            return this.provider.send("eth_sendTransaction", [
                {
                    from,
                    to,
                    gas: (0, base_types_1.numberToRpcQuantity)(gas),
                    gasPrice: (0, base_types_1.numberToRpcQuantity)(price),
                    data,
                    nonce: nonce !== undefined ? (0, base_types_1.numberToRpcQuantity)(nonce) : undefined,
                    value: value !== undefined ? (0, base_types_1.numberToRpcQuantity)(value) : undefined,
                },
            ]);
        };
        this.assertLatestBlockTxs = async (txs) => {
            const latestBlock = await this.provider.send("eth_getBlockByNumber", [
                "latest",
                false,
            ]);
            chai_1.assert.sameMembers(txs, latestBlock.transactions);
        };
        this.assertPendingTxs = async (txs) => {
            const pendingTxs = await this.provider.send("eth_pendingTransactions");
            const pendingTxsHashes = pendingTxs.map((x) => x.hash);
            chai_1.assert.sameMembers(txs, pendingTxsHashes);
        };
        this.mine = async () => {
            await this.provider.send("evm_mine");
        };
    });
    afterEach("Remove helpers", async function () {
        delete this.sendTx;
        delete this.assertLatestBlockTxs;
        delete this.assertPendingTxs;
        delete this.mine;
    });
}
exports.useHelpers = useHelpers;
//# sourceMappingURL=useHelpers.js.map