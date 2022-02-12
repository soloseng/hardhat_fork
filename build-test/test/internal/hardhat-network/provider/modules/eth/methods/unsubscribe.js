"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const workaround_windows_ci_failures_1 = require("../../../../../../utils/workaround-windows-ci-failures");
const cwd_1 = require("../../../../helpers/cwd");
const providers_1 = require("../../../../helpers/providers");
describe("Eth module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork }) => {
        if (isFork) {
            this.timeout(50000);
        }
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork });
        describe(`${name} provider`, function () {
            (0, cwd_1.setCWD)();
            useProvider();
            describe("eth_unsubscribe", async function () {
                it("Supports unsubscribe", async function () {
                    const filterId = await this.provider.send("eth_subscribe", [
                        "newHeads",
                    ]);
                    chai_1.assert.isTrue(await this.provider.send("eth_unsubscribe", [filterId]));
                });
                it("Doesn't fail when unsubscribe is called for a non-existent filter", async function () {
                    chai_1.assert.isFalse(await this.provider.send("eth_unsubscribe", ["0x1"]));
                });
            });
        });
    });
});
//# sourceMappingURL=unsubscribe.js.map