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
            describe("eth_getLogs", async function () {
                let firstBlock;
                beforeEach(async function () {
                    firstBlock = await getFirstBlock();
                });
                it("Supports get logs", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000007b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            address: "0x0000000000000000000000000000000000000000",
                        },
                    ]), 0);
                    const logs = await this.provider.send("eth_getLogs", [
                        {
                            address: exampleContract,
                        },
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
                it("Supports get logs with address", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            address: exampleContract,
                        },
                    ]), 1);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            address: "0x0000000000000000000000000000000000000000",
                        },
                    ]), 0);
                });
                it("Supports get logs with topics", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            topics: [
                                "0x3359f789ea83a10b6e9605d460de1088ff290dd7b3c9a155c896d45cf495ed4d",
                            ],
                        },
                    ]), 1);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            topics: [
                                "0x0000000000000000000000000000000000000000000000000000000000000000",
                            ],
                        },
                    ]), 0);
                });
                it("Supports get logs with null topic", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            topics: [
                                null,
                                "0x0000000000000000000000000000000000000000000000000000000000000000",
                            ],
                        },
                    ]), 1);
                });
                it("Supports get logs with multiple topic", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            fromBlock: (0, base_types_1.numberToRpcQuantity)(firstBlock + 2),
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
                    ]), 2);
                });
                it("Supports get logs with fromBlock", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            fromBlock: (0, base_types_1.numberToRpcQuantity)(firstBlock + 3),
                        },
                    ]), 1);
                });
                it("Supports get logs with toBlock", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    chai_1.assert.lengthOf(await this.provider.send("eth_getLogs", [
                        {
                            fromBlock: (0, base_types_1.numberToRpcQuantity)(firstBlock + 1),
                            toBlock: (0, base_types_1.numberToRpcQuantity)(firstBlock + 2),
                        },
                    ]), 1);
                });
                it("should accept out of bound block numbers", async function () {
                    const logs = await this.provider.send("eth_getLogs", [
                        {
                            address: "0x0000000000000000000000000000000000000000",
                            fromBlock: (0, base_types_1.numberToRpcQuantity)(firstBlock + 10000000),
                        },
                    ]);
                    chai_1.assert.lengthOf(logs, 0);
                    const logs2 = await this.provider.send("eth_getLogs", [
                        {
                            address: "0x0000000000000000000000000000000000000000",
                            fromBlock: (0, base_types_1.numberToRpcQuantity)(firstBlock),
                            toBlock: (0, base_types_1.numberToRpcQuantity)(firstBlock + 1000000),
                        },
                    ]);
                    chai_1.assert.lengthOf(logs2, 0);
                });
                it("should return a new array every time", async function () {
                    const exampleContract = await (0, transactions_1.deployContract)(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const newState = "000000000000000000000000000000000000000000000000000000000000003b";
                    await this.provider.send("eth_sendTransaction", [
                        {
                            to: exampleContract,
                            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
                            data: contracts_1.EXAMPLE_CONTRACT.selectors.modifiesState + newState,
                        },
                    ]);
                    const logs1 = await this.provider.send("eth_getLogs", [
                        {
                            address: exampleContract,
                        },
                    ]);
                    logs1[0].address = "changed";
                    const logs2 = await this.provider.send("eth_getLogs", [
                        {
                            address: exampleContract,
                        },
                    ]);
                    chai_1.assert.notEqual(logs1, logs2);
                    chai_1.assert.notEqual(logs1[0], logs2[0]);
                    chai_1.assert.notEqual(logs2[0].address, "changed");
                });
                it("should have logIndex for logs in remote blocks", async function () {
                    if (!isFork) {
                        this.skip();
                    }
                    const logs = await this.provider.send("eth_getLogs", [
                        {
                            address: "0x2A07fBCD64BE0e2329890C21c6F34e81889a5912",
                            topics: [
                                "0x8f7de836135871245dd9c04f295aef602311da1591d262ecb4d2f45c7a88003d",
                            ],
                            fromBlock: (0, base_types_1.numberToRpcQuantity)(10721019),
                            toBlock: (0, base_types_1.numberToRpcQuantity)(10721019),
                        },
                    ]);
                    chai_1.assert.lengthOf(logs, 1);
                    chai_1.assert.isDefined(logs[0].logIndex);
                    chai_1.assert.isNotNull(logs[0].logIndex);
                });
            });
        });
    });
});
//# sourceMappingURL=getLogs.js.map