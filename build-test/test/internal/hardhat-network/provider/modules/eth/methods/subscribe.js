"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const ethers_1 = require("ethers");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const compilation_1 = require("../../../../stack-traces/compilation");
const contracts_1 = require("../../../../helpers/contracts");
const cwd_1 = require("../../../../helpers/cwd");
const providers_1 = require("../../../../helpers/providers");
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
            describe("eth_subscribe", function () {
                if (name === "JSON-RPC") {
                    return;
                }
                function createFilterResultsGetter(ethereumProvider, filter) {
                    const notificationsResults = [];
                    const notificationsListener = (payload) => {
                        if (filter === payload.subscription) {
                            notificationsResults.push(payload.result);
                        }
                    };
                    ethereumProvider.addListener("notification", notificationsListener);
                    const messageResults = [];
                    const messageListener = (event) => {
                        if (event.type === "eth_subscription") {
                            const subscriptionMessage = event;
                            if (filter === subscriptionMessage.data.subscription) {
                                messageResults.push(subscriptionMessage.data.result);
                            }
                        }
                    };
                    ethereumProvider.addListener("message", messageListener);
                    let shouldUnsubscribe = true;
                    return () => {
                        if (shouldUnsubscribe) {
                            ethereumProvider.removeListener("notifications", notificationsListener);
                            ethereumProvider.removeListener("message", messageListener);
                            shouldUnsubscribe = false;
                        }
                        return {
                            notificationsResults,
                            messageResults,
                        };
                    };
                }
                it("Supports newHeads subscribe", async function () {
                    const filterId = await this.provider.send("eth_subscribe", [
                        "newHeads",
                    ]);
                    const getResults = createFilterResultsGetter(this.provider, filterId);
                    await this.provider.send("evm_mine", []);
                    await this.provider.send("evm_mine", []);
                    await this.provider.send("evm_mine", []);
                    chai_1.assert.isTrue(await this.provider.send("eth_unsubscribe", [filterId]));
                    chai_1.assert.lengthOf(getResults().notificationsResults, 3);
                    chai_1.assert.lengthOf(getResults().messageResults, 3);
                });
                it("Supports newPendingTransactions subscribe", async function () {
                    const filterId = await this.provider.send("eth_subscribe", [
                        "newPendingTransactions",
                    ]);
                    const getResults = createFilterResultsGetter(this.provider, filterId);
                    const accounts = await this.provider.send("eth_accounts");
                    const burnTxParams = {
                        from: accounts[0],
                        to: (0, ethereumjs_util_1.zeroAddress)(),
                        gas: (0, base_types_1.numberToRpcQuantity)(21000),
                    };
                    await this.provider.send("eth_sendTransaction", [burnTxParams]);
                    chai_1.assert.isTrue(await this.provider.send("eth_unsubscribe", [filterId]));
                    await this.provider.send("eth_sendTransaction", [burnTxParams]);
                    chai_1.assert.lengthOf(getResults().notificationsResults, 1);
                    chai_1.assert.lengthOf(getResults().messageResults, 1);
                });
                it("Supports logs subscribe", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const filterId = await this.provider.send("eth_subscribe", [
                        "logs",
                        {
                            address: exampleContract,
                        },
                    ]);
                    const getResults = createFilterResultsGetter(this.provider, filterId);
                    const newState = "000000000000000000000000000000000000000000000000000000000000007b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(getResults().notificationsResults, 1);
                    chai_1.assert.lengthOf(getResults().messageResults, 1);
                });
                it("Supports logs subscribe via topic", async function () {
                    const [, { contracts: { ["literal.sol"]: { ContractA: contractA }, }, },] = await (0, compilation_1.compileLiteral)(`
            //SPDX-License-Identifier: UNLICENSED;
            pragma solidity 0.8.0;
            contract ContractA {
              event TokensMinted(uint amount);
              function mint(uint amount) public {
                emit TokensMinted(amount);
              }
            }
          `);
                    const address = await (0, transactions_1.deployContract)(this.provider, `0x${contractA.evm.bytecode.object}`, providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0]);
                    const abiEncoder = new ethers_1.ethers.utils.Interface(contractA.abi);
                    const filterId = await this.provider.send("eth_subscribe", [
                        "logs",
                        {
                            address,
                            topic: abiEncoder.getEventTopic("TokensMinted"),
                        },
                    ]);
                    const getResults = createFilterResultsGetter(this.provider, filterId);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: address,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: abiEncoder.encodeFunctionData("mint", [123]),
                        },
                    ]);
                    chai_1.assert.lengthOf(getResults().notificationsResults, 1);
                });
            });
        });
    });
});
//# sourceMappingURL=subscribe.js.map