"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const errors_1 = require("../../../../../../../src/internal/core/providers/errors");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../../../helpers/assertions");
const contracts_1 = require("../../../../helpers/contracts");
const cwd_1 = require("../../../../helpers/cwd");
const getPendingBaseFeePerGas_1 = require("../../../../helpers/getPendingBaseFeePerGas");
const providers_1 = require("../../../../helpers/providers");
const retrieveForkBlockNumber_1 = require("../../../../helpers/retrieveForkBlockNumber");
const sendDummyTransaction_1 = require("../../../../helpers/sendDummyTransaction");
const transactions_1 = require("../../../../helpers/transactions");
const useHelpers_1 = require("../../../../helpers/useHelpers");
describe("Eth module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork, isJsonRpc }) => {
        if (isFork) {
            this.timeout(50000);
        }
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork });
        describe(`${name} provider`, function () {
            (0, cwd_1.setCWD)();
            describe("eth_sendTransaction", async function () {
                useProvider();
                (0, useHelpers_1.useHelpers)();
                const getFirstBlock = async () => isFork ? (0, retrieveForkBlockNumber_1.retrieveForkBlockNumber)(this.ctx.hardhatNetworkProvider) : 0;
                // Because of the way we are testing this (i.e. integration testing) it's almost impossible to
                // fully test this method in a reasonable amount of time. This is because it executes the core
                // of Ethereum: its state transition function.
                //
                // We have mostly test about logic added on top of that, and will add new ones whenever
                // suitable. This is approximately the same as assuming that @ethereumjs/vm is correct, which
                // seems reasonable, and if it weren't we should address the issues there.
                describe("Params validation", function () {
                    it("Should fail for tx sent from account that is neither local nor marked as impersonated", async function () {
                        await (0, assertions_1.assertTransactionFailure)(this.provider, {
                            from: (0, ethereumjs_util_1.zeroAddress)(),
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        }, "unknown account", errors_1.InvalidInputError.CODE);
                    });
                    it("Should fail if sending to the null address without data", async function () {
                        await (0, assertions_1.assertTransactionFailure)(this.provider, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        }, "contract creation without any data provided", errors_1.InvalidInputError.CODE);
                        await (0, assertions_1.assertTransactionFailure)(this.provider, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        }, "contract creation without any data provided", errors_1.InvalidInputError.CODE);
                        await (0, assertions_1.assertTransactionFailure)(this.provider, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: "0x",
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                        }, "contract creation without any data provided", errors_1.InvalidInputError.CODE);
                    });
                    it("Should accept EIP-1559 transactions", async function () {
                        const hash = await this.provider.send("eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                value: (0, base_types_1.numberToRpcQuantity)(1),
                                gas: (0, base_types_1.numberToRpcQuantity)(21000),
                                maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                                maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                            },
                        ]);
                        chai_1.assert.match(hash, /^0x[a-f\d]{64}$/);
                    });
                    it("Should throw if tx includes gasPrice, maxFeePerGas and maxPriorityFeePerGas", async function () {
                        await (0, assertions_1.assertTransactionFailure)(this.provider, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                            maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(10),
                            maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(10),
                        }, "Cannot send both gasPrice and maxFeePerGas", errors_1.InvalidInputError.CODE);
                    });
                    it("Should throw if tx includes gasPrice and maxFeePerGas", async function () {
                        await (0, assertions_1.assertTransactionFailure)(this.provider, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(10),
                            maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(10),
                        }, "Cannot send both gasPrice and maxFeePerGas", errors_1.InvalidInputError.CODE);
                    });
                    it("Should throw if tx includes gasPrice and maxPriorityFeePerGas", async function () {
                        await (0, assertions_1.assertTransactionFailure)(this.provider, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            gasPrice: (0, base_types_1.numberToRpcQuantity)(1),
                            maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(1),
                        }, "Cannot send both gasPrice and maxPriorityFeePerGas", errors_1.InvalidInputError.CODE);
                    });
                    it("Should throw if maxPriorityFeePerGas is bigger than maxFeePerGas", async function () {
                        await (0, assertions_1.assertTransactionFailure)(this.provider, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: (0, base_types_1.numberToRpcQuantity)(1),
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(10),
                            maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(20),
                        }, "maxPriorityFeePerGas (20) is bigger than maxFeePerGas (10)", errors_1.InvalidInputError.CODE);
                    });
                    it("Should succeed if sending an explicit null for an optional parameter value", async function () {
                        chai_1.assert.match(await this.provider.send("eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                gas: null,
                                gasPrice: null,
                                value: null,
                                nonce: null,
                                data: null,
                                accessList: null,
                                chainId: null,
                            },
                        ]), /^0x[a-f\d]{64}$/);
                    });
                });
                describe("when automine is enabled", () => {
                    it("Should return a valid transaction hash", async function () {
                        const hash = await this.provider.send("eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                value: (0, base_types_1.numberToRpcQuantity)(1),
                                gas: (0, base_types_1.numberToRpcQuantity)(21000),
                                gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                            },
                        ]);
                        chai_1.assert.match(hash, /^0x[a-f\d]{64}$/);
                    });
                    describe("With just from and data", function () {
                        for (const toValue of [undefined, null]) {
                            it(`Should work with a 'to' value of ${toValue}`, async function () {
                                const firstBlock = await getFirstBlock();
                                const hash = await this.provider.send("eth_sendTransaction", [
                                    {
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                        data: "0x00",
                                        to: toValue,
                                    },
                                ]);
                                const receipt = await this.provider.send("eth_getTransactionReceipt", [hash]);
                                const receiptFromGeth = {
                                    blockHash: "0x01490da2af913e9a868430b7b4c5060fc29cbdb1692bb91d3c72c734acd73bc8",
                                    blockNumber: "0x6",
                                    contractAddress: "0x6ea84fcbef576d66896dc2c32e139b60e641170c",
                                    cumulativeGasUsed: "0xcf0c",
                                    from: "0xda4585f6e68ed1cdfdad44a08dbe3979ec74ad8f",
                                    gasUsed: "0xcf0c",
                                    logs: [],
                                    logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                                    status: "0x1",
                                    to: null,
                                    transactionHash: "0xbd24cbe9c1633b98e61d93619230341141d2cff49470ed6afa739cee057fd0aa",
                                    transactionIndex: "0x0",
                                };
                                (0, assertions_1.assertReceiptMatchesGethOne)(receipt, receiptFromGeth, firstBlock + 1);
                            });
                        }
                    });
                    it("Should throw if the tx nonce is higher than the account nonce", async function () {
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                            {
                                nonce: (0, base_types_1.numberToRpcQuantity)(1),
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            },
                        ], "Nonce too high. Expected nonce to be 0 but got 1. Note that transactions can't be queued when automining.");
                    });
                    it("Should throw if the tx nonce is lower than the account nonce", async function () {
                        await (0, transactions_1.sendTxToZeroAddress)(this.provider, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]);
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                            {
                                nonce: (0, base_types_1.numberToRpcQuantity)(0),
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            },
                        ], "Nonce too low. Expected nonce to be 1 but got 0.");
                    });
                    it("Should throw if the transaction fails", async function () {
                        // Not enough gas
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: (0, ethereumjs_util_1.zeroAddress)(),
                                gas: (0, base_types_1.numberToRpcQuantity)(1),
                            },
                        ], "Transaction requires at least 21000 gas but got 1");
                        // Not enough balance
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: (0, ethereumjs_util_1.zeroAddress)(),
                                gas: (0, base_types_1.numberToRpcQuantity)(21000),
                                gasPrice: (0, base_types_1.numberToRpcQuantity)(providers_1.DEFAULT_ACCOUNTS_BALANCES[0]),
                            },
                        ], "sender doesn't have enough funds to send tx");
                        // Gas is larger than block gas limit
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: (0, ethereumjs_util_1.zeroAddress)(),
                                gas: (0, base_types_1.numberToRpcQuantity)(providers_1.DEFAULT_BLOCK_GAS_LIMIT + 1),
                            },
                        ], `Transaction gas limit is ${providers_1.DEFAULT_BLOCK_GAS_LIMIT + 1} and exceeds block gas limit of ${providers_1.DEFAULT_BLOCK_GAS_LIMIT}`);
                        // Invalid opcode. We try to deploy a contract with an invalid opcode in the deployment code
                        // The transaction gets executed anyway, so the account is updated
                        await (0, assertions_1.assertTransactionFailure)(this.provider, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            data: "0xAA",
                        }, "Transaction reverted without a reason");
                        // Out of gas. This a deployment transaction that pushes 0x00 multiple times
                        // The transaction gets executed anyway, so the account is updated.
                        //
                        // Note: this test is pretty fragile, as the tx needs to have enough gas
                        // to pay for the calldata, but not enough to execute. This costs changed
                        // with istanbul, and may change again in the future.
                        await (0, assertions_1.assertTransactionFailure)(this.provider, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            data: "0x6000600060006000600060006000600060006000600060006000600060006000600060006000600060006000600060006000",
                            gas: (0, base_types_1.numberToRpcQuantity)(53500),
                        }, "out of gas");
                        // Revert. This is a deployment transaction that immediately reverts without a reason
                        // The transaction gets executed anyway, so the account is updated
                        await (0, assertions_1.assertTransactionFailure)(this.provider, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            data: "0x60006000fd",
                        }, "Transaction reverted without a reason");
                        // This is a contract that reverts with A in its constructor
                        await (0, assertions_1.assertTransactionFailure)(this.provider, {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            data: "0x6080604052348015600f57600080fd5b506040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260018152602001807f410000000000000000000000000000000000000000000000000000000000000081525060200191505060405180910390fdfe",
                        }, "reverted with reason string 'A'");
                    });
                    describe("when there are pending transactions in the mempool", () => {
                        describe("when the sent transaction fits in the first block", () => {
                            it("Should throw if the sender doesn't have enough balance as a result of mining pending transactions first", async function () {
                                const gasPrice = 10;
                                const firstBlock = await getFirstBlock();
                                const wholeAccountBalance = (0, base_types_1.numberToRpcQuantity)(providers_1.DEFAULT_ACCOUNTS_BALANCES[0].subn(gasPrice * 21000));
                                await this.provider.send("evm_setAutomine", [false]);
                                await this.provider.send("eth_sendTransaction", [
                                    {
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                        to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                        nonce: (0, base_types_1.numberToRpcQuantity)(0),
                                        gas: (0, base_types_1.numberToRpcQuantity)(21000),
                                        gasPrice: (0, base_types_1.numberToRpcQuantity)(gasPrice),
                                        value: wholeAccountBalance,
                                    },
                                ]);
                                await this.provider.send("evm_setAutomine", [true]);
                                await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                                    {
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                        to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                        gas: (0, base_types_1.numberToRpcQuantity)(21000),
                                        gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                                        value: wholeAccountBalance,
                                    },
                                ], "sender doesn't have enough funds to send tx");
                                chai_1.assert.equal((0, base_types_1.rpcQuantityToNumber)(await this.provider.send("eth_blockNumber")), firstBlock);
                                chai_1.assert.lengthOf(await this.provider.send("eth_pendingTransactions"), 1);
                            });
                        });
                        describe("when multiple blocks have to be mined before the sent transaction is included", () => {
                            beforeEach(async function () {
                                await this.provider.send("evm_setBlockGasLimit", [
                                    (0, base_types_1.numberToRpcQuantity)(45000),
                                ]);
                            });
                            it("Should eventually mine the sent transaction", async function () {
                                await this.provider.send("evm_setAutomine", [false]);
                                const blockNumberBefore = (0, base_types_1.rpcQuantityToNumber)(await this.provider.send("eth_blockNumber"));
                                await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 0, {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                });
                                await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 1, {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                });
                                await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 2, {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                });
                                await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 3, {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                });
                                await this.provider.send("evm_setAutomine", [true]);
                                const txHash = await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 4, {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                });
                                const blockAfter = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                                const blockNumberAfter = (0, base_types_1.rpcQuantityToNumber)(blockAfter.number);
                                chai_1.assert.equal(blockNumberAfter, blockNumberBefore + 3);
                                chai_1.assert.lengthOf(blockAfter.transactions, 1);
                                chai_1.assert.sameDeepMembers(blockAfter.transactions, [txHash]);
                            });
                            it("Should throw if the sender doesn't have enough balance as a result of mining pending transactions first", async function () {
                                const gasPrice = await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider);
                                const sendTransaction = async (nonce, value) => {
                                    return this.provider.send("eth_sendTransaction", [
                                        {
                                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                            nonce: (0, base_types_1.numberToRpcQuantity)(nonce),
                                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                                            gasPrice: (0, base_types_1.numberToRpcQuantity)(gasPrice),
                                            value: (0, base_types_1.numberToRpcQuantity)(value),
                                        },
                                    ]);
                                };
                                const initialBalance = providers_1.DEFAULT_ACCOUNTS_BALANCES[1];
                                const firstBlock = await getFirstBlock();
                                await this.provider.send("evm_setAutomine", [false]);
                                await sendTransaction(0, 0);
                                await sendTransaction(1, 0);
                                await sendTransaction(2, initialBalance.sub(gasPrice.muln(21000).muln(3)));
                                await this.provider.send("evm_setAutomine", [true]);
                                await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                                    {
                                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                        to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                        gas: (0, base_types_1.numberToRpcQuantity)(21000),
                                        gasPrice: (0, base_types_1.numberToRpcQuantity)(gasPrice),
                                        value: (0, base_types_1.numberToRpcQuantity)(100),
                                    },
                                ], "sender doesn't have enough funds to send tx");
                                chai_1.assert.equal((0, base_types_1.rpcQuantityToNumber)(await this.provider.send("eth_blockNumber")), firstBlock);
                                chai_1.assert.lengthOf(await this.provider.send("eth_pendingTransactions"), 3);
                            });
                        });
                    });
                    it("Should throw if a tx can't be mined in the next block because of its fees", async function () {
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(1),
                            },
                        ], "too low for the next block, which has a baseFeePerGas of");
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                gasPrice: (0, base_types_1.numberToRpcQuantity)(1),
                            },
                        ], "too low for the next block, which has a baseFeePerGas of");
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                gasPrice: (0, base_types_1.numberToRpcQuantity)(1),
                                accessList: [],
                            },
                        ], "too low for the next block, which has a baseFeePerGas of");
                    });
                });
                describe("when automine is disabled", () => {
                    beforeEach(async function () {
                        await this.provider.send("evm_setAutomine", [false]);
                    });
                    it("Should not throw if the tx nonce is higher than the account nonce", async function () {
                        await chai_1.assert.isFulfilled(this.provider.send("eth_sendTransaction", [
                            {
                                nonce: (0, base_types_1.numberToRpcQuantity)(1),
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            },
                        ]));
                    });
                    it("Should throw if the tx nonce is lower than the account nonce", async function () {
                        await (0, transactions_1.sendTxToZeroAddress)(this.provider, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1]);
                        await this.provider.send("evm_mine");
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                            {
                                nonce: (0, base_types_1.numberToRpcQuantity)(0),
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            },
                        ], "Nonce too low. Expected nonce to be at least 1 but got 0.");
                    });
                    it("Should throw an error if the same transaction is sent twice", async function () {
                        const txParams = {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            nonce: (0, base_types_1.numberToRpcQuantity)(0),
                        };
                        const hash = await this.provider.send("eth_sendTransaction", [
                            txParams,
                        ]);
                        await (0, assertions_1.assertTransactionFailure)(this.provider, txParams, `Known transaction: ${(0, ethereumjs_util_1.bufferToHex)(hash)}`);
                    });
                    it("Should replace pending transactions", async function () {
                        const gasPrice = await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider);
                        const txHash1 = await this.provider.send("eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                nonce: (0, base_types_1.numberToRpcQuantity)(0),
                                gasPrice: (0, base_types_1.numberToRpcQuantity)(gasPrice),
                            },
                        ]);
                        let tx1 = await this.provider.send("eth_getTransactionByHash", [
                            txHash1,
                        ]);
                        chai_1.assert.isNotNull(tx1);
                        const txHash2 = await this.provider.send("eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                nonce: (0, base_types_1.numberToRpcQuantity)(0),
                                gasPrice: (0, base_types_1.numberToRpcQuantity)(gasPrice.muln(2)),
                            },
                        ]);
                        tx1 = await this.provider.send("eth_getTransactionByHash", [
                            txHash1,
                        ]);
                        const tx2 = await this.provider.send("eth_getTransactionByHash", [
                            txHash2,
                        ]);
                        chai_1.assert.isNull(tx1);
                        chai_1.assert.isNotNull(tx2);
                        const pendingTxs = await this.provider.send("eth_pendingTransactions");
                        chai_1.assert.lengthOf(pendingTxs, 1);
                        chai_1.assert.equal(pendingTxs[0].hash, tx2.hash);
                        await this.provider.send("evm_mine");
                        const minedBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                        chai_1.assert.lengthOf(minedBlock.transactions, 1);
                        chai_1.assert.equal(minedBlock.transactions[0], tx2.hash);
                    });
                    it("Should replace queued transactions", async function () {
                        const txHash1 = await this.provider.send("eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                nonce: (0, base_types_1.numberToRpcQuantity)(2),
                                gasPrice: (0, base_types_1.numberToRpcQuantity)(20),
                            },
                        ]);
                        let tx1 = await this.provider.send("eth_getTransactionByHash", [
                            txHash1,
                        ]);
                        chai_1.assert.isNotNull(tx1);
                        const txHash2 = await this.provider.send("eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                nonce: (0, base_types_1.numberToRpcQuantity)(2),
                                gasPrice: (0, base_types_1.numberToRpcQuantity)(30),
                            },
                        ]);
                        tx1 = await this.provider.send("eth_getTransactionByHash", [
                            txHash1,
                        ]);
                        const tx2 = await this.provider.send("eth_getTransactionByHash", [
                            txHash2,
                        ]);
                        chai_1.assert.isNull(tx1);
                        chai_1.assert.isNotNull(tx2);
                        await this.provider.send("evm_mine");
                        const minedBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                        chai_1.assert.lengthOf(minedBlock.transactions, 0);
                    });
                    it("Should throw an error if the replacement gasPrice, maxFeePerGas or maxPriorityFeePerGas are too low", async function () {
                        const baseFeePerGas = await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider);
                        const txHash1 = await this.provider.send("eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                nonce: (0, base_types_1.numberToRpcQuantity)(0),
                                gasPrice: (0, base_types_1.numberToRpcQuantity)(baseFeePerGas),
                            },
                        ]);
                        let tx1 = await this.provider.send("eth_getTransactionByHash", [
                            txHash1,
                        ]);
                        chai_1.assert.isNotNull(tx1);
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                nonce: (0, base_types_1.numberToRpcQuantity)(0),
                                gasPrice: (0, base_types_1.numberToRpcQuantity)(baseFeePerGas.addn(1)),
                            },
                        ], "Replacement transaction underpriced.");
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                nonce: (0, base_types_1.numberToRpcQuantity)(0),
                                maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(baseFeePerGas.addn(1)),
                            },
                        ], "Replacement transaction underpriced.");
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                                nonce: (0, base_types_1.numberToRpcQuantity)(0),
                                maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(baseFeePerGas.addn(1)),
                            },
                        ], "Replacement transaction underpriced.");
                        // check that original tx was not replaced
                        tx1 = await this.provider.send("eth_getTransactionByHash", [
                            txHash1,
                        ]);
                        chai_1.assert.isNotNull(tx1);
                        const pendingTxs = await this.provider.send("eth_pendingTransactions");
                        chai_1.assert.lengthOf(pendingTxs, 1);
                        chai_1.assert.equal(pendingTxs[0].hash, tx1.hash);
                        await this.provider.send("evm_mine");
                        const minedBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                        chai_1.assert.lengthOf(minedBlock.transactions, 1);
                        chai_1.assert.equal(minedBlock.transactions[0], tx1.hash);
                    });
                });
                describe("Fee params default values", function () {
                    let nextBlockBaseFee;
                    const ONE_GWEI = new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(9));
                    beforeEach(async function () {
                        // We disable automining as enqueueing the txs is enough and we want
                        // to test some that may have a low maxFeePerGas
                        await this.provider.send("evm_setAutomine", [false]);
                        const pendingBlock = await this.provider.send("eth_getBlockByNumber", ["pending", false]);
                        nextBlockBaseFee = (0, base_types_1.rpcQuantityToBN)(pendingBlock.baseFeePerGas);
                    });
                    describe("When no fee param is provided", function () {
                        it("Should use 1gwei maxPriorityFeePerGas and base the maxFeePerGas on that plus 2 * next block's baseFee", async function () {
                            const txHash = await this.provider.send("eth_sendTransaction", [
                                {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                },
                            ]);
                            const tx = await this.provider.send("eth_getTransactionByHash", [txHash]);
                            chai_1.assert.equal(tx.maxPriorityFeePerGas, (0, base_types_1.numberToRpcQuantity)(ONE_GWEI));
                            chai_1.assert.equal(tx.maxFeePerGas, (0, base_types_1.numberToRpcQuantity)(nextBlockBaseFee.muln(2).add(ONE_GWEI)));
                        });
                    });
                    describe("When maxFeePerGas is provided", function () {
                        it("Should use 1gwei maxPriorityFeePerGas if maxFeePerGas is >= 1gwei", async function () {
                            const txHash = await this.provider.send("eth_sendTransaction", [
                                {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(ONE_GWEI.muln(2)),
                                },
                            ]);
                            const tx = await this.provider.send("eth_getTransactionByHash", [txHash]);
                            chai_1.assert.equal(tx.maxPriorityFeePerGas, (0, base_types_1.numberToRpcQuantity)(ONE_GWEI));
                            chai_1.assert.equal(tx.maxFeePerGas, (0, base_types_1.numberToRpcQuantity)(ONE_GWEI.muln(2)));
                        });
                        it("Should use 1gwei maxPriorityFeePerGas if maxFeePerGas is < 1gwei", async function () {
                            const txHash = await this.provider.send("eth_sendTransaction", [
                                {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(10000),
                                },
                            ]);
                            const tx = await this.provider.send("eth_getTransactionByHash", [txHash]);
                            chai_1.assert.equal(tx.maxPriorityFeePerGas, (0, base_types_1.numberToRpcQuantity)(10000));
                            chai_1.assert.equal(tx.maxFeePerGas, (0, base_types_1.numberToRpcQuantity)(10000));
                        });
                    });
                    describe("When maxPriorityFeePerGas is provided", function () {
                        it("Should use the maxPriorityFeePerGas and base the maxFeePerGas on that plus 2 * next block's baseFee", async function () {
                            const txHash = await this.provider.send("eth_sendTransaction", [
                                {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(1000),
                                },
                            ]);
                            const tx = await this.provider.send("eth_getTransactionByHash", [txHash]);
                            chai_1.assert.equal(tx.maxPriorityFeePerGas, (0, base_types_1.numberToRpcQuantity)(1000));
                            chai_1.assert.equal(tx.maxFeePerGas, (0, base_types_1.numberToRpcQuantity)(nextBlockBaseFee.muln(2).addn(1000)));
                        });
                    });
                });
                describe("return txHash", () => {
                    it("Should return the hash of an out of gas transaction", async function () {
                        if (!isJsonRpc || isFork) {
                            this.skip();
                        }
                        try {
                            await this.provider.send("eth_sendTransaction", [
                                {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    to: "0x0000000000000000000000000000000000000001",
                                    gas: (0, base_types_1.numberToRpcQuantity)(21000),
                                    gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider)),
                                },
                            ]);
                            chai_1.assert.fail("Tx should have failed");
                        }
                        catch (e) {
                            chai_1.assert.notInclude(e.message, "Tx should have failed");
                            chai_1.assert.isDefined(e.data.txHash);
                        }
                    });
                    it("Should return the hash of a reverted transaction", async function () {
                        if (!isJsonRpc || isFork) {
                            this.skip();
                        }
                        try {
                            const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_REVERT_CONTRACT.bytecode.object}`);
                            await this.provider.send("eth_sendTransaction", [
                                {
                                    to: contractAddress,
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    data: `${contracts_1.EXAMPLE_REVERT_CONTRACT.selectors.f}0000000000000000000000000000000000000000000000000000000000000000`,
                                },
                            ]);
                            chai_1.assert.fail("Tx should have failed");
                        }
                        catch (e) {
                            chai_1.assert.notInclude(e.message, "Tx should have failed");
                            chai_1.assert.isDefined(e.data.txHash);
                        }
                    });
                });
                // This test checks that an on-chain value can be set to 0
                // To do this, we transfer all the balance of the 0x0000...0001 account
                // to some random account, and then check that its balance is zero
                it("should set a value to 0", async function () {
                    if (!isFork) {
                        this.skip();
                    }
                    const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
                    const sender = "0x0000000000000000000000000000000000000001";
                    await this.provider.send("hardhat_impersonateAccount", [sender]);
                    // get balance of 0x0000...0001
                    const balanceBefore = await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: daiAddress,
                            data: "0x70a082310000000000000000000000000000000000000000000000000000000000000001",
                        },
                    ]);
                    // send out the full balance
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: sender,
                            to: daiAddress,
                            data: `0xa9059cbb0000000000000000000000005a3fed996fc40791a26e7fb78dda4f9293788951${balanceBefore.slice(2)}`,
                        },
                    ]);
                    const balanceAfter = await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: daiAddress,
                            data: "0x70a082310000000000000000000000000000000000000000000000000000000000000001",
                        },
                    ]);
                    chai_1.assert.isTrue(new ethereumjs_util_1.BN((0, ethereumjs_util_1.toBuffer)(balanceAfter)).isZero());
                });
            });
            describe("eth_sendTransaction with minGasPrice", function () {
                useProvider({ hardfork: "berlin" });
                (0, useHelpers_1.useHelpers)();
                const minGasPrice = 20;
                beforeEach(async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    await this.provider.send("hardhat_setMinGasPrice", [
                        (0, base_types_1.numberToRpcQuantity)(minGasPrice),
                    ]);
                });
                it("should not mine transactions with a gas price below the minimum", async function () {
                    const txHash1 = await this.sendTx({
                        nonce: 0,
                        gasPrice: minGasPrice - 1,
                    });
                    const txHash2 = await this.sendTx({
                        nonce: 1,
                        gasPrice: minGasPrice - 1,
                    });
                    await this.assertPendingTxs([txHash1, txHash2]);
                    await this.mine();
                    await this.assertPendingTxs([txHash1, txHash2]);
                });
                it("should not mine a queued transaction if previous txs have a low gas price", async function () {
                    const txHash1 = await this.sendTx({
                        nonce: 0,
                        gasPrice: minGasPrice - 1,
                    });
                    const txHash2 = await this.sendTx({
                        nonce: 1,
                        gasPrice: minGasPrice - 1,
                    });
                    const txHash3 = await this.sendTx({
                        nonce: 2,
                        gasPrice: minGasPrice,
                    });
                    await this.assertPendingTxs([txHash1, txHash2, txHash3]);
                    await this.mine();
                    await this.assertPendingTxs([txHash1, txHash2, txHash3]);
                });
                it("should mine a pending tx even if txs from another account have a low gas price", async function () {
                    const txHash1 = await this.sendTx({
                        nonce: 0,
                        gasPrice: minGasPrice - 1,
                    });
                    const txHash2 = await this.sendTx({
                        nonce: 1,
                        gasPrice: minGasPrice - 1,
                    });
                    const txHash3 = await this.sendTx({
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                        nonce: 0,
                        gasPrice: minGasPrice + 1,
                    });
                    await this.assertPendingTxs([txHash1, txHash2, txHash3]);
                    await this.mine();
                    await this.assertPendingTxs([txHash1, txHash2]);
                    await this.assertLatestBlockTxs([txHash3]);
                });
            });
        });
    });
});
//# sourceMappingURL=sendTransaction.js.map