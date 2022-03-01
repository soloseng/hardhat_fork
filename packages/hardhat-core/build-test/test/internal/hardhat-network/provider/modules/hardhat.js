"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
// eslint-disable-next-line import/no-extraneous-dependencies
const ethers_1 = require("ethers");
const sinon_1 = __importDefault(require("sinon"));
const mocha_1 = require("mocha");
const base_types_1 = require("../../../../../src/internal/core/jsonrpc/types/base-types");
const errors_1 = require("../../../../helpers/errors");
const setup_1 = require("../../../../setup");
const workaround_windows_ci_failures_1 = require("../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../helpers/assertions");
const constants_1 = require("../../helpers/constants");
const cwd_1 = require("../../helpers/cwd");
const providers_1 = require("../../helpers/providers");
const transactions_1 = require("../../helpers/transactions");
const compilation_1 = require("../../stack-traces/compilation");
const getPendingBaseFeePerGas_1 = require("../../helpers/getPendingBaseFeePerGas");
(0, mocha_1.describe)("Hardhat module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork }) => {
        if (isFork) {
            this.timeout(50000);
        }
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork });
        (0, mocha_1.describe)(`${name} provider`, function () {
            const safeBlockInThePast = 11200000; // this should resolve CI errors probably caused by using a block too far in the past
            (0, cwd_1.setCWD)();
            useProvider();
            (0, mocha_1.describe)("hardhat_impersonateAccount", function () {
                it("validates input parameter", async function () {
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_impersonateAccount", ["0x1234"]);
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_impersonateAccount", ["1234567890abcdef1234567890abcdef12345678"]);
                });
                it("returns true", async function () {
                    const result = await this.provider.send("hardhat_impersonateAccount", [constants_1.EMPTY_ACCOUNT_ADDRESS.toString()]);
                    chai_1.assert.isTrue(result);
                });
                it("lets you send a transaction from an impersonated account", async function () {
                    const impersonatedAddress = "0xC014BA5EC014ba5ec014Ba5EC014ba5Ec014bA5E";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: impersonatedAddress,
                            value: "0x100",
                        },
                    ]);
                    // The tx's msg.sender should be correct during execution
                    // msg.sender assertion contract:
                    //
                    // pragma solidity 0.7.0;
                    //
                    // contract C {
                    //     constructor() {
                    //         require(msg.sender == 0xC014BA5EC014ba5ec014Ba5EC014ba5Ec014bA5E);
                    //     }
                    // }
                    const CODE = "0x6080604052348015600f57600080fd5b5073c014ba5ec014ba5ec014ba5ec014ba5ec014ba5e73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614605b57600080fd5b603f8060686000396000f3fe6080604052600080fdfea26469706673582212208048da4076c3540ec6ad48a816e6531a302449e979836bd7955dc6bd2c87a52064736f6c63430007000033";
                    await this.provider.send("hardhat_impersonateAccount", [
                        impersonatedAddress,
                    ]);
                    await (0, errors_1.expectErrorAsync)(() => (0, transactions_1.deployContract)(this.provider, CODE, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0]));
                    // deploying with the right address should work
                    await (0, transactions_1.deployContract)(this.provider, CODE, impersonatedAddress);
                    // Getting the tx through the RPC should give the right from
                    const tx = await this.provider.send("eth_sendTransaction", [
                        {
                            from: impersonatedAddress,
                            to: impersonatedAddress,
                        },
                    ]);
                    const receipt = await this.provider.send("eth_getTransactionReceipt", [tx]);
                    chai_1.assert.equal(receipt.from, impersonatedAddress.toLowerCase());
                });
                it("lets you deploy a contract from an impersonated account", async function () {
                    const impersonatedAddress = "0xC014BA5EC014ba5ec014Ba5EC014ba5Ec014bA5E";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: impersonatedAddress,
                            value: "0x100",
                        },
                    ]);
                    await this.provider.send("hardhat_impersonateAccount", [
                        impersonatedAddress,
                    ]);
                    await (0, transactions_1.deployContract)(this.provider, "0x7f410000000000000000000000000000000000000000000000000000000000000060005260016000f3", impersonatedAddress);
                });
            });
            (0, mocha_1.describe)("hardhat_stopImpersonatingAccount", function () {
                it("validates input parameter", async function () {
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_stopImpersonatingAccount", ["0x1234"]);
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_stopImpersonatingAccount", ["1234567890abcdef1234567890abcdef12345678"]);
                });
                it("returns true if the account was impersonated before", async function () {
                    await this.provider.send("hardhat_impersonateAccount", [
                        constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                    ]);
                    const result = await this.provider.send("hardhat_stopImpersonatingAccount", [constants_1.EMPTY_ACCOUNT_ADDRESS.toString()]);
                    chai_1.assert.isTrue(result);
                });
                it("returns false if the account wasn't impersonated before", async function () {
                    const result = await this.provider.send("hardhat_stopImpersonatingAccount", [constants_1.EMPTY_ACCOUNT_ADDRESS.toString()]);
                    chai_1.assert.isFalse(result);
                });
            });
            (0, mocha_1.describe)("hardhat_getAutomine", () => {
                it("should return automine status true when enabled", async function () {
                    await this.provider.send("evm_setAutomine", [true]);
                    const result = await this.provider.send("hardhat_getAutomine");
                    chai_1.assert.isTrue(result);
                });
                it("should return automine status false when disabled", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    const result = await this.provider.send("hardhat_getAutomine");
                    chai_1.assert.isFalse(result);
                });
            });
            (0, mocha_1.describe)("hardhat_reset", function () {
                before(function () {
                    if (setup_1.ALCHEMY_URL === undefined) {
                        this.skip();
                    }
                });
                it("validates input parameters", async function () {
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_reset", [
                        { forking: {} },
                    ]);
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_reset", [
                        {
                            forking: {
                                jsonRpcUrl: 123,
                            },
                        },
                    ]);
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_reset", [
                        {
                            forking: {
                                blockNumber: 0,
                            },
                        },
                    ]);
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_reset", [
                        {
                            forking: {
                                jsonRpcUrl: setup_1.ALCHEMY_URL,
                                blockNumber: "0",
                            },
                        },
                    ]);
                });
                it("returns true", async function () {
                    const result = await this.provider.send("hardhat_reset", [
                        {
                            forking: {
                                jsonRpcUrl: setup_1.ALCHEMY_URL,
                                blockNumber: safeBlockInThePast,
                            },
                        },
                    ]);
                    chai_1.assert.isTrue(result);
                });
                it("hardhat_reset resets tx pool", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: "0x1111111111111111111111111111111111111111",
                            nonce: (0, base_types_1.numberToRpcQuantity)(0),
                        },
                    ]);
                    const pendingTxsBefore = await this.provider.send("eth_pendingTransactions");
                    const result = await this.provider.send("hardhat_reset");
                    const pendingTxsAfter = await this.provider.send("eth_pendingTransactions");
                    chai_1.assert.isTrue(result);
                    chai_1.assert.lengthOf(pendingTxsBefore, 1);
                    chai_1.assert.lengthOf(pendingTxsAfter, 0);
                });
                (0, mocha_1.describe)("tests using sinon", () => {
                    let sinonClock;
                    beforeEach(() => {
                        sinonClock = sinon_1.default.useFakeTimers({
                            now: Date.now(),
                            toFake: ["Date", "setTimeout", "clearTimeout"],
                        });
                    });
                    afterEach(() => {
                        sinonClock.restore();
                    });
                    it("resets interval mining", async function () {
                        const interval = 15000;
                        await this.provider.send("evm_setAutomine", [false]);
                        await this.provider.send("evm_setIntervalMining", [interval]);
                        const firstBlockBefore = await getLatestBlockNumber();
                        await sinonClock.tickAsync(interval);
                        const secondBlockBefore = await getLatestBlockNumber();
                        chai_1.assert.equal(secondBlockBefore, firstBlockBefore + 1);
                        const result = await this.provider.send("hardhat_reset");
                        chai_1.assert.isTrue(result);
                        const firstBlockAfter = await getLatestBlockNumber();
                        await sinonClock.tickAsync(interval);
                        const secondBlockAfter = await getLatestBlockNumber();
                        chai_1.assert.equal(secondBlockAfter, firstBlockAfter);
                    });
                });
                if (isFork) {
                    testForkedProviderBehaviour();
                }
                else {
                    testNormalProviderBehaviour();
                }
                const getLatestBlockNumber = async () => {
                    return (0, base_types_1.rpcQuantityToNumber)(await this.ctx.provider.send("eth_blockNumber"));
                };
                function testForkedProviderBehaviour() {
                    it("can reset the forked provider to a given forkBlockNumber", async function () {
                        await this.provider.send("hardhat_reset", [
                            {
                                forking: {
                                    jsonRpcUrl: setup_1.ALCHEMY_URL,
                                    blockNumber: safeBlockInThePast,
                                },
                            },
                        ]);
                        chai_1.assert.equal(await getLatestBlockNumber(), safeBlockInThePast);
                    });
                    it("can reset the forked provider to the latest block number", async function () {
                        const initialBlock = await getLatestBlockNumber();
                        await this.provider.send("hardhat_reset", [
                            {
                                forking: {
                                    jsonRpcUrl: setup_1.ALCHEMY_URL,
                                    blockNumber: safeBlockInThePast,
                                },
                            },
                        ]);
                        await this.provider.send("hardhat_reset", [
                            { forking: { jsonRpcUrl: setup_1.ALCHEMY_URL } },
                        ]);
                        // This condition is rather loose as Infura can sometimes return
                        // a smaller block number on subsequent eth_blockNumber call
                        chai_1.assert.closeTo(await getLatestBlockNumber(), initialBlock, 4);
                    });
                    it("can reset the forked provider to a normal provider", async function () {
                        await this.provider.send("hardhat_reset", []);
                        chai_1.assert.equal(await getLatestBlockNumber(), 0);
                        await this.provider.send("hardhat_reset", [{}]);
                        chai_1.assert.equal(await getLatestBlockNumber(), 0);
                    });
                }
                function testNormalProviderBehaviour() {
                    it("can reset the provider to initial state", async function () {
                        await this.provider.send("evm_mine");
                        chai_1.assert.equal(await getLatestBlockNumber(), 1);
                        await this.provider.send("hardhat_reset", []);
                        chai_1.assert.equal(await getLatestBlockNumber(), 0);
                    });
                    it("can reset the provider with a fork config", async function () {
                        await this.provider.send("hardhat_reset", [
                            {
                                forking: {
                                    jsonRpcUrl: setup_1.ALCHEMY_URL,
                                    blockNumber: safeBlockInThePast,
                                },
                            },
                        ]);
                        chai_1.assert.equal(await getLatestBlockNumber(), safeBlockInThePast);
                    });
                    it("can reset the provider with fork config back to normal config", async function () {
                        await this.provider.send("hardhat_reset", [
                            {
                                forking: {
                                    jsonRpcUrl: setup_1.ALCHEMY_URL,
                                    blockNumber: safeBlockInThePast,
                                },
                            },
                        ]);
                        await this.provider.send("hardhat_reset", []);
                        chai_1.assert.equal(await getLatestBlockNumber(), 0);
                    });
                }
            });
            (0, mocha_1.describe)("hardhat_setBalance", function () {
                it("should reject an invalid address", async function () {
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_setBalance", ["0x1234", "0x0"], 'Errors encountered in param 0: Invalid value "0x1234" supplied to : ADDRESS');
                });
                it("should reject a non-numeric balance", async function () {
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_setBalance", [providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0], "xyz"], 'Errors encountered in param 1: Invalid value "xyz" supplied to : QUANTITY');
                });
                it("should not reject valid argument types", async function () {
                    await this.provider.send("hardhat_setBalance", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        "0x0",
                    ]);
                });
                it("should result in a modified balance", async function () {
                    // Arrange: Capture existing balance
                    const existingBalance = (0, base_types_1.rpcQuantityToBN)(await this.provider.send("eth_getBalance", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    ]));
                    // Act: Set the new balance.
                    const targetBalance = existingBalance.add(new ethereumjs_util_1.BN(1)).mul(new ethereumjs_util_1.BN(2));
                    // For sanity, ensure that we really are making a change:
                    chai_1.assert.isFalse(targetBalance.eq(existingBalance));
                    await this.provider.send("hardhat_setBalance", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        (0, base_types_1.numberToRpcQuantity)(targetBalance),
                    ]);
                    // Assert: Ensure the new balance was set.
                    const newBalance = (0, base_types_1.rpcQuantityToBN)(await this.provider.send("eth_getBalance", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    ]));
                    (0, chai_1.assert)(targetBalance.eq(newBalance));
                });
                it("should not result in a modified state root", async function () {
                    // Arrange 1: Send a transaction, in order to ensure a pre-existing
                    // state root.
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: "0x100",
                        },
                    ]);
                    // Arrange 2: Capture the existing state root.
                    const oldStateRoot = (await this.provider.send("eth_getBlockByNumber", ["latest", false])).stateRoot;
                    // Act: Set the new balance.
                    await this.provider.send("hardhat_setBalance", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        (0, base_types_1.numberToRpcQuantity)(99),
                    ]);
                    // Assert: Ensure state root hasn't changed.
                    const newStateRoot = (await this.provider.send("eth_getBlockByNumber", ["latest", false])).stateRoot;
                    chai_1.assert.equal(newStateRoot, oldStateRoot);
                });
                it("should get changed balance by block even after a new block is mined", async function () {
                    // Arrange 1: Get current block number
                    const currentBlockNumber = await this.provider.send("eth_blockNumber");
                    // Arrange 2: Set a new balance
                    const targetBalance = new ethereumjs_util_1.BN("123454321");
                    const targetBalanceHex = (0, base_types_1.numberToRpcQuantity)(targetBalance);
                    await this.provider.send("hardhat_setBalance", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        targetBalanceHex,
                    ]);
                    // Arrange 3: Mine a block
                    await this.provider.send("evm_mine");
                    // Act: Get the balance of the account in the previous block
                    const balancePreviousBlock = await this.provider.send("eth_getBalance", [providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0], currentBlockNumber]);
                    // Assert: Check that the balance is the one we set
                    chai_1.assert.equal(balancePreviousBlock, targetBalanceHex);
                });
                it("should fund an account and permit that account to send a transaction", async function () {
                    // Arrange: Fund a not-yet-existing account.
                    const notYetExistingAccount = "0x1234567890123456789012345678901234567890";
                    const amountToBeSent = new ethereumjs_util_1.BN(10);
                    const cost = new ethereumjs_util_1.BN("21000000000000" /* 21k gwei in wei*/).mul(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(this.provider));
                    const balanceRequired = amountToBeSent.add(cost);
                    await this.provider.send("hardhat_setBalance", [
                        notYetExistingAccount,
                        (0, base_types_1.numberToRpcQuantity)(balanceRequired),
                    ]);
                    // Arrange: Capture the existing balance of the destination account.
                    const existingBalance = (0, base_types_1.rpcQuantityToBN)(await this.provider.send("eth_getBalance", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    ]));
                    // Act: Send a transaction from the newly-funded account.
                    await this.provider.send("hardhat_impersonateAccount", [
                        notYetExistingAccount,
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: notYetExistingAccount,
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            value: (0, base_types_1.numberToRpcQuantity)(amountToBeSent),
                        },
                    ]);
                    await this.provider.send("hardhat_stopImpersonatingAccount", [
                        notYetExistingAccount,
                    ]);
                    // Assert: ensure the destination address is increased as expected.
                    const newBalance = (0, base_types_1.rpcQuantityToBN)(await this.provider.send("eth_getBalance", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                    ]));
                    (0, chai_1.assert)(newBalance.eq(existingBalance.add(amountToBeSent)));
                });
                it("should have its effects persist across snapshot save/restore", async function () {
                    const a = providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0];
                    const currentBlockNumber = await this.provider.send("eth_blockNumber");
                    // set balance1
                    const targetBalance1 = (0, base_types_1.numberToRpcQuantity)(1);
                    await this.provider.send("hardhat_setBalance", [a, targetBalance1]);
                    // snapshot after balance1
                    const snapshotId = await this.provider.send("evm_snapshot");
                    // set balance 2
                    const targetBalance2 = (0, base_types_1.numberToRpcQuantity)(2);
                    await this.provider.send("hardhat_setBalance", [a, targetBalance2]);
                    // check that previous block has balance 2
                    await this.provider.send("evm_mine");
                    const balancePreviousBlock = await this.provider.send("eth_getBalance", [a, currentBlockNumber]);
                    chai_1.assert.strictEqual(balancePreviousBlock, targetBalance2);
                    // revert snapshot
                    await this.provider.send("evm_revert", [snapshotId]);
                    // repeat previous check with balance 1 now
                    await this.provider.send("evm_mine");
                    const balancePreviousBlockAfterRevert = await this.provider.send("eth_getBalance", [a, currentBlockNumber]);
                    chai_1.assert.strictEqual(balancePreviousBlockAfterRevert, targetBalance1);
                });
            });
            (0, mocha_1.describe)("hardhat_setCode", function () {
                let contractNine;
                let abiEncoder;
                before(async function () {
                    [
                        ,
                        {
                            contracts: {
                                ["literal.sol"]: { Nine: contractNine },
                            },
                        },
                    ] = await (0, compilation_1.compileLiteral)(`
            contract Nine {
                function returnNine() public pure returns (int) { return 9; }
            }
          `);
                    abiEncoder = new ethers_1.ethers.utils.Interface(contractNine.abi);
                });
                it("should reject an invalid address", async function () {
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_setCode", ["0x1234", "0x0"], 'Errors encountered in param 0: Invalid value "0x1234" supplied to : ADDRESS');
                });
                it("should reject an invalid data argument", async function () {
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_setCode", [providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0], "xyz"], 'Errors encountered in param 1: Invalid value "xyz" supplied to : DATA');
                });
                it("should not reject valid argument types", async function () {
                    await this.provider.send("hardhat_setCode", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        "0xff",
                    ]);
                });
                it("should result in modified code", async function () {
                    const targetCode = "0x0123456789abcdef";
                    await this.provider.send("hardhat_setCode", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        targetCode,
                    ]);
                    const actualCode = await this.provider.send("eth_getCode", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        "latest",
                    ]);
                    chai_1.assert.equal(actualCode, targetCode);
                });
                it("should, when setting code on an empty account, result in code that can actually be executed", async function () {
                    const notYetExistingAccount = "0x1234567890123456789012345678901234567890";
                    await this.provider.send("hardhat_setCode", [
                        notYetExistingAccount,
                        `0x${contractNine.evm.deployedBytecode.object}`,
                    ]);
                    chai_1.assert.equal(await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: notYetExistingAccount,
                            data: abiEncoder.encodeFunctionData("returnNine", []),
                        },
                        "latest",
                    ]), abiEncoder.encodeFunctionResult("returnNine", [9]));
                });
                it("should, when setting code on an existing EOA, result in code that can actually be executed", async function () {
                    await this.provider.send("hardhat_setCode", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        `0x${contractNine.evm.deployedBytecode.object}`,
                    ]);
                    chai_1.assert.equal(await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: abiEncoder.encodeFunctionData("returnNine", []),
                        },
                        "latest",
                    ]), abiEncoder.encodeFunctionResult("returnNine", [9]));
                });
                it("should, when setting code on an existing contract account, result in code that can actually be executed", async function () {
                    // Arrange: Deploy a contract that always returns 10.
                    const [, { contracts: { ["literal.sol"]: { Ten: contractTen }, }, },] = await (0, compilation_1.compileLiteral)(`
            contract Ten {
              function returnTen() public pure returns (int) { return 10; }
            }
          `);
                    const contractTenAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contractTen.evm.bytecode.object}`, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0]);
                    // Act: Replace the code at that address to always return 9.
                    await this.provider.send("hardhat_setCode", [
                        contractTenAddress,
                        `0x${contractNine.evm.deployedBytecode.object}`,
                    ]);
                    // Assert: Verify the call to get 9.
                    chai_1.assert.equal(await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: contractTenAddress,
                            data: abiEncoder.encodeFunctionData("returnNine", []),
                        },
                        "latest",
                    ]), abiEncoder.encodeFunctionResult("returnNine", [9]));
                });
                it("should get changed code by block even after a new block is mined", async function () {
                    // Arrange 1: Get current block number
                    const currentBlockNumber = await this.provider.send("eth_blockNumber");
                    // Act 1: Set code on an account.
                    const code = `0x${contractNine.evm.deployedBytecode.object}`;
                    await this.provider.send("hardhat_setCode", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        code,
                    ]);
                    // Act 2: Mine a block
                    await this.provider.send("evm_mine");
                    // Assert: Ensure code is still there.
                    chai_1.assert.equal(await this.provider.send("eth_getCode", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        currentBlockNumber,
                    ]), code);
                });
                it("should not result in a modified state root", async function () {
                    // Arrange 1: Send a transaction, in order to ensure a pre-existing
                    // state root.
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: "0x100",
                        },
                    ]);
                    // Arrange 2: Capture the existing state root.
                    const oldStateRoot = (await this.provider.send("eth_getBlockByNumber", ["latest", false])).stateRoot;
                    // Act: Set the new code.
                    await this.provider.send("hardhat_setCode", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        "0x0123456789abcdef",
                    ]);
                    // Assert: Ensure state root hasn't changed.
                    const newStateRoot = (await this.provider.send("eth_getBlockByNumber", ["latest", false])).stateRoot;
                    chai_1.assert.equal(newStateRoot, oldStateRoot);
                });
            });
            (0, mocha_1.describe)("hardhat_setNonce", function () {
                it("should reject an invalid address", async function () {
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_setNonce", ["0x1234", "0x0"], 'Errors encountered in param 0: Invalid value "0x1234" supplied to : ADDRESS');
                });
                it("should reject a non-numeric nonce", async function () {
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_setNonce", [providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0], "xyz"], 'Errors encountered in param 1: Invalid value "xyz" supplied to : QUANTITY');
                });
                it("should not reject valid argument types", async function () {
                    await this.provider.send("hardhat_setNonce", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        "0x0",
                    ]);
                });
                it("should throw an InvalidInputError if new nonce is smaller than the current nonce", async function () {
                    // Arrange: Send a transaction, in order to ensure a non-zero nonce.
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            value: "0x100",
                        },
                    ]);
                    // Act & Assert: Ensure that a zero nonce now triggers the error.
                    await (0, assertions_1.assertInvalidInputError)(this.provider, "hardhat_setNonce", [providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1], "0x0"], "New nonce (0) must not be smaller than the existing nonce (1)");
                });
                it("should result in a modified nonce", async function () {
                    // Arrange: Send a transaction, in order to ensure a non-zero nonce.
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: "0x100",
                        },
                    ]);
                    // Act: Set the new nonce.
                    const targetNonce = 99;
                    await this.provider.send("hardhat_setNonce", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        (0, base_types_1.numberToRpcQuantity)(targetNonce),
                    ]);
                    // Assert: Ensure nonce got set.
                    const resultingNonce = await this.provider.send("eth_getTransactionCount", [providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0], "latest"]);
                    chai_1.assert.equal(resultingNonce, targetNonce);
                });
                it("should not result in a modified state root", async function () {
                    // Arrange 1: Send a transaction, in order to ensure a non-zero nonce.
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: "0x100",
                        },
                    ]);
                    // Arrange 2: Capture the existing state root.
                    const oldStateRoot = (await this.provider.send("eth_getBlockByNumber", ["latest", false])).stateRoot;
                    // Act: Set the new nonce.
                    await this.provider.send("hardhat_setNonce", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        (0, base_types_1.numberToRpcQuantity)(99),
                    ]);
                    // Assert: Ensure state root hasn't changed.
                    const newStateRoot = (await this.provider.send("eth_getBlockByNumber", ["latest", false])).stateRoot;
                    chai_1.assert.equal(newStateRoot, oldStateRoot);
                });
                it("should not break a subsequent transaction", async function () {
                    // Arrange: Send a transaction, in order to ensure a non-zero nonce.
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: "0x100",
                        },
                    ]);
                    // Act: Set the new nonce and execute a transaction.
                    const targetNonce = 99;
                    await this.provider.send("hardhat_setNonce", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        (0, base_types_1.numberToRpcQuantity)(targetNonce),
                    ]);
                    const txHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: "0x100",
                        },
                    ]);
                    // Assert: The executed transaction should reflects the nonce we set.
                    chai_1.assert.equal((await this.provider.send("eth_getTransactionByHash", [txHash]))
                        .nonce, targetNonce);
                });
                it("should get changed nonce by block even after a new block is mined", async function () {
                    // Arrange 1: Send a transaction, in order to ensure a non-zero nonce.
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: "0x100",
                        },
                    ]);
                    // Arrange 2: Get current block number.
                    const currentBlockNumber = await this.provider.send("eth_blockNumber");
                    // Act 1: Set the new nonce.
                    const targetNonce = 99;
                    await this.provider.send("hardhat_setNonce", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        (0, base_types_1.numberToRpcQuantity)(targetNonce),
                    ]);
                    // Act 2: Mine a block
                    await this.provider.send("evm_mine");
                    // Assert: Ensure modified nonce has persisted.
                    const resultingNonce = await this.provider.send("eth_getTransactionCount", [providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0], currentBlockNumber]);
                    chai_1.assert.equal(resultingNonce, targetNonce);
                });
                it("should throw when there are pending transactions", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                        },
                    ]);
                    await (0, assertions_1.assertInternalError)(this.provider, "hardhat_setNonce", [providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0], "0xff"], "Cannot set account nonce when the transaction pool is not empty");
                });
            });
            (0, mocha_1.describe)("hardhat_setStorageAt", function () {
                it("should reject an invalid address", async function () {
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_setStorageAt", ["0x1234", (0, base_types_1.numberToRpcQuantity)(0), (0, base_types_1.numberToRpcQuantity)(99)], 'Errors encountered in param 0: Invalid value "0x1234" supplied to : ADDRESS');
                });
                it("should reject storage key that is non-numeric", async function () {
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_setStorageAt", [providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0], "xyz", (0, base_types_1.numberToRpcQuantity)(99)], 'Errors encountered in param 1: Invalid value "xyz" supplied to : QUANTITY');
                });
                it("should reject a storage key that is greater than 32 bytes", async function () {
                    const MAX_WORD_VALUE = new ethereumjs_util_1.BN(2).pow(new ethereumjs_util_1.BN(256));
                    await (0, assertions_1.assertInvalidInputError)(this.provider, "hardhat_setStorageAt", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        (0, base_types_1.numberToRpcQuantity)(MAX_WORD_VALUE.add(new ethereumjs_util_1.BN(1))),
                        "0xff",
                    ], "Storage key must not be greater than or equal to 2^256. Received 115792089237316195423570985008687907853269984665640564039457584007913129639937.");
                });
                for (const badInputLength of [1, 2, 31, 33, 64]) {
                    it(`should reject a value that is ${badInputLength} (not exactly 32) bytes long`, async function () {
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "hardhat_setStorageAt", [
                            providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            (0, base_types_1.numberToRpcQuantity)(0),
                            `0x${"ff".repeat(badInputLength)}`,
                        ], `Storage value must be exactly 32 bytes long. Received 0x${"ff".repeat(badInputLength)}, which is ${badInputLength} bytes long.`);
                    });
                }
                it("should not reject valid argument types", async function () {
                    await this.provider.send("hardhat_setStorageAt", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        (0, base_types_1.numberToRpcQuantity)(0),
                        `0x${"ff".repeat(32)}`,
                    ]);
                });
                it("should result in modified storage", async function () {
                    const targetStorageValue = 99;
                    await this.provider.send("hardhat_setStorageAt", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        (0, base_types_1.numberToRpcQuantity)(0),
                        `0x${new ethereumjs_util_1.BN(targetStorageValue).toString(16, 64)}`,
                    ]);
                    const resultingStorageValue = await this.provider.send("eth_getStorageAt", [providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0], (0, base_types_1.numberToRpcQuantity)(0), "latest"]);
                    chai_1.assert.equal(resultingStorageValue, targetStorageValue);
                });
                it("should permit a contract call to read an updated storage value", async function () {
                    // Arrange: Deploy a contract that can get and set storage.
                    const [, { contracts: { ["literal.sol"]: { Storage: storageContract }, }, },] = await (0, compilation_1.compileLiteral)(`contract Storage {
              function getValue(uint256 position) public view returns (uint256 result) {
                assembly { result := sload(position) }
              }
            }`);
                    const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${storageContract.evm.bytecode.object}`, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0]);
                    // Act: Modify the value in the existing storage position.
                    await this.provider.send("hardhat_setStorageAt", [
                        contractAddress,
                        (0, base_types_1.numberToRpcQuantity)(0),
                        `0x${new ethereumjs_util_1.BN(10).toString(16, 64)}`,
                    ]);
                    // Assert: Verify that the contract retrieves the modified value.
                    const abiEncoder = new ethers_1.ethers.utils.Interface(storageContract.abi);
                    chai_1.assert.equal(await this.provider.send("eth_call", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: contractAddress,
                            data: abiEncoder.encodeFunctionData("getValue", [0]),
                        },
                        "latest",
                    ]), abiEncoder.encodeFunctionResult("getValue", [10]));
                });
                it("should not result in a modified state root", async function () {
                    // Arrange 1: Send a transaction, in order to ensure a pre-existing
                    // state root.
                    await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            value: "0x100",
                        },
                    ]);
                    // Arrange 2: Capture the existing state root.
                    const oldStateRoot = (await this.provider.send("eth_getBlockByNumber", ["latest", false])).stateRoot;
                    // Act: Set the new storage value.
                    await this.provider.send("hardhat_setStorageAt", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        (0, base_types_1.numberToRpcQuantity)(0),
                        `0x${"ff".repeat(32)}`,
                    ]);
                    // Assert: Ensure state root hasn't changed.
                    const newStateRoot = (await this.provider.send("eth_getBlockByNumber", ["latest", false])).stateRoot;
                    chai_1.assert.equal(newStateRoot, oldStateRoot);
                });
                it("should have the storage modification persist even after a new block is mined", async function () {
                    // Arrange 1: Get current block number.
                    const currentBlockNumber = await this.provider.send("eth_blockNumber");
                    // Act 1: Modify storage
                    const targetStorageValue = 99;
                    await this.provider.send("hardhat_setStorageAt", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        (0, base_types_1.numberToRpcQuantity)(0),
                        `0x${new ethereumjs_util_1.BN(targetStorageValue).toString(16, 64)}`,
                    ]);
                    // Act 2: Mine a block
                    await this.provider.send("evm_mine");
                    // Assert: Get storage by block
                    chai_1.assert.equal(await this.provider.send("eth_getStorageAt", [
                        providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                        (0, base_types_1.numberToRpcQuantity)(0),
                        currentBlockNumber,
                    ]), targetStorageValue);
                });
            });
            (0, mocha_1.describe)("hardhat_dropTransaction", function () {
                it("should remove pending transactions", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    const txHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                        },
                    ]);
                    const result = await this.provider.send("hardhat_dropTransaction", [
                        txHash,
                    ]);
                    const tx = await this.provider.send("eth_getTransactionByHash", [
                        txHash,
                    ]);
                    chai_1.assert.isNull(tx);
                    chai_1.assert.isTrue(result);
                });
                it("should remove queued transactions", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    const txHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                            nonce: (0, base_types_1.numberToRpcQuantity)(1),
                        },
                    ]);
                    const result = await this.provider.send("hardhat_dropTransaction", [
                        txHash,
                    ]);
                    const tx = await this.provider.send("eth_getTransactionByHash", [
                        txHash,
                    ]);
                    chai_1.assert.isNull(tx);
                    chai_1.assert.isTrue(result);
                });
                it("should rearrange transactions after removing one", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    // send 3 txs
                    const txHash1 = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                        },
                    ]);
                    const txHash2 = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                        },
                    ]);
                    const txHash3 = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                        },
                    ]);
                    // drop second transaction
                    const result = await this.provider.send("hardhat_dropTransaction", [
                        txHash2,
                    ]);
                    chai_1.assert.isTrue(result);
                    // mine block; it should have only the first tx
                    await this.provider.send("evm_mine");
                    const block = await this.provider.send("eth_getBlockByNumber", [
                        "latest",
                        false,
                    ]);
                    chai_1.assert.deepEqual(block.transactions, [txHash1]);
                    // the first and third tx should exist
                    const tx1 = await this.provider.send("eth_getTransactionByHash", [
                        txHash1,
                    ]);
                    const tx2 = await this.provider.send("eth_getTransactionByHash", [
                        txHash2,
                    ]);
                    const tx3 = await this.provider.send("eth_getTransactionByHash", [
                        txHash3,
                    ]);
                    chai_1.assert.isNotNull(tx1);
                    chai_1.assert.isNull(tx2);
                    chai_1.assert.isNotNull(tx3);
                });
                it("should return false if a tx doesn't exist", async function () {
                    const nonExistentTxHash = "0xa4b46baa47145cb30af1ceed6172604aed4d8a27f66077cad951113bebb9513d";
                    const result = await this.provider.send("hardhat_dropTransaction", [
                        nonExistentTxHash,
                    ]);
                    chai_1.assert.isFalse(result);
                });
                it("should return false when called a second time", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    const txHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                            gas: (0, base_types_1.numberToRpcQuantity)(21000),
                        },
                    ]);
                    const firstResult = await this.provider.send("hardhat_dropTransaction", [txHash]);
                    chai_1.assert.isTrue(firstResult);
                    const secondResult = await this.provider.send("hardhat_dropTransaction", [txHash]);
                    chai_1.assert.isFalse(secondResult);
                });
                it("should throw if the tx was already mined", async function () {
                    const txHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                            to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2],
                        },
                    ]);
                    await (0, assertions_1.assertInvalidArgumentsError)(this.provider, "hardhat_dropTransaction", [txHash]);
                });
            });
            (0, mocha_1.describe)("hardhat_setMinGasPrice", () => {
                (0, mocha_1.describe)("When EIP-1559 is not active", function () {
                    useProvider({ hardfork: "berlin" });
                    (0, mocha_1.describe)("When automine is disabled", function () {
                        it("makes txs below the new min gas price not minable", async function () {
                            await this.provider.send("evm_setAutomine", [false]);
                            const tx1Hash = await this.provider.send("eth_sendTransaction", [
                                {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    to: constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                                    gas: (0, base_types_1.numberToRpcQuantity)(21000),
                                    gasPrice: (0, base_types_1.numberToRpcQuantity)(10),
                                },
                            ]);
                            const tx2Hash = await this.provider.send("eth_sendTransaction", [
                                {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                    to: constants_1.EMPTY_ACCOUNT_ADDRESS.toString(),
                                    gas: (0, base_types_1.numberToRpcQuantity)(21000),
                                    gasPrice: (0, base_types_1.numberToRpcQuantity)(20),
                                },
                            ]);
                            await this.provider.send("hardhat_setMinGasPrice", [
                                (0, base_types_1.numberToRpcQuantity)(15),
                            ]);
                            // check the two txs are pending
                            const pendingTransactionsBefore = await this.provider.send("eth_pendingTransactions");
                            chai_1.assert.sameMembers(pendingTransactionsBefore.map((x) => x.hash), [tx1Hash, tx2Hash]);
                            // check only the second one is mined
                            await this.provider.send("evm_mine");
                            const latestBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                            chai_1.assert.sameMembers(latestBlock.transactions, [tx2Hash]);
                            // check the first tx is still pending
                            const pendingTransactionsAfter = await this.provider.send("eth_pendingTransactions");
                            chai_1.assert.sameMembers(pendingTransactionsAfter.map((x) => x.hash), [tx1Hash]);
                        });
                    });
                    (0, mocha_1.describe)("When automine is enabled", function () {
                        it("Should make txs below the min gas price fail", async function () {
                            await this.provider.send("hardhat_setMinGasPrice", [
                                (0, base_types_1.numberToRpcQuantity)(20),
                            ]);
                            await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                                {
                                    from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                    to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                    gasPrice: (0, base_types_1.numberToRpcQuantity)(10),
                                },
                            ], "Transaction gas price is 10, which is below the minimum of 20");
                        });
                    });
                });
                for (const hardfork of ["london", "arrowGlacier"]) {
                    (0, mocha_1.describe)(`When EIP-1559 is active (${hardfork})`, function () {
                        useProvider({ hardfork });
                        it("Should be disabled", async function () {
                            await (0, assertions_1.assertInvalidInputError)(this.provider, "hardhat_setMinGasPrice", [(0, base_types_1.numberToRpcQuantity)(1)], "hardhat_setMinGasPrice is not supported when EIP-1559 is active");
                        });
                    });
                }
            });
            (0, mocha_1.describe)("hardhat_setNextBlockBaseFeePerGas", function () {
                it("Should set the baseFee of a single block", async function () {
                    await this.provider.send("hardhat_setNextBlockBaseFeePerGas", [
                        (0, base_types_1.numberToRpcQuantity)(10),
                    ]);
                    await this.provider.send("evm_mine", []);
                    const block1 = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    chai_1.assert.equal(block1.baseFeePerGas, (0, base_types_1.numberToRpcQuantity)(10));
                    await this.provider.send("evm_mine", []);
                    const block2 = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    chai_1.assert.notEqual(block2.baseFeePerGas, (0, base_types_1.numberToRpcQuantity)(10));
                });
                (0, mocha_1.describe)("When automine is enabled", function () {
                    it("Should prevent you from sending transactions with lower maxFeePerGas or gasPrice", async function () {
                        await this.provider.send("hardhat_setNextBlockBaseFeePerGas", [
                            (0, base_types_1.numberToRpcQuantity)(10),
                        ]);
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                gasPrice: (0, base_types_1.numberToRpcQuantity)(9),
                            },
                        ], "Transaction gasPrice (9) is too low for the next block, which has a baseFeePerGas of 10");
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(8),
                            },
                        ], "Transaction maxFeePerGas (8) is too low for the next block, which has a baseFeePerGas of 10");
                    });
                });
                (0, mocha_1.describe)("When automine is disabled", function () {
                    it("Should let you send transactions with lower maxFeePerGas or gasPrice, but not mine them", async function () {
                        await this.provider.send("hardhat_setNextBlockBaseFeePerGas", [
                            (0, base_types_1.numberToRpcQuantity)(10),
                        ]);
                        await this.provider.send("evm_setAutomine", [false]);
                        await this.provider.send("eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                gasPrice: (0, base_types_1.numberToRpcQuantity)(9),
                            },
                        ]);
                        await this.provider.send("eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(8),
                            },
                        ]);
                        await this.provider.send("evm_mine", []);
                        const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                        chai_1.assert.lengthOf(block.transactions, 0);
                    });
                });
                (0, mocha_1.describe)("When EIP-1559 is not active", function () {
                    useProvider({ hardfork: "berlin" });
                    it("should be disabled", async function () {
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "hardhat_setNextBlockBaseFeePerGas", [(0, base_types_1.numberToRpcQuantity)(8)], "hardhat_setNextBlockBaseFeePerGas is disabled because EIP-1559 is not active");
                    });
                });
            });
            (0, mocha_1.describe)("hardhat_setCoinbase", function () {
                const cb1 = "0x1234567890123456789012345678901234567890";
                const cb2 = "0x0987654321098765432109876543210987654321";
                it("should set the coinbase for the new blocks", async function () {
                    await this.provider.send("hardhat_setCoinbase", [cb1]);
                    await this.provider.send("evm_mine", []);
                    const block1 = await this.provider.send("eth_getBlockByNumber", [
                        "latest",
                        false,
                    ]);
                    chai_1.assert.equal(block1.miner, cb1);
                    await this.provider.send("hardhat_setCoinbase", [cb2]);
                    await this.provider.send("evm_mine", []);
                    const block2 = await this.provider.send("eth_getBlockByNumber", [
                        "latest",
                        false,
                    ]);
                    chai_1.assert.equal(block2.miner, cb2);
                    await this.provider.send("evm_mine", []);
                    const block3 = await this.provider.send("eth_getBlockByNumber", [
                        "latest",
                        false,
                    ]);
                    chai_1.assert.equal(block3.miner, cb2);
                });
                it("should be preserved in snapshots", async function () {
                    await this.provider.send("hardhat_setCoinbase", [cb1]);
                    const snapshot = await this.provider.send("evm_snapshot");
                    await this.provider.send("hardhat_setCoinbase", [cb2]);
                    await this.provider.send("evm_mine", []);
                    const block1 = await this.provider.send("eth_getBlockByNumber", [
                        "latest",
                        false,
                    ]);
                    chai_1.assert.equal(block1.miner, cb2);
                    await this.provider.send("evm_revert", [snapshot]);
                    await this.provider.send("evm_mine", []);
                    const block1Again = await this.provider.send("eth_getBlockByNumber", [
                        "latest",
                        false,
                    ]);
                    chai_1.assert.equal(block1Again.miner, cb1);
                });
                it("should affect eth_coinbase", async function () {
                    await this.provider.send("hardhat_setCoinbase", [cb1]);
                    chai_1.assert.equal(await this.provider.send("eth_coinbase"), cb1);
                    await this.provider.send("hardhat_setCoinbase", [cb2]);
                    chai_1.assert.equal(await this.provider.send("eth_coinbase"), cb2);
                });
            });
        });
    });
});
//# sourceMappingURL=hardhat.js.map