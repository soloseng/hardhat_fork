"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../../../helpers/assertions");
const cwd_1 = require("../../../../helpers/cwd");
const getPendingBaseFeePerGas_1 = require("../../../../helpers/getPendingBaseFeePerGas");
const providers_1 = require("../../../../helpers/providers");
const retrieveForkBlockNumber_1 = require("../../../../helpers/retrieveForkBlockNumber");
const transactions_1 = require("../../../../helpers/transactions");
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
            describe("eth_getTransactionByBlockHashAndIndex", async function () {
                it("should return null for non-existing blocks", async function () {
                    chai_1.assert.isNull(await this.provider.send("eth_getTransactionByBlockHashAndIndex", [
                        "0x1231231231231231231231231231231231231231231231231231231231231231",
                        (0, base_types_1.numberToRpcQuantity)(0),
                    ]));
                });
                it("should return null for existing blocks but non-existing indexes", async function () {
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(0),
                        false,
                    ]);
                    chai_1.assert.isNull(await this.provider.send("eth_getTransactionByBlockHashAndIndex", [
                        block.hash,
                        (0, base_types_1.numberToRpcQuantity)(0),
                    ]));
                    chai_1.assert.isNull(await this.provider.send("eth_getTransactionByBlockHashAndIndex", [
                        block.hash,
                        (0, base_types_1.numberToRpcQuantity)(0),
                    ]));
                });
                it("should return the right info for the existing ones", async function () {
                    const firstBlock = await getFirstBlock();
                    const txParams1 = {
                        to: (0, ethereumjs_util_1.toBuffer)((0, ethereumjs_util_1.zeroAddress)()),
                        from: (0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: (0, ethereumjs_util_1.toBuffer)("0xaa"),
                        nonce: new ethereumjs_util_1.BN(0),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(25000),
                        gasPrice: await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider),
                    };
                    const txHash = await (0, transactions_1.sendTransactionFromTxParams)(this.provider, txParams1);
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                        false,
                    ]);
                    const tx = await this.provider.send("eth_getTransactionByBlockHashAndIndex", [block.hash, (0, base_types_1.numberToRpcQuantity)(0)]);
                    (0, assertions_1.assertLegacyTransaction)(tx, txHash, txParams1, firstBlock + 1, block.hash, 0);
                    const txParams2 = {
                        to: (0, ethereumjs_util_1.toBuffer)((0, ethereumjs_util_1.zeroAddress)()),
                        from: (0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: (0, ethereumjs_util_1.toBuffer)([]),
                        nonce: new ethereumjs_util_1.BN(1),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(80000),
                        gasPrice: await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider),
                    };
                    const txHash2 = await (0, transactions_1.sendTransactionFromTxParams)(this.provider, txParams2);
                    const block2 = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 2),
                        false,
                    ]);
                    const tx2 = await this.provider.send("eth_getTransactionByBlockHashAndIndex", [block2.hash, (0, base_types_1.numberToRpcQuantity)(0)]);
                    (0, assertions_1.assertLegacyTransaction)(tx2, txHash2, txParams2, firstBlock + 2, block2.hash, 0);
                });
                it("should return access list transactions", async function () {
                    const firstBlock = await getFirstBlock();
                    const txParams = {
                        to: (0, ethereumjs_util_1.toBuffer)((0, ethereumjs_util_1.zeroAddress)()),
                        from: (0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: (0, ethereumjs_util_1.toBuffer)("0xaa"),
                        nonce: new ethereumjs_util_1.BN(0),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(30000),
                        gasPrice: await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider),
                        accessList: [
                            [
                                (0, ethereumjs_util_1.toBuffer)((0, ethereumjs_util_1.zeroAddress)()),
                                [
                                    (0, ethereumjs_util_1.setLengthLeft)(Buffer.from([0]), 32),
                                    (0, ethereumjs_util_1.setLengthLeft)(Buffer.from([1]), 32),
                                ],
                            ],
                        ],
                    };
                    const txHash = await (0, transactions_1.sendTransactionFromTxParams)(this.provider, txParams);
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                        false,
                    ]);
                    const tx = await this.provider.send("eth_getTransactionByBlockHashAndIndex", [
                        block.hash,
                        (0, base_types_1.numberToRpcQuantity)(0),
                    ]);
                    (0, assertions_1.assertAccessListTransaction)(tx, txHash, txParams, firstBlock + 1, block.hash, 0);
                });
                it("should return EIP-1559 transactions", async function () {
                    const firstBlock = await getFirstBlock();
                    const maxFeePerGas = await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider);
                    const txParams = {
                        to: (0, ethereumjs_util_1.toBuffer)((0, ethereumjs_util_1.zeroAddress)()),
                        from: (0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: (0, ethereumjs_util_1.toBuffer)("0xaa"),
                        nonce: new ethereumjs_util_1.BN(0),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(30000),
                        maxFeePerGas,
                        maxPriorityFeePerGas: maxFeePerGas.divn(2),
                        accessList: [
                            [
                                (0, ethereumjs_util_1.toBuffer)((0, ethereumjs_util_1.zeroAddress)()),
                                [
                                    (0, ethereumjs_util_1.setLengthLeft)(Buffer.from([0]), 32),
                                    (0, ethereumjs_util_1.setLengthLeft)(Buffer.from([1]), 32),
                                ],
                            ],
                        ],
                    };
                    const txHash = await (0, transactions_1.sendTransactionFromTxParams)(this.provider, txParams);
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                        false,
                    ]);
                    const tx = await this.provider.send("eth_getTransactionByBlockHashAndIndex", [block.hash, (0, base_types_1.numberToRpcQuantity)(0)]);
                    (0, assertions_1.assertEIP1559Transaction)(tx, txHash, txParams, firstBlock + 1, block.hash, 0);
                });
            });
        });
    });
});
//# sourceMappingURL=getTransactionByBlockHashAndIndex.js.map