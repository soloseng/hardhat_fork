"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../../../helpers/assertions");
const constants_1 = require("../../../../helpers/constants");
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
            describe("eth_getBalance", async function () {
                it("Should return 0 for empty accounts", async function () {
                    if (!isFork) {
                        (0, assertions_1.assertQuantity)(await this.provider.send("eth_getBalance", [(0, ethereumjs_util_1.zeroAddress)()]), 0);
                        (0, assertions_1.assertQuantity)(await this.provider.send("eth_getBalance", [
                            "0x0000000000000000000000000000000000000001",
                        ]), 0);
                    }
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getBalance", [
                        constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                    ]), 0);
                });
                it("Should return the initial balance for the genesis accounts", async function () {
                    await (0, assertions_1.assertNodeBalances)(this.provider, providers_1.DEFAULT_ACCOUNTS_BALANCES);
                });
                it("Should return the updated balance after a transaction is made", async function () {
                    const gasPrice = await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider);
                    await (0, assertions_1.assertNodeBalances)(this.provider, providers_1.DEFAULT_ACCOUNTS_BALANCES);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(gasPrice),
                        },
                    ]);
                    await (0, assertions_1.assertNodeBalances)(this.provider, [
                        providers_1.DEFAULT_ACCOUNTS_BALANCES[0].sub(gasPrice.muln(21000).addn(1)),
                        providers_1.DEFAULT_ACCOUNTS_BALANCES[1].addn(1),
                        ...providers_1.DEFAULT_ACCOUNTS_BALANCES.slice(2),
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: (0, base_types_1.numberToRpcQuantity)(2),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(gasPrice.muln(2)),
                        },
                    ]);
                    await (0, assertions_1.assertNodeBalances)(this.provider, [
                        providers_1.DEFAULT_ACCOUNTS_BALANCES[0].sub(gasPrice
                            .muln(21000)
                            .addn(1)
                            .add(gasPrice.muln(21000).muln(2).addn(2))),
                        providers_1.DEFAULT_ACCOUNTS_BALANCES[1].addn(1 + 2),
                        ...providers_1.DEFAULT_ACCOUNTS_BALANCES.slice(2),
                    ]);
                });
                it("Should return the pending balance", async function () {
                    const gasPrice = await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider);
                    await this.provider.send("evm_setAutomine", [false]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(gasPrice),
                            nonce: (0, base_types_1.numberToRpcQuantity)(0),
                        },
                    ]);
                    await (0, assertions_1.assertPendingNodeBalances)(this.provider, [
                        providers_1.DEFAULT_ACCOUNTS_BALANCES[0],
                        providers_1.DEFAULT_ACCOUNTS_BALANCES[1].sub(gasPrice.muln(21000).addn(1)),
                        providers_1.DEFAULT_ACCOUNTS_BALANCES[2].addn(1),
                        ...providers_1.DEFAULT_ACCOUNTS_BALANCES.slice(3),
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            value: (0, base_types_1.numberToRpcQuantity)(2),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(gasPrice.muln(2)),
                            nonce: (0, base_types_1.numberToRpcQuantity)(1),
                        },
                    ]);
                    await (0, assertions_1.assertPendingNodeBalances)(this.provider, [
                        providers_1.DEFAULT_ACCOUNTS_BALANCES[0],
                        providers_1.DEFAULT_ACCOUNTS_BALANCES[1].sub(gasPrice
                            .muln(21000)
                            .addn(1)
                            .add(gasPrice.muln(21000).muln(2).addn(2))),
                        providers_1.DEFAULT_ACCOUNTS_BALANCES[2].addn(1 + 2),
                        ...providers_1.DEFAULT_ACCOUNTS_BALANCES.slice(3),
                    ]);
                });
                it("Should return the original balance after a call is made", async function () {
                    await (0, assertions_1.assertNodeBalances)(this.provider, providers_1.DEFAULT_ACCOUNTS_BALANCES);
                    await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                        },
                    ]);
                    await (0, assertions_1.assertNodeBalances)(this.provider, providers_1.DEFAULT_ACCOUNTS_BALANCES);
                    await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                        },
                    ]);
                    await (0, assertions_1.assertNodeBalances)(this.provider, providers_1.DEFAULT_ACCOUNTS_BALANCES);
                });
                it("should assign the block reward to the coinbase address", async function () {
                    const coinbase = await this.provider.send("eth_coinbase");
                    (0, assertions_1.assertQuantity)(await this.provider.send("eth_getBalance", [coinbase]), 0);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        },
                    ]);
                    const balance = new ethereumjs_util_1.BN((0, ethereumjs_util_1.toBuffer)(await this.provider.send("eth_getBalance", [coinbase])));
                    chai_1.assert.isTrue(balance.gtn(0));
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        },
                    ]);
                    const balance2 = new ethereumjs_util_1.BN((0, ethereumjs_util_1.toBuffer)(await this.provider.send("eth_getBalance", [coinbase])));
                    chai_1.assert.isTrue(balance2.gt(balance));
                });
                it("should leverage block tag parameter", async function () {
                    const firstBlock = await getFirstBlock();
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                        },
                    ]);
                    if (!isFork) {
                        chai_1.assert.strictEqual(await this.provider.send("eth_getBalance", [
                            constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                            "earliest",
                        ]), "0x0");
                    }
                    chai_1.assert.strictEqual(await this.provider.send("eth_getBalance", [
                        constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                        (0, base_types_1.numberToRpcQuantity)(firstBlock),
                    ]), "0x0");
                    chai_1.assert.strictEqual(await this.provider.send("eth_getBalance", [
                        constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                    ]), "0x1");
                    chai_1.assert.strictEqual(await this.provider.send("eth_getBalance", [
                        constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                    ]), "0x1");
                });
                it("Should throw invalid input error if called in the context of a nonexistent block", async function () {
                    const firstBlock = await getFirstBlock();
                    const futureBlock = firstBlock + 1;
                    await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_getBalance", [providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0], (0, base_types_1.numberToRpcQuantity)(futureBlock)], `Received invalid block tag ${futureBlock}. Latest block number is ${firstBlock}`);
                });
            });
        });
    });
});
//# sourceMappingURL=getBalance.js.map