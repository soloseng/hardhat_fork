"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const base_types_1 = require("../../../../../../../src/internal/core/jsonrpc/types/base-types");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const contracts_1 = require("../../../../helpers/contracts");
const cwd_1 = require("../../../../helpers/cwd");
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
            describe("eth_getFilterLogs", async function () {
                let firstBlock;
                beforeEach(async function () {
                    firstBlock = await getFirstBlock();
                });
                it("Supports get filter logs", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    const filterId = await this.provider.send("eth_newFilter", [{}]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    const logs = await this.provider.send("eth_getFilterLogs", [
                        filterId,
                    ]);
                    chai_1.assert.lengthOf(logs, 1);
                    const log = logs[0];
                    chai_1.assert.equal(log.removed, false);
                    chai_1.assert.equal(log.logIndex, "0x0");
                    chai_1.assert.equal(log.transactionIndex, "0x0");
                    chai_1.assert.equal((0, base_types_1.rpcQuantityToNumber)(log.blockNumber), firstBlock + 2);
                    chai_1.assert.equal(log.address, exampleContract);
                    chai_1.assert.equal(log.data, `0x${newState}`);
                });
                it("Supports uninstalling an existing log filter", async function () {
                    const filterId = await this.provider.send("eth_newFilter", [{}]);
                    const uninstalled = await this.provider.send("eth_uninstallFilter", [
                        filterId,
                    ]);
                    chai_1.assert.isTrue(uninstalled);
                });
                it("Supports get filter logs with address", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    const filterId = await this.provider.send("eth_newFilter", [
                        {
                            address: exampleContract,
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getFilterLogs", [filterId]), 1);
                });
                it("Supports get filter logs with topics", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    const filterId = await this.provider.send("eth_newFilter", [
                        {
                            topics: [
                                "0x3359f789ea83a10b6e9605d460de1088ff290dd7b3c9a155c896d45cf495ed4d",
                                "0x0000000000000000000000000000000000000000000000000000000000000000",
                            ],
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getFilterLogs", [filterId]), 1);
                });
                it("Supports get filter logs with null topic", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    const filterId = await this.provider.send("eth_newFilter", [
                        {
                            topics: [
                                "0x3359f789ea83a10b6e9605d460de1088ff290dd7b3c9a155c896d45cf495ed4d",
                                null,
                            ],
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getFilterLogs", [filterId]), 1);
                });
                it("Supports get filter logs with multiple topics", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    const filterId = await this.provider.send("eth_newFilter", [
                        {
                            topics: [
                                [
                                    "0x3359f789ea83a10b6e9605d460de1088ff290dd7b3c9a155c896d45cf495ed4d",
                                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                                ],
                                [
                                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                                ],
                            ],
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getFilterLogs", [filterId]), 1);
                });
                it("Supports get filter logs with fromBlock", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    const filterId = await this.provider.send("eth_newFilter", [
                        {
                            fromBlock: (0, base_types_1.numberToRpcQuantity)(firstBlock),
                            address: exampleContract,
                            topics: [
                                [
                                    "0x3359f789ea83a10b6e9605d460de1088ff290dd7b3c9a155c896d45cf495ed4d",
                                ],
                                [
                                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                                    "0x000000000000000000000000000000000000000000000000000000000000003b",
                                ],
                            ],
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getFilterLogs", [filterId]), 2);
                });
                it("Supports get filter logs with toBlock", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    const filterId = await this.provider.send("eth_newFilter", [
                        {
                            fromBlock: (0, base_types_1.numberToRpcQuantity)(firstBlock),
                            toBlock: (0, base_types_1.numberToRpcQuantity)(firstBlock + 2),
                            address: exampleContract,
                            topics: [
                                [
                                    "0x3359f789ea83a10b6e9605d460de1088ff290dd7b3c9a155c896d45cf495ed4d",
                                ],
                                [
                                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                                    "0x000000000000000000000000000000000000000000000000000000000000003b",
                                ],
                            ],
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getFilterLogs", [filterId]), 1);
                });
            });
        });
    });
});
//# sourceMappingURL=getFilterLogs.js.map