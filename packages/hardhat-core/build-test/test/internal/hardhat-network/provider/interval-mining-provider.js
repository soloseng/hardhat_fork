"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon_1 = __importDefault(require("sinon"));
const base_types_1 = require("../../../../src/internal/core/jsonrpc/types/base-types");
const setup_1 = require("../../../setup");
const workaround_windows_ci_failures_1 = require("../../../utils/workaround-windows-ci-failures");
const cwd_1 = require("../helpers/cwd");
const providers_1 = require("../helpers/providers");
describe("Interval mining provider", function () {
    providers_1.INTERVAL_MINING_PROVIDERS.forEach(({ name, useProvider, isFork }) => {
        workaround_windows_ci_failures_1.workaroundWindowsCiFailures.call(this, { isFork });
        describe(`${name} provider`, function () {
            const safeBlockInThePast = 11200000;
            const blockTime = 10000;
            let clock;
            const getBlockNumber = async () => {
                return (0, base_types_1.rpcQuantityToNumber)(await this.ctx.provider.send("eth_blockNumber"));
            };
            beforeEach(() => {
                clock = sinon_1.default.useFakeTimers({
                    now: Date.now(),
                    toFake: ["Date", "setTimeout", "clearTimeout"],
                });
            });
            afterEach(async function () {
                await this.provider.send("evm_setIntervalMining", [0]);
                clock.restore();
            });
            (0, cwd_1.setCWD)();
            useProvider();
            describe("initialization", () => {
                it("starts interval mining automatically", async function () {
                    const firstBlock = await getBlockNumber(); // this triggers provider initialization
                    await clock.tickAsync(blockTime);
                    const secondBlock = await getBlockNumber();
                    await clock.tickAsync(blockTime);
                    const thirdBlock = await getBlockNumber();
                    chai_1.assert.equal(secondBlock, firstBlock + 1);
                    chai_1.assert.equal(thirdBlock, firstBlock + 2);
                });
            });
            describe("hardhat_reset", function () {
                if (isFork) {
                    testForkedProviderBehaviour();
                }
                else {
                    testNormalProviderBehaviour();
                }
                function testForkedProviderBehaviour() {
                    it("starts interval mining", async function () {
                        const firstBlock = await getBlockNumber();
                        await clock.tickAsync(blockTime);
                        const secondBlockBeforeReset = await getBlockNumber();
                        await this.provider.send("hardhat_reset", [
                            {
                                forking: {
                                    jsonRpcUrl: setup_1.ALCHEMY_URL,
                                    blockNumber: safeBlockInThePast,
                                },
                            },
                        ]);
                        await clock.tickAsync(blockTime);
                        const secondBlockAfterReset = await getBlockNumber();
                        await clock.tickAsync(blockTime);
                        const thirdBlock = await getBlockNumber();
                        chai_1.assert.equal(secondBlockBeforeReset, firstBlock + 1);
                        chai_1.assert.equal(secondBlockAfterReset, safeBlockInThePast + 1);
                        chai_1.assert.equal(thirdBlock, safeBlockInThePast + 2);
                    });
                }
                function testNormalProviderBehaviour() {
                    it("starts interval mining", async function () {
                        const firstBlock = await getBlockNumber();
                        await clock.tickAsync(blockTime);
                        const secondBlockBeforeReset = await getBlockNumber();
                        await this.provider.send("hardhat_reset");
                        await clock.tickAsync(blockTime);
                        const secondBlockAfterReset = await getBlockNumber();
                        await clock.tickAsync(blockTime);
                        const thirdBlock = await getBlockNumber();
                        chai_1.assert.equal(secondBlockBeforeReset, firstBlock + 1);
                        chai_1.assert.equal(secondBlockAfterReset, firstBlock + 1);
                        chai_1.assert.equal(thirdBlock, firstBlock + 2);
                    });
                }
            });
        });
    });
});
//# sourceMappingURL=interval-mining-provider.js.map