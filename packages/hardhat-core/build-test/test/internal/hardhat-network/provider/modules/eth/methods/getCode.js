"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const random_1 = require("../../../../../../../src/internal/hardhat-network/provider/fork/random");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const assertions_1 = require("../../../../helpers/assertions");
const contracts_1 = require("../../../../helpers/contracts");
const cwd_1 = require("../../../../helpers/cwd");
const providers_1 = require("../../../../helpers/providers");
const retrieveForkBlockNumber_1 = require("../../../../helpers/retrieveForkBlockNumber");
const transactions_1 = require("../../../../helpers/transactions");
const PRECOMPILES_COUNT = 8;
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
            describe("eth_getCode", async function () {
                it("Should return an empty buffer for non-contract accounts", async function () {
                    chai_1.assert.equal(await this.provider.send("eth_getCode", [(0, ethereumjs_util_1.zeroAddress)()]), "0x");
                });
                it("Should return an empty buffer for precompiles", async function () {
                    for (let i = 1; i <= PRECOMPILES_COUNT; i++) {
                        const precompileNumber = i.toString(16);
                        const zero = (0, ethereumjs_util_1.zeroAddress)();
                        chai_1.assert.equal(await this.provider.send("eth_getCode", [
                            zero.substr(0, zero.length - precompileNumber.length) +
                                precompileNumber,
                        ]), "0x");
                    }
                });
                it("Should return the deployed code", async function () {
                    // This a deployment transaction that pushes 0x41 (i.e. ascii A) followed by 31 0s to
                    // the stack, stores that in memory, and then returns the first byte from memory.
                    // This deploys a contract which a single byte of code, 0x41.
                    const contractAddress = await (0, transactions_1.deployContract)(this.provider, "0x7f410000000000000000000000000000000000000000000000000000000000000060005260016000f3");
                    chai_1.assert.equal(await this.provider.send("eth_getCode", [contractAddress]), "0x41");
                });
                it("Should leverage block tag parameter", async function () {
                    const firstBlock = await getFirstBlock();
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    chai_1.assert.strictEqual(await this.provider.send("eth_getCode", [
                        exampleContract,
                        (0, base_types_1.numberToRpcQuantity)(firstBlock),
                    ]), "0x");
                });
                it("Should return the deployed code in the context of a new block with 'pending' block tag param", async function () {
                    const snapshotId = await this.provider.send("evm_snapshot");
                    const contractAddress = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    chai_1.assert.isNotNull(contractAddress);
                    const contractCodeBefore = await this.provider.send("eth_getCode", [
                        contractAddress,
                        "latest",
                    ]);
                    await this.provider.send("evm_revert", [snapshotId]);
                    await this.provider.send("evm_setAutomine", [false]);
                    const txHash = await this.provider.send("eth_sendTransaction", [
                        {
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`,
                            gas: (0, base_types_1.numberToRpcQuantity)(providers_1.DEFAULT_BLOCK_GAS_LIMIT),
                        },
                    ]);
                    const txReceipt = await this.provider.send("eth_getTransactionReceipt", [txHash]);
                    const contractCodeAfter = await this.provider.send("eth_getCode", [
                        contractAddress,
                        "pending",
                    ]);
                    chai_1.assert.isNull(txReceipt);
                    chai_1.assert.strictEqual(contractCodeAfter, contractCodeBefore);
                });
                it("Should throw invalid input error if called in the context of a nonexistent block", async function () {
                    const firstBlock = await getFirstBlock();
                    const futureBlock = firstBlock + 1;
                    await (0, assertions_1.assertInvalidInputError)(this.provider, "eth_getCode", [(0, random_1.randomAddress)().toString(), (0, base_types_1.numberToRpcQuantity)(futureBlock)], `Received invalid block tag ${futureBlock}. Latest block number is ${firstBlock}`);
                });
            });
        });
    });
});
//# sourceMappingURL=getCode.js.map