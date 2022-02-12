"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon_1 = __importDefault(require("sinon"));
const MiningTimer_1 = require("../../../../src/internal/hardhat-network/provider/MiningTimer");
const sleep_1 = require("../helpers/sleep");
describe("Mining Timer", () => {
    const defaultBlockTime = 10000;
    let miningTimer;
    let mineFunction;
    let sinonClock;
    beforeEach(() => {
        mineFunction = sinon_1.default.fake();
        miningTimer = new MiningTimer_1.MiningTimer(defaultBlockTime, mineFunction);
        sinonClock = sinon_1.default.useFakeTimers({
            now: Date.now(),
            toFake: ["setTimeout", "clearTimeout"],
        });
    });
    afterEach(() => {
        sinonClock.restore();
    });
    describe("construction", function () {
        it("throws when blockTime passed to the constructor is negative", () => {
            chai_1.assert.throws(() => new MiningTimer_1.MiningTimer(-1, mineFunction), Error, "Block time cannot be negative");
        });
        it("throws when blockTime range is invalid", () => {
            chai_1.assert.throws(() => new MiningTimer_1.MiningTimer([2000, 1000], mineFunction), Error, "Invalid block time range");
        });
    });
    describe("setBlockTime", () => {
        it("sets a new block time (fixed interval)", () => {
            const newBlockTime = 15000;
            miningTimer.setBlockTime(newBlockTime);
            const actualBlockTime = miningTimer.getBlockTime();
            chai_1.assert.equal(actualBlockTime, newBlockTime);
        });
        it("sets a new block time (range)", () => {
            const newBlockTime = [0, 2000];
            miningTimer.setBlockTime(newBlockTime);
            const actualBlockTime = miningTimer.getBlockTime();
            chai_1.assert.equal(actualBlockTime, newBlockTime);
        });
        it("triggers a new loop when mining timer is running", async () => {
            const newBlockTime = Math.ceil(defaultBlockTime / 2);
            miningTimer.start();
            await sinonClock.tickAsync(defaultBlockTime - 500);
            miningTimer.setBlockTime(newBlockTime);
            await sinonClock.tickAsync(500);
            const currentBlockTime = miningTimer.getBlockTime();
            chai_1.assert.equal(currentBlockTime, newBlockTime);
            chai_1.assert.isTrue(mineFunction.notCalled);
            await sinonClock.tickAsync(newBlockTime - 500);
            chai_1.assert.isTrue(mineFunction.calledOnce);
        });
        it("triggers a new loop when new block time is the same as the old one", async () => {
            miningTimer.start();
            await sinonClock.tickAsync(defaultBlockTime - 500);
            miningTimer.setBlockTime(defaultBlockTime);
            await sinonClock.tickAsync(500);
            chai_1.assert.isTrue(mineFunction.notCalled);
            await sinonClock.tickAsync(defaultBlockTime - 500);
            chai_1.assert.isTrue(mineFunction.calledOnce);
        });
        it("stops when the new block time is 0", async function () {
            miningTimer.start();
            await sinonClock.tickAsync(defaultBlockTime - 500);
            miningTimer.setBlockTime(0);
            chai_1.assert.isTrue(mineFunction.notCalled);
            await sinonClock.tickAsync(defaultBlockTime + 500);
            chai_1.assert.isTrue(mineFunction.notCalled);
        });
        it("throws when the new block time is negative", () => {
            chai_1.assert.throws(() => miningTimer.setBlockTime(-1), Error, "Block time cannot be negative");
        });
        it("throws when the new block time is an invalid range", () => {
            chai_1.assert.throws(() => miningTimer.setBlockTime([3000, 2000]), Error, "Invalid block time range");
        });
    });
    describe("start", () => {
        it("starts the loop", async () => {
            miningTimer.start();
            chai_1.assert.isTrue(mineFunction.notCalled);
            await sinonClock.tickAsync(defaultBlockTime);
            chai_1.assert.isTrue(mineFunction.calledOnce);
        });
        it("the loop executes the callback over time", async () => {
            miningTimer.start();
            chai_1.assert.isTrue(mineFunction.notCalled);
            await sinonClock.tickAsync(defaultBlockTime);
            chai_1.assert.isTrue(mineFunction.calledOnce);
            await sinonClock.tickAsync(defaultBlockTime);
            chai_1.assert.isTrue(mineFunction.calledTwice);
            await sinonClock.tickAsync(defaultBlockTime);
            chai_1.assert.isTrue(mineFunction.calledThrice);
        });
        it("the loop awaits for async callback execution before looping again", async () => {
            const interval = 500;
            let callCount = 0;
            const newMineFunction = async () => {
                await (0, sleep_1.sleep)(100);
                callCount++;
            };
            miningTimer = new MiningTimer_1.MiningTimer(interval, newMineFunction);
            miningTimer.start();
            await sinonClock.tickAsync(interval);
            chai_1.assert.equal(callCount, 0);
            await sinonClock.tickAsync(90);
            chai_1.assert.equal(callCount, 0);
            await sinonClock.tickAsync(10);
            chai_1.assert.equal(callCount, 1);
            await sinonClock.tickAsync(interval + 50);
            chai_1.assert.equal(callCount, 1);
            await sinonClock.tickAsync(50);
            chai_1.assert.equal(callCount, 2);
        });
        it("multiple start calls don't affect the loop", async () => {
            miningTimer.start();
            await sinonClock.tickAsync(defaultBlockTime - 500);
            miningTimer.start();
            chai_1.assert.isTrue(mineFunction.notCalled);
            await sinonClock.tickAsync(500);
            chai_1.assert.isTrue(mineFunction.calledOnce);
        });
    });
    describe("stop", () => {
        it("stops the loop", async () => {
            miningTimer.start();
            chai_1.assert.isTrue(mineFunction.notCalled);
            miningTimer.stop();
            await sinonClock.tickAsync(defaultBlockTime);
            chai_1.assert.isTrue(mineFunction.notCalled);
        });
        it("stops the loop after a couple of callback executions", async () => {
            miningTimer.start();
            await sinonClock.tickAsync(2 * defaultBlockTime);
            chai_1.assert.isTrue(mineFunction.calledTwice);
            mineFunction.resetHistory();
            miningTimer.stop();
            await sinonClock.tickAsync(defaultBlockTime);
            chai_1.assert.isTrue(mineFunction.notCalled);
        });
    });
});
//# sourceMappingURL=MiningTimer.js.map