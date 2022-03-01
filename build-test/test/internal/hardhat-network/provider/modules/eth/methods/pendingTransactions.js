"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const cwd_1 = require("../../../../helpers/cwd");
const providers_1 = require("../../../../helpers/providers");
const sendDummyTransaction_1 = require("../../../../helpers/sendDummyTransaction");
describe("Eth module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork }) => {
        if (isFork) {
            this.timeout(50000);
        }
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork });
        describe(`${name} provider`, function () {
            (0, cwd_1.setCWD)();
            useProvider();
            describe("eth_pendingTransactions", async function () {
                it("should return an empty array if there are no pending transactions", async function () {
                    chai_1.assert.deepEqual(await this.provider.send("eth_pendingTransactions"), []);
                });
                it("should return an array of pending transactions", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    const txs = [];
                    txs.push(await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 0, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    }));
                    txs.push(await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 1, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    }));
                    txs.push(await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 4, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    }));
                    txs.push(await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 9, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    }));
                    const pendingTransactions = await this.provider.send("eth_pendingTransactions");
                    chai_1.assert.lengthOf(pendingTransactions, 4);
                    chai_1.assert.sameOrderedMembers(pendingTransactions.map((tx) => tx.hash), txs);
                });
                it("should return an array with remaining pending transactions after a block was mined", async function () {
                    await this.provider.send("evm_setAutomine", [false]);
                    await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 0, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    });
                    await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 1, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    });
                    const tx1 = await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 4, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    });
                    const tx2 = await (0, sendDummyTransaction_1.sendDummyTransaction)(this.provider, 9, {
                        from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[1],
                    });
                    const pendingTransactionsBefore = await this.provider.send("eth_pendingTransactions");
                    await this.provider.send("evm_mine");
                    const pendingTransactionsAfter = await this.provider.send("eth_pendingTransactions");
                    chai_1.assert.notSameDeepOrderedMembers(pendingTransactionsAfter, pendingTransactionsBefore);
                    chai_1.assert.lengthOf(pendingTransactionsBefore, 4);
                    chai_1.assert.lengthOf(pendingTransactionsAfter, 2);
                    chai_1.assert.sameOrderedMembers(pendingTransactionsAfter.map((tx) => tx.hash), [tx1, tx2]);
                });
            });
        });
    });
});
//# sourceMappingURL=pendingTransactions.js.map