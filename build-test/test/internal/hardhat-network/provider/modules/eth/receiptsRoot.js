"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const base_types_1 = require("../../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../../utils/workaround-windows-ci-failures");
const cwd_1 = require("../../../helpers/cwd");
const providers_1 = require("../../../helpers/providers");
const retrieveForkBlockNumber_1 = require("../../../helpers/retrieveForkBlockNumber");
const getPendingBaseFeePerGas_1 = require("../../../helpers/getPendingBaseFeePerGas");
describe("Eth module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork }) => {
        if (isFork) {
            this.timeout(50000);
        }
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork });
        describe(`${name} provider`, function () {
            (0, cwd_1.setCWD)();
            useProvider();
            const getFirstBlock = async () => isFork ? (0, retrieveForkBlockNumber_1.retrieveForkBlockNumber)(this.ctx.hardhatNetworkProvider) : 0;
            describe("receiptsRoot", function () {
                let firstBlock;
                beforeEach(async function () {
                    firstBlock = await getFirstBlock();
                });
                it("should have the right receiptsRoot when mining 1 tx", async function () {
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        },
                    ]);
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                        false,
                    ]);
                    chai_1.assert.equal(block.receiptsRoot, "0x056b23fbba480696b65fe5a59b8f2148a1299103c4f57df839233af2cf4ca2d2");
                });
                it("should have the right receiptsRoot when mining 2 txs", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        },
                    ]);
                    await this.provider.send("evm_mine", []);
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                        false,
                    ]);
                    chai_1.assert.equal(block.receiptsRoot, "0xd95b673818fa493deec414e01e610d97ee287c9421c8eff4102b1647c1a184e4");
                });
            });
        });
    });
});
//# sourceMappingURL=receiptsRoot.js.map