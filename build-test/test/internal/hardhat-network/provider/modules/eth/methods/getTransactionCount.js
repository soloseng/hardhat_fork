"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethereumjs_util_1 = require("ethereumjs-util");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const random_1 = require("../../../../../../../src/internal/hardhat-network/provider/fork/random");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../../../helpers/assertions");
const cwd_1 = require("../../../../helpers/cwd");
const getPendingBaseFeePerGas_1 = require("../../../../helpers/getPendingBaseFeePerGas");
const providers_1 = require("../../../../helpers/providers");
const retrieveForkBlockNumber_1 = require("../../../../helpers/retrieveForkBlockNumber");
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
            describe("eth_getTransactionCount", async function () {
                it("Should return 0 for random accounts", async function () {
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                        (0, ethereumjs_util_1.zeroAddress)(),
                    ]), 0);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                        "0x0000000000000000000000000000000000000001",
                    ]), 0);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                        "0x0001231287316387168230000000000000000001",
                    ]), 0);
                });
                it("Should return the updated count after a transaction is made", async function () {
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    ]), 0);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        },
                    ]);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    ]), 1);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                    ]), 0);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        },
                    ]);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    ]), 1);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                    ]), 1);
                });
                it("Should not be affected by calls", async function () {
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    ]), 0);
                    await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        },
                    ]);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    ]), 0);
                });
                it("Should leverage block tag parameter", async function () {
                    const firstBlock = await getFirstBlock();
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                        },
                    ]);
                    if (!isFork) {
                        (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                            providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            "earliest",
                        ]), 0);
                    }
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        (0, base_types_1.numberToRpcQuantity)(firstBlock),
                    ]), 0);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        "latest",
                    ]), 1);
                });
                it("Should return transaction count in context of a new block with 'pending' block tag param", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                        },
                    ]);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        "latest",
                    ]), 0);
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getTransactionCount", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        "pending",
                    ]), 1);
                });
                it("Should throw invalid input error if called in the context of a nonexistent block", async function () {
                    const firstBlock = await getFirstBlock();
                    const futureBlock = firstBlock + 1;
                    await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_getTransactionCount", [(0, random_1.randomAddress)().toString(), (0, base_types_1.numberToRpcQuantity)(futureBlock)], `Received invalid block tag ${futureBlock}. Latest block number is ${firstBlock}`);
                });
            });
        });
    });
});
//# sourceMappingURL=getTransactionCount.js.map