"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = __importDefault(require("@ethereumjs/common"));
const tx_1 = require("@ethereumjs/tx");
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
            describe("eth_getTransactionByHash", async function () {
                it("should return null for unknown txs", async function () {
                    chai_1.assert.isNull(await this.provider.send("eth_getTransactionByHash", [
                        "0x1234567890123456789012345678901234567890123456789012345678902134",
                    ]));
                    chai_1.assert.isNull(await this.provider.send("eth_getTransactionByHash", [
                        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
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
                    const tx = await this.provider.send("eth_getTransactionByHash", [txHash]);
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
                    const tx2 = await this.provider.send("eth_getTransactionByHash", [txHash2]);
                    (0, assertions_1.assertLegacyTransaction)(tx2, txHash2, txParams2, firstBlock + 2, block2.hash, 0);
                });
                it("should return the transaction if it gets to execute and failed", async function () {
                    const firstBlock = await getFirstBlock();
                    const txParams = {
                        to: undefined,
                        from: (0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: (0, ethereumjs_util_1.toBuffer)("0x60006000fd"),
                        nonce: new ethereumjs_util_1.BN(0),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(250000),
                        gasPrice: await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider),
                    };
                    const txHash = await (0, transactions_1.getSignedTxHash)(this.hardhatNetworkProvider, txParams, 1);
                    // Revert. This is a deployment transaction that immediately reverts without a reason
                    await (0, assertions_1.assertTransactionFailure)(this.provider, {
                        from: (0, ethereumjs_util_1.bufferToHex)(txParams.from),
                        data: (0, ethereumjs_util_1.bufferToHex)(txParams.data),
                        nonce: (0, base_types_1.numberToRpcQuantity)(txParams.nonce),
                        value: (0, base_types_1.numberToRpcQuantity)(txParams.value),
                        gas: (0, base_types_1.numberToRpcQuantity)(txParams.gasLimit),
                        gasPrice: (0, base_types_1.numberToRpcQuantity)(txParams.gasPrice),
                    }, "Transaction reverted without a reason");
                    const tx = await this.provider.send("eth_getTransactionByHash", [
                        txHash,
                    ]);
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                        false,
                    ]);
                    (0, assertions_1.assertLegacyTransaction)(tx, txHash, txParams, firstBlock + 1, block.hash, 0);
                });
                it("should return the right properties", async function () {
                    const address = "0x738a6fe8b5034a10e85f19f2abdfd5ed4e12463e";
                    const privateKey = Buffer.from("17ade313db5de97d19b4cfbc820d15e18a6c710c1afbf01c1f31249970d3ae46", "hex");
                    // send eth to the account that will sign the tx
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: address,
                            value: "0x16345785d8a0000",
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        },
                    ]);
                    // create and send signed tx
                    const common = common_1.default.forCustomChain("mainnet", {
                        chainId: providers_1.DEFAULT_CHAIN_ID,
                        networkId: providers_1.DEFAULT_NETWORK_ID,
                        name: "hardhat",
                    }, "muirGlacier");
                    const txParams = {
                        nonce: "0x0",
                        gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        gasLimit: "0x55f0",
                        to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        value: "0x1",
                        data: "0xbeef",
                    };
                    const tx = new tx_1.Transaction(txParams, { common });
                    const signedTx = tx.sign(privateKey);
                    const rawTx = `0x${signedTx.serialize().toString("hex")}`;
                    const txHash = await this.provider.send("eth_sendRawTransaction", [
                        rawTx,
                    ]);
                    const fetchedTx = await this.provider.send("eth_getTransactionByHash", [txHash]);
                    chai_1.assert.equal(fetchedTx.from, address);
                    chai_1.assert.equal(fetchedTx.to, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]);
                    (0, chai_1.assert)((0, base_types_1.rpcQuantityToBN)(fetchedTx.value).eq((0, base_types_1.rpcQuantityToBN)(txParams.value)));
                    (0, chai_1.assert)((0, base_types_1.rpcQuantityToBN)(fetchedTx.nonce).eq((0, base_types_1.rpcQuantityToBN)(txParams.nonce)));
                    (0, chai_1.assert)((0, base_types_1.rpcQuantityToBN)(fetchedTx.gas).eq((0, base_types_1.rpcQuantityToBN)(txParams.gasLimit)));
                    (0, chai_1.assert)((0, base_types_1.rpcQuantityToBN)(fetchedTx.gasPrice).eq((0, base_types_1.rpcQuantityToBN)(txParams.gasPrice)));
                    chai_1.assert.equal(fetchedTx.input, txParams.data);
                    // tx.v is padded but fetchedTx.v is not, so we need to do this
                    const fetchedTxV = new ethereumjs_util_1.BN((0, ethereumjs_util_1.toBuffer)(fetchedTx.v));
                    const expectedTxV = new ethereumjs_util_1.BN(signedTx.v);
                    chai_1.assert.isTrue(fetchedTxV.eq(expectedTxV));
                    // Also equalize left padding (signedTx has a leading 0)
                    chai_1.assert.equal((0, ethereumjs_util_1.toBuffer)(fetchedTx.r).toString("hex"), (0, ethereumjs_util_1.toBuffer)(signedTx.r).toString("hex"));
                    chai_1.assert.equal((0, ethereumjs_util_1.toBuffer)(fetchedTx.s).toString("hex"), (0, ethereumjs_util_1.toBuffer)(signedTx.s).toString("hex"));
                });
                it("should return the right info for the pending transaction", async function () {
                    const txParams = {
                        to: (0, ethereumjs_util_1.toBuffer)((0, ethereumjs_util_1.zeroAddress)()),
                        from: (0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        data: (0, ethereumjs_util_1.toBuffer)([]),
                        nonce: new ethereumjs_util_1.BN(0),
                        value: new ethereumjs_util_1.BN(123),
                        gasLimit: new ethereumjs_util_1.BN(25000),
                        gasPrice: await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider),
                    };
                    await this.provider.send("evm_setAutomine", [false]);
                    const txHash = await (0, transactions_1.sendTransactionFromTxParams)(this.provider, txParams);
                    const tx = await this.provider.send("eth_getTransactionByHash", [txHash]);
                    (0, assertions_1.assertLegacyTransaction)(tx, txHash, txParams);
                });
                it("should get an existing transaction from mainnet", async function () {
                    if (!isFork) {
                        this.skip();
                    }
                    const tx = await this.provider.send("eth_getTransactionByHash", [
                        "0x5a4bf6970980a9381e6d6c78d96ab278035bbff58c383ffe96a0a2bbc7c02a4b",
                    ]);
                    chai_1.assert.equal(tx.from, "0x8a9d69aa686fa0f9bbdec21294f67d4d9cfb4a3e");
                });
                it("should get an existing transaction from rinkeby", async function () {
                    const { ALCHEMY_URL } = process.env;
                    if (!isFork || ALCHEMY_URL === undefined || ALCHEMY_URL === "") {
                        this.skip();
                    }
                    const rinkebyUrl = ALCHEMY_URL.replace("mainnet", "rinkeby");
                    // If "mainnet" is not present the replacement failed so we skip the test
                    if (rinkebyUrl === ALCHEMY_URL) {
                        this.skip();
                    }
                    await this.provider.send("hardhat_reset", [
                        {
                            forking: {
                                jsonRpcUrl: rinkebyUrl,
                            },
                        },
                    ]);
                    const tx = await this.provider.send("eth_getTransactionByHash", [
                        "0x9f8322fbfc0092c0493d4421626e682a0ef0a56ea37efe8f29cda804cca92e7f",
                    ]);
                    chai_1.assert.equal(tx.from, "0xbc3109d75dffaae85ef595902e3bd70fe0643b3b");
                });
                it("should return access list transactions", async function () {
                    const firstBlock = await getFirstBlock();
                    const txParams = {
                        from: (0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        to: (0, ethereumjs_util_1.toBuffer)((0, ethereumjs_util_1.zeroAddress)()),
                        data: (0, ethereumjs_util_1.toBuffer)("0x"),
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
                    const tx = await this.provider.send("eth_getTransactionByHash", [txHash]);
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                        false,
                    ]);
                    (0, assertions_1.assertAccessListTransaction)(tx, txHash, txParams, firstBlock + 1, block.hash, 0);
                });
                it("should return EIP-1559 transactions", async function () {
                    const firstBlock = await getFirstBlock();
                    const maxFeePerGas = await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider);
                    const txParams = {
                        from: (0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]),
                        to: (0, ethereumjs_util_1.toBuffer)((0, ethereumjs_util_1.zeroAddress)()),
                        data: (0, ethereumjs_util_1.toBuffer)("0x"),
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
                    const tx = await this.provider.send("eth_getTransactionByHash", [txHash]);
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                        false,
                    ]);
                    (0, assertions_1.assertEIP1559Transaction)(tx, txHash, txParams, firstBlock + 1, block.hash, 0);
                });
            });
        });
    });
});
//# sourceMappingURL=getTransactionByHash.js.map