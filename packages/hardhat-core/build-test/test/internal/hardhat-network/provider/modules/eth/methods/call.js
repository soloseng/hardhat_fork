"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const getCurrentTimestamp_1 = require("../../../../../../../src/internal/hardhat-network/provider/utils/getCurrentTimestamp");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../../../helpers/assertions");
const contracts_1 = require("../../../../helpers/contracts");
const cwd_1 = require("../../../../helpers/cwd");
const providers_1 = require("../../../../helpers/providers");
const retrieveForkBlockNumber_1 = require("../../../../helpers/retrieveForkBlockNumber");
const transactions_1 = require("../../../../helpers/transactions");
const compilation_1 = require("../../../../stack-traces/compilation");
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
            describe("eth_call", async function () {
                describe("when called without blockTag param", () => {
                    it("Should return the value returned by the contract", async function () {
                        const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                        const result = await this.provider.send("eth_call", [
                            { to: contractAddress, data: contracts_1.EXAMPLE_CONTRACT.selectors.i },
                        ]);
                        chai_1.assert.equal(result, "0x0000000000000000000000000000000000000000000000000000000000000000");
                        await this.provider.send("eth_sendTransaction", [
                            {
                                to: contractAddress,
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                data: `${contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState}000000000000000000000000000000000000000000000000000000000000000a`,
                            },
                        ]);
                        const result2 = await this.provider.send("eth_call", [
                            { to: contractAddress, data: contracts_1.EXAMPLE_CONTRACT.selectors.i },
                        ]);
                        chai_1.assert.equal(result2, "0x000000000000000000000000000000000000000000000000000000000000000a");
                    });
                    it("Should return the value returned by the contract using an unknown account as from", async function () {
                        const from = "0x1234567890123456789012345678901234567890";
                        const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                        const result = await this.provider.send("eth_call", [
                            { to: contractAddress, data: contracts_1.EXAMPLE_CONTRACT.selectors.i, from },
                        ]);
                        chai_1.assert.equal(result, "0x0000000000000000000000000000000000000000000000000000000000000000");
                        await this.provider.send("eth_sendTransaction", [
                            {
                                to: contractAddress,
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                data: `${contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState}000000000000000000000000000000000000000000000000000000000000000a`,
                            },
                        ]);
                        const result2 = await this.provider.send("eth_call", [
                            { to: contractAddress, data: contracts_1.EXAMPLE_CONTRACT.selectors.i, from },
                        ]);
                        chai_1.assert.equal(result2, "0x000000000000000000000000000000000000000000000000000000000000000a");
                    });
                    it("Should be run in the context of the last block", async function () {
                        const firstBlock = await getFirstBlock();
                        const timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 60;
                        await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                        const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_READ_CONTRACT.bytecode.object}`);
                        const blockResult = await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockNumber,
                            },
                        ]);
                        chai_1.assert.equal((0, base_types_1.rpcDataToNumber)(blockResult), firstBlock + 1);
                        const timestampResult = await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockTimestamp,
                            },
                        ]);
                        chai_1.assert.equal(timestampResult, timestamp);
                    });
                    it("Should return an empty buffer when a non-contract account is called", async function () {
                        const result = await this.provider.send("eth_call", [
                            {
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                            },
                        ]);
                        chai_1.assert.equal(result, "0x");
                    });
                    it("Should work with blockhashes calls", async function () {
                        const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_BLOCKHASH_CONTRACT.bytecode.object}`);
                        const resultBlock0 = await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_BLOCKHASH_CONTRACT.selectors.test0,
                            },
                        ]);
                        chai_1.assert.lengthOf(resultBlock0, 66);
                        const resultBlock1 = await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_BLOCKHASH_CONTRACT.selectors.test1,
                            },
                        ]);
                        chai_1.assert.lengthOf(resultBlock1, 66);
                        const resultBlock1m = await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_BLOCKHASH_CONTRACT.selectors.test1m,
                            },
                        ]);
                        chai_1.assert.equal(resultBlock1m, "0x0000000000000000000000000000000000000000000000000000000000000000");
                    });
                    it("should run in the context of the blocktag's block", async function () {
                        const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_READ_CONTRACT.bytecode.object}`);
                        const blockNumber = (0, base_types_1.rpcQuantityToNumber)(await this.provider.send("eth_blockNumber", []));
                        await this.provider.send("evm_mine", []);
                        await this.provider.send("evm_mine", []);
                        const blockResult = await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockNumber,
                            },
                            (0, base_types_1.numberToRpcQuantity)(blockNumber),
                        ]);
                        chai_1.assert.equal((0, base_types_1.rpcDataToNumber)(blockResult), blockNumber);
                    });
                    it("should accept a gas limit higher than the block gas limit being used", async function () {
                        const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_READ_CONTRACT.bytecode.object}`);
                        const blockNumber = (0, base_types_1.rpcQuantityToNumber)(await this.provider.send("eth_blockNumber", []));
                        const gas = "0x5f5e100"; // 100M gas
                        const blockResult = await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockNumber,
                                gas,
                            },
                            (0, base_types_1.numberToRpcQuantity)(blockNumber),
                        ]);
                        chai_1.assert.equal((0, base_types_1.rpcDataToNumber)(blockResult), blockNumber);
                        const blockResult2 = await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockNumber,
                                gas,
                            },
                            "pending",
                        ]);
                        chai_1.assert.equal((0, base_types_1.rpcDataToNumber)(blockResult2), blockNumber + 1);
                    });
                    it("Should accept explicit nulls for optional parameter values", async function () {
                        // For simplicity of this test, and because this test only intends
                        // to exercise input parameter validation, utilize the case of
                        // eth_call calling into a non-contract account, which returns an
                        // empty buffer.
                        chai_1.assert.equal(await this.provider.send("eth_call", [
                            {
                                from: null,
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                gas: null,
                                gasPrice: null,
                                value: null,
                                data: null,
                            },
                        ]), "0x");
                    });
                });
                describe("when called with 'latest' blockTag param", () => {
                    it("Should be run in the context of the last block", async function () {
                        const firstBlock = await getFirstBlock();
                        const timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 60;
                        await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                        const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_READ_CONTRACT.bytecode.object}`);
                        const blockResult = await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockNumber,
                            },
                            "latest",
                        ]);
                        chai_1.assert.equal((0, base_types_1.rpcDataToNumber)(blockResult), firstBlock + 1);
                        const timestampResult = await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockTimestamp,
                            },
                            "latest",
                        ]);
                        chai_1.assert.equal(timestampResult, timestamp);
                    });
                });
                describe("when called with 'pending' blockTag param", () => {
                    it("Should be run in the context of a new block", async function () {
                        const firstBlock = await getFirstBlock();
                        const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_READ_CONTRACT.bytecode.object}`);
                        const timestamp = (0, getCurrentTimestamp_1.getCurrentTimestamp)() + 60;
                        await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                        const blockResult = await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockNumber,
                            },
                            "pending",
                        ]);
                        chai_1.assert.equal((0, base_types_1.rpcDataToNumber)(blockResult), firstBlock + 2);
                        const timestampResult = await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockTimestamp,
                            },
                            "pending",
                        ]);
                        chai_1.assert.equal(timestampResult, timestamp);
                    });
                    it("Should be run in the context with pending transactions mined", async function () {
                        const snapshotId = await this.provider.send("evm_snapshot");
                        const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                        await this.provider.send("evm_revert", [snapshotId]);
                        await this.provider.send("evm_setAutomine", [false]);
                        await this.provider.send("eth_sendTransaction", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                data: `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`,
                                gas: (0, base_types_1.numberToRpcQuantity)(providers_1.DEFAULT_BLOCK_GAS_LIMIT),
                            },
                        ]);
                        const result = await this.provider.send("eth_call", [
                            { to: contractAddress, data: contracts_1.EXAMPLE_CONTRACT.selectors.i },
                            "pending",
                        ]);
                        // result would equal "0x" if the contract wasn't deployed
                        chai_1.assert.equal(result, "0x0000000000000000000000000000000000000000000000000000000000000000");
                        await this.provider.send("evm_mine");
                        await this.provider.send("eth_sendTransaction", [
                            {
                                to: contractAddress,
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                data: `${contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState}000000000000000000000000000000000000000000000000000000000000000a`,
                            },
                        ]);
                        const result2 = await this.provider.send("eth_call", [
                            { to: contractAddress, data: contracts_1.EXAMPLE_CONTRACT.selectors.i },
                            "pending",
                        ]);
                        chai_1.assert.equal(result2, "0x000000000000000000000000000000000000000000000000000000000000000a");
                    });
                });
                describe("when called with a block number as blockTag param", () => {
                    it("Should be run in the context of the block passed as a parameter", async function () {
                        const firstBlock = await getFirstBlock();
                        const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_READ_CONTRACT.bytecode.object}`);
                        await this.provider.send("evm_mine");
                        await this.provider.send("evm_mine");
                        await this.provider.send("evm_mine");
                        const blockResult = await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_READ_CONTRACT.selectors.blockNumber,
                            },
                            (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                        ]);
                        chai_1.assert.equal((0, base_types_1.rpcDataToNumber)(blockResult), firstBlock + 1);
                    });
                    it("Should throw invalid input error if called in the context of a nonexistent block", async function () {
                        const firstBlock = await getFirstBlock();
                        const futureBlock = firstBlock + 1;
                        await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_call", [
                            {
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                to: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                                value: (0, base_types_1.numberToRpcQuantity)(123),
                            },
                            (0, base_types_1.numberToRpcQuantity)(futureBlock),
                        ], `Received invalid block tag ${futureBlock}. Latest block number is ${firstBlock}`);
                    });
                    it("Should leverage block tag parameter", async function () {
                        const firstBlock = await getFirstBlock();
                        const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                        const newState = "000000000000000000000000000000000000000000000000000000000000000a";
                        await this.provider.send("eth_sendTransaction", [
                            {
                                to: contractAddress,
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                                data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                            },
                        ]);
                        chai_1.assert.equal(await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            },
                            (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                        ]), "0x0000000000000000000000000000000000000000000000000000000000000000");
                        chai_1.assert.equal(await this.provider.send("eth_call", [
                            {
                                to: contractAddress,
                                data: contracts_1.EXAMPLE_CONTRACT.selectors.i,
                                from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            },
                            "latest",
                        ]), `0x${newState}`);
                    });
                    it("Should return the initial balance for the genesis accounts in the previous block after a transaction", async function () {
                        const blockNumber = await this.provider.send("eth_blockNumber");
                        const account = providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0];
                        const initialBalanceBeforeTx = await this.provider.send("eth_getBalance", [account, blockNumber]);
                        chai_1.assert.equal(initialBalanceBeforeTx, "0x3635c9adc5dea00000");
                        await (0, transactions_1.sendTxToZeroAddress)(this.provider, account);
                        const initialBalanceAfterTx = await this.provider.send("eth_getBalance", [account, blockNumber]);
                        chai_1.assert.equal(initialBalanceAfterTx, "0x3635c9adc5dea00000");
                    });
                });
                describe("Fee price fields", function () {
                    let deploymentBytecode;
                    let balanceSelector;
                    before(async function () {
                        const [_, compilerOutput] = await (0, compilation_1.compileLiteral)(`
contract C {
  function balance() public view returns (uint) {
    return msg.sender.balance;
  }
}
`);
                        const contract = compilerOutput.contracts["literal.sol"].C;
                        deploymentBytecode = `0x${contract.evm.bytecode.object}`;
                        balanceSelector = `0x${contract.evm.methodIdentifiers["balance()"]}`;
                    });
                    const CALLER = providers_1.DEFAULT_ACCOUNTS_ADDRESSES[2];
                    let contractAddress;
                    let ethBalance;
                    function deployContractAndGetEthBalance() {
                        beforeEach(async function () {
                            contractAddress = await (0, transactions_1.deployContract)(this.provider, deploymentBytecode);
                            ethBalance = (0, base_types_1.rpcQuantityToBN)(await this.provider.send("eth_getBalance", [CALLER]));
                            chai_1.assert.notEqual(ethBalance.toString(), "0");
                        });
                    }
                    describe("When running without EIP-1559", function () {
                        useProvider({ hardfork: "berlin" });
                        deployContractAndGetEthBalance();
                        it("Should default to gasPrice 0", async function () {
                            const balanceResult = await this.provider.send("eth_call", [
                                {
                                    from: CALLER,
                                    to: contractAddress,
                                    data: balanceSelector,
                                },
                            ]);
                            chai_1.assert.equal((0, base_types_1.rpcDataToBN)(balanceResult).toString(), ethBalance.toString());
                        });
                        it("Should use any provided gasPrice", async function () {
                            const gasLimit = 200000;
                            const gasPrice = 2;
                            const balanceResult = await this.provider.send("eth_call", [
                                {
                                    from: CALLER,
                                    to: contractAddress,
                                    data: balanceSelector,
                                    gas: (0, base_types_1.numberToRpcQuantity)(gasLimit),
                                    gasPrice: (0, base_types_1.numberToRpcQuantity)(gasPrice),
                                },
                            ]);
                            chai_1.assert.isTrue((0, base_types_1.rpcDataToBN)(balanceResult).eq(ethBalance.subn(gasLimit * gasPrice)));
                        });
                    });
                    for (const hardfork of ["london", "arrowGlacier"]) {
                        describe(`When running with EIP-1559 (${hardfork})`, function () {
                            useProvider({ hardfork });
                            deployContractAndGetEthBalance();
                            it("Should validate that gasPrice and maxFeePerGas & maxPriorityFeePerGas are not mixed", async function () {
                                await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_call", [
                                    {
                                        from: CALLER,
                                        to: contractAddress,
                                        gasPrice: (0, base_types_1.numberToRpcQuantity)(1),
                                        maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(1),
                                    },
                                ], "Cannot send both gasPrice and maxFeePerGas");
                                await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_call", [
                                    {
                                        from: CALLER,
                                        to: contractAddress,
                                        gasPrice: (0, base_types_1.numberToRpcQuantity)(1),
                                        maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(1),
                                    },
                                ], "Cannot send both gasPrice and maxPriorityFeePerGas");
                            });
                            it("Should validate that maxFeePerGas >= maxPriorityFeePerGas", async function () {
                                await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_call", [
                                    {
                                        from: CALLER,
                                        to: contractAddress,
                                        maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(1),
                                        maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(2),
                                    },
                                ], "maxPriorityFeePerGas (2) is bigger than maxFeePerGas (1)");
                            });
                            it("Should default to maxFeePerGas = 0 if nothing provided", async function () {
                                const balanceResult = await this.provider.send("eth_call", [
                                    {
                                        from: CALLER,
                                        to: contractAddress,
                                        data: balanceSelector,
                                    },
                                ]);
                                chai_1.assert.equal((0, base_types_1.rpcDataToBN)(balanceResult).toString(), ethBalance.toString());
                            });
                            it("Should use maxFeePerGas if provided with a maxPriorityFeePerGas = 0", async function () {
                                const balanceResult = await this.provider.send("eth_call", [
                                    {
                                        from: CALLER,
                                        to: contractAddress,
                                        data: balanceSelector,
                                        maxFeePerGas: (0, base_types_1.numberToRpcQuantity)(1),
                                    },
                                ]);
                                // This doesn't change because the baseFeePerGas of block where we
                                // run the eth_call is 0
                                chai_1.assert.equal((0, base_types_1.rpcDataToBN)(balanceResult).toString(), ethBalance.toString());
                            });
                            it("Should use maxPriorityFeePerGas if provided, with maxFeePerGas = maxPriorityFeePerGas", async function () {
                                const balanceResult = await this.provider.send("eth_call", [
                                    {
                                        from: CALLER,
                                        to: contractAddress,
                                        data: balanceSelector,
                                        maxPriorityFeePerGas: (0, base_types_1.numberToRpcQuantity)(3),
                                        gas: (0, base_types_1.numberToRpcQuantity)(500000),
                                    },
                                ]);
                                // The miner will get the priority fee
                                chai_1.assert.isTrue((0, base_types_1.rpcDataToBN)(balanceResult).eq(ethBalance.subn(500000 * 3)));
                            });
                            it("Should use gasPrice if provided", async function () {
                                const balanceResult = await this.provider.send("eth_call", [
                                    {
                                        from: CALLER,
                                        to: contractAddress,
                                        data: balanceSelector,
                                        gasPrice: (0, base_types_1.numberToRpcQuantity)(6),
                                        gas: (0, base_types_1.numberToRpcQuantity)(500000),
                                    },
                                ]);
                                // The miner will get the gasPrice * gas as a normalized priority fee
                                chai_1.assert.isTrue((0, base_types_1.rpcDataToBN)(balanceResult).eq(ethBalance.subn(500000 * 6)));
                            });
                        });
                    }
                });
            });
        });
    });
});
//# sourceMappingURL=call.js.map