"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const sinon_1 = __importDefault(require("sinon"));
const ForkStateManager_1 = require("../../../../../src/internal/hardhat-network/provider/fork/ForkStateManager");
const random_1 = require("../../../../../src/internal/hardhat-network/provider/fork/random");
const makeForkClient_1 = require("../../../../../src/internal/hardhat-network/provider/utils/makeForkClient");
const setup_1 = require("../../../../setup");
const constants_1 = require("../../helpers/constants");
describe("ForkStateManager", () => {
    let client;
    let forkBlockNumber;
    let fsm;
    before(async function () {
        if (setup_1.ALCHEMY_URL === undefined) {
            this.skip();
            return;
        }
    });
    beforeEach(async () => {
        const clientResult = await (0, makeForkClient_1.makeForkClient)({ jsonRpcUrl: setup_1.ALCHEMY_URL });
        client = clientResult.forkClient;
        forkBlockNumber = clientResult.forkBlockNumber;
        fsm = new ForkStateManager_1.ForkStateManager(client, forkBlockNumber);
    });
    it("can be constructed", () => {
        chai_1.assert.instanceOf(fsm, ForkStateManager_1.ForkStateManager);
    });
    describe("copy", () => {
        /* eslint-disable  dot-notation,@typescript-eslint/dot-notation */
        it("creates a new object with the same state", async () => {
            const fsmCopy = fsm.copy();
            chai_1.assert.equal(fsmCopy["_jsonRpcClient"], fsm["_jsonRpcClient"]);
            chai_1.assert.isTrue(fsmCopy["_forkBlockNumber"].eq(fsm["_forkBlockNumber"]));
            chai_1.assert.equal(fsmCopy["_state"], fsm["_state"]);
            chai_1.assert.equal(fsmCopy["_stateRoot"], fsm["_stateRoot"]);
            chai_1.assert.equal(fsmCopy["_stateRootToState"], fsm["_stateRootToState"]);
        });
        /* eslint-enable  dot-notation,@typescript-eslint/dot-notation */
    });
    describe("getAccount", () => {
        it("can get account object", async () => {
            const { code } = await client.getAccountData(constants_1.WETH_ADDRESS, forkBlockNumber);
            const codeHash = (0, ethereumjs_util_1.keccak256)(code);
            const account = await fsm.getAccount(constants_1.WETH_ADDRESS);
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.balance).gtn(0));
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.nonce).eqn(1));
            chai_1.assert.isTrue(account.codeHash.equals(codeHash));
            chai_1.assert.isNotTrue(account.stateRoot.equals(Buffer.from([])));
        });
        it("can get non-existent account", async () => {
            const account = await fsm.getAccount(constants_1.EMPTY_ACCOUNT_ADDRESS);
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.balance).eqn(0));
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.nonce).eqn(0));
            chai_1.assert.isTrue(account.codeHash.equals(ethereumjs_util_1.KECCAK256_NULL));
            chai_1.assert.isNotTrue(account.stateRoot.equals(Buffer.from([])));
        });
        it("works with accounts created locally", async () => {
            const address = (0, random_1.randomAddress)();
            const code = (0, ethereumjs_util_1.toBuffer)("0xb16b00b1e5");
            const codeHash = (0, ethereumjs_util_1.keccak256)(code);
            await fsm.putContractCode(address, code);
            await fsm.putAccount(address, ethereumjs_util_1.Account.fromAccountData({
                nonce: new ethereumjs_util_1.BN(1),
                balance: new ethereumjs_util_1.BN(2),
                codeHash,
            }));
            const account = await fsm.getAccount(address);
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.nonce).eqn(1));
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.balance).eqn(2));
            chai_1.assert.isTrue(account.codeHash.equals(codeHash));
            chai_1.assert.isNotTrue(account.stateRoot.equals(Buffer.from([])));
        });
        it("works with accounts modified locally", async () => {
            const code = (0, ethereumjs_util_1.toBuffer)("0xb16b00b1e5");
            await fsm.putContractCode(constants_1.WETH_ADDRESS, code);
            const account = await fsm.getAccount(constants_1.WETH_ADDRESS);
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.balance).gtn(0));
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.nonce).eqn(1));
            chai_1.assert.isTrue(account.codeHash.equals((0, ethereumjs_util_1.keccak256)(code)));
            chai_1.assert.isNotTrue(account.stateRoot.equals(Buffer.from([])));
        });
    });
    describe("putAccount", () => {
        it("can create a new account", async () => {
            const address = (0, random_1.randomAddress)();
            const toPut = ethereumjs_util_1.Account.fromAccountData({
                nonce: new ethereumjs_util_1.BN(69),
                balance: new ethereumjs_util_1.BN(420),
            });
            await fsm.putAccount(address, toPut);
            const account = await fsm.getAccount(address);
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.nonce).eqn(69));
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.balance).eqn(420));
            chai_1.assert.isTrue(account.codeHash.equals(ethereumjs_util_1.KECCAK256_NULL));
        });
        it("can change balance and nonce", async () => {
            const account = await fsm.getAccount(constants_1.WETH_ADDRESS);
            const increasedNonce = new ethereumjs_util_1.BN(account.nonce).addn(1);
            const increasedBalance = new ethereumjs_util_1.BN(account.balance).addn(1);
            await fsm.putAccount(constants_1.WETH_ADDRESS, ethereumjs_util_1.Account.fromAccountData({
                nonce: increasedNonce,
                balance: increasedBalance,
                codeHash: account.codeHash,
            }));
            const updatedAccount = await fsm.getAccount(constants_1.WETH_ADDRESS);
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(updatedAccount.nonce).eq(increasedNonce));
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(updatedAccount.balance).eq(increasedBalance));
            chai_1.assert.isTrue(updatedAccount.codeHash.equals(account.codeHash));
        });
        it("can change the code stored if the codeHash is the hash of null", async () => {
            const toPut = ethereumjs_util_1.Account.fromAccountData({
                nonce: new ethereumjs_util_1.BN(69),
                balance: new ethereumjs_util_1.BN(420),
            });
            await fsm.putAccount(constants_1.WETH_ADDRESS, toPut);
            const wethContract = await fsm.getAccount(constants_1.WETH_ADDRESS);
            chai_1.assert.isTrue(wethContract.codeHash.equals(ethereumjs_util_1.KECCAK256_NULL));
        });
    });
    describe("deleteAccount", () => {
        it("can delete an account", async () => {
            const { code } = await client.getAccountData(constants_1.WETH_ADDRESS, forkBlockNumber);
            const codeHash = (0, ethereumjs_util_1.keccak256)(code);
            let account = await fsm.getAccount(constants_1.WETH_ADDRESS);
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.balance).gtn(0));
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.nonce).eqn(1));
            chai_1.assert.isTrue(account.codeHash.equals(codeHash));
            chai_1.assert.isNotTrue(account.stateRoot.equals(Buffer.from([])));
            await fsm.deleteAccount(constants_1.WETH_ADDRESS);
            account = await fsm.getAccount(constants_1.WETH_ADDRESS);
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.balance).eqn(0));
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.nonce).eqn(0));
            chai_1.assert.isTrue(account.codeHash.equals(ethereumjs_util_1.KECCAK256_NULL));
            chai_1.assert.isNotTrue(account.stateRoot.equals(Buffer.from([])));
        });
        it("can delete non-existent account", async () => {
            await fsm.deleteAccount(constants_1.EMPTY_ACCOUNT_ADDRESS);
            const account = await fsm.getAccount(constants_1.EMPTY_ACCOUNT_ADDRESS);
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.balance).eqn(0));
            chai_1.assert.isTrue(new ethereumjs_util_1.BN(account.nonce).eqn(0));
            chai_1.assert.isTrue(account.codeHash.equals(ethereumjs_util_1.KECCAK256_NULL));
            chai_1.assert.isNotTrue(account.stateRoot.equals(Buffer.from([])));
        });
    });
    describe("accountIsEmpty", () => {
        it("returns true for empty accounts", async () => {
            const address = (0, random_1.randomAddress)();
            const result = await fsm.accountIsEmpty(address);
            chai_1.assert.isTrue(result);
        });
        it("returns false for accounts with non-zero nonce", async () => {
            const address = (0, random_1.randomAddress)();
            await fsm.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ nonce: new ethereumjs_util_1.BN(123) }));
            const result = await fsm.accountIsEmpty(address);
            chai_1.assert.isFalse(result);
        });
        it("returns false for accounts with non-zero balance", async () => {
            const address = (0, random_1.randomAddress)();
            await fsm.putAccount(address, ethereumjs_util_1.Account.fromAccountData({ nonce: new ethereumjs_util_1.BN(123) }));
            const result = await fsm.accountIsEmpty(address);
            chai_1.assert.isFalse(result);
        });
        it("returns false for accounts with non-empty code", async () => {
            const address = (0, random_1.randomAddress)();
            await fsm.putContractCode(address, (0, ethereumjs_util_1.toBuffer)("0xfafadada"));
            const result = await fsm.accountIsEmpty(address);
            chai_1.assert.isFalse(result);
        });
    });
    describe("getContractCode", () => {
        it("can get contract code", async () => {
            const { code } = await client.getAccountData(constants_1.DAI_ADDRESS, forkBlockNumber);
            const fsmCode = await fsm.getContractCode(constants_1.DAI_ADDRESS);
            chai_1.assert.isTrue(fsmCode.equals(code));
        });
        it("can get code of an account modified locally", async () => {
            await fsm.putContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, (0, ethereumjs_util_1.toBuffer)([69, 4, 20]));
            const { code } = await client.getAccountData(constants_1.DAI_ADDRESS, forkBlockNumber);
            const fsmCode = await fsm.getContractCode(constants_1.DAI_ADDRESS);
            chai_1.assert.isTrue(fsmCode.equals(code));
        });
    });
    describe("putContractCode", () => {
        it("can override contract code", async () => {
            const code = (0, ethereumjs_util_1.toBuffer)("0xdeadbeef");
            await fsm.putContractCode(constants_1.DAI_ADDRESS, code);
            const fsmCode = await fsm.getContractCode(constants_1.DAI_ADDRESS);
            chai_1.assert.isTrue(fsmCode.equals(code));
        });
        it("can set code of an existing account", async () => {
            const address = (0, random_1.randomAddress)();
            const toPut = ethereumjs_util_1.Account.fromAccountData({
                nonce: new ethereumjs_util_1.BN(69),
                balance: new ethereumjs_util_1.BN(420),
            });
            await fsm.putAccount(address, toPut);
            const code = (0, ethereumjs_util_1.toBuffer)("0xfeedface");
            await fsm.putContractCode(address, code);
            const fsmCode = await fsm.getContractCode(address);
            chai_1.assert.isTrue(fsmCode.equals(code));
        });
    });
    describe("getContractStorage", () => {
        it("can get contract storage value", async () => {
            const remoteValue = await client.getStorageAt(constants_1.DAI_ADDRESS, new ethereumjs_util_1.BN(constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION), forkBlockNumber);
            const fsmValue = await fsm.getContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
            chai_1.assert.isTrue(fsmValue.equals((0, ethereumjs_util_1.unpadBuffer)(remoteValue)));
        });
    });
    describe("getOriginalContractStorage", () => {
        it("can get contract storage value", async () => {
            const remoteValue = await client.getStorageAt(constants_1.DAI_ADDRESS, new ethereumjs_util_1.BN(constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION), forkBlockNumber);
            const fsmValue = await fsm.getOriginalContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
            chai_1.assert.isTrue(fsmValue.equals((0, ethereumjs_util_1.unpadBuffer)(remoteValue)));
        });
        it("caches original storage value on first call and returns it for subsequent calls", async () => {
            const newValue = (0, ethereumjs_util_1.toBuffer)("0xdeadbeef");
            const originalValue = await fsm.getOriginalContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
            chai_1.assert.isNotTrue(originalValue.equals(newValue));
            await fsm.putContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, newValue);
            const cachedValue = await fsm.getOriginalContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
            chai_1.assert.isTrue(cachedValue.equals(originalValue));
        });
        it("retains original storage value after setStateRoot call", async () => {
            const newValue = (0, ethereumjs_util_1.toBuffer)("0xdeadbeef");
            const stateRoot = await fsm.getStateRoot();
            const originalValue = await fsm.getOriginalContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
            await fsm.putContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, newValue);
            await fsm.setStateRoot(stateRoot);
            await fsm.putContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, newValue);
            const cachedValue = await fsm.getOriginalContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
            chai_1.assert.isTrue(cachedValue.equals(originalValue));
        });
    });
    describe("putContractStorage", () => {
        it("can override storage value", async () => {
            const value = (0, ethereumjs_util_1.toBuffer)("0xfeedface");
            await fsm.putContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, value);
            const fsmValue = await fsm.getContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
            chai_1.assert.isTrue(fsmValue.equals(value));
        });
        it("can set storage value of an existing account", async () => {
            const address = (0, random_1.randomAddress)();
            const toPut = ethereumjs_util_1.Account.fromAccountData({
                nonce: new ethereumjs_util_1.BN(69),
                balance: new ethereumjs_util_1.BN(420),
            });
            await fsm.putAccount(address, toPut);
            const value = (0, ethereumjs_util_1.toBuffer)("0xfeedface");
            await fsm.putContractStorage(address, (0, ethereumjs_util_1.toBuffer)(`0x${"0".repeat(63)}1`), value);
            const fsmValue = await fsm.getContractStorage(address, (0, ethereumjs_util_1.toBuffer)(`0x${"0".repeat(63)}1`));
            chai_1.assert.isTrue(fsmValue.equals(value));
        });
    });
    /* eslint-disable  dot-notation,@typescript-eslint/dot-notation */
    describe("checkpoint", () => {
        it("stores current state root on the stack", async () => {
            const stateRoot = await fsm.getStateRoot();
            await fsm.checkpoint();
            chai_1.assert.deepEqual(fsm["_stateCheckpoints"], [(0, ethereumjs_util_1.bufferToHex)(stateRoot)]);
        });
        it("allows to checkpoint the same state root twice", async () => {
            const stateRoot = await fsm.getStateRoot();
            await fsm.checkpoint();
            await fsm.checkpoint();
            chai_1.assert.deepEqual(fsm["_stateCheckpoints"], [
                (0, ethereumjs_util_1.bufferToHex)(stateRoot),
                (0, ethereumjs_util_1.bufferToHex)(stateRoot),
            ]);
        });
        it("allows to checkpoint different state roots", async () => {
            const stateRootOne = await fsm.getStateRoot();
            await fsm.checkpoint();
            await fsm.putContractCode((0, random_1.randomAddress)(), (0, ethereumjs_util_1.toBuffer)("0xdeadbeef"));
            const stateRootTwo = await fsm.getStateRoot();
            await fsm.checkpoint();
            chai_1.assert.deepEqual(fsm["_stateCheckpoints"], [
                (0, ethereumjs_util_1.bufferToHex)(stateRootOne),
                (0, ethereumjs_util_1.bufferToHex)(stateRootTwo),
            ]);
        });
    });
    describe("commit", () => {
        it("rejects if no checkpoint was made", async () => {
            await chai_1.assert.isRejected(fsm.commit(), Error, "commit called when not checkpointed");
        });
        it("does not change current state root", async () => {
            await fsm.checkpoint();
            await fsm.putContractCode((0, random_1.randomAddress)(), (0, ethereumjs_util_1.toBuffer)("0xdeadbeef"));
            const beforeRoot = await fsm.getStateRoot();
            await fsm.commit();
            const afterRoot = await fsm.getStateRoot();
            chai_1.assert.isTrue(afterRoot.equals(beforeRoot));
        });
        it("removes the latest state root from the stack", async () => {
            const stateRoot = await fsm.getStateRoot();
            await fsm.checkpoint();
            await fsm.checkpoint();
            await fsm.commit();
            chai_1.assert.deepEqual(fsm["_stateCheckpoints"], [(0, ethereumjs_util_1.bufferToHex)(stateRoot)]);
        });
    });
    describe("revert", () => {
        it("rejects if no checkpoint was made", async () => {
            await chai_1.assert.isRejected(fsm.revert(), Error, "revert called when not checkpointed");
        });
        it("reverts the current state root back to the committed state", async () => {
            const initialRoot = await fsm.getStateRoot();
            await fsm.checkpoint();
            await fsm.putContractCode((0, random_1.randomAddress)(), (0, ethereumjs_util_1.toBuffer)("0xdeadbeef"));
            await fsm.revert();
            const stateRoot = await fsm.getStateRoot();
            chai_1.assert.isTrue(stateRoot.equals(initialRoot));
        });
        it("does not revert more than one checkpoint back", async () => {
            const address = (0, random_1.randomAddress)();
            await fsm.checkpoint();
            await fsm.putContractCode(address, (0, ethereumjs_util_1.toBuffer)("0xdeadbeef"));
            await fsm.checkpoint();
            await fsm.putContractCode(address, (0, ethereumjs_util_1.toBuffer)("0xfeedface"));
            await fsm.revert();
            const code = await fsm.getContractCode(address);
            chai_1.assert.isTrue(code.equals((0, ethereumjs_util_1.toBuffer)("0xdeadbeef")));
        });
        it("removes the latest state root from the stack", async () => {
            const stateRoot = await fsm.getStateRoot();
            await fsm.checkpoint();
            await fsm.checkpoint();
            await fsm.revert();
            chai_1.assert.deepEqual(fsm["_stateCheckpoints"], [(0, ethereumjs_util_1.bufferToHex)(stateRoot)]);
        });
    });
    /* eslint-enable  dot-notation,@typescript-eslint/dot-notation */
    describe("clearContractStorage", () => {
        it("can clear all locally set values", async () => {
            const value = (0, ethereumjs_util_1.toBuffer)("0xfeedface");
            const address = (0, random_1.randomAddress)();
            const position = (0, ethereumjs_util_1.toBuffer)(`0x${"0".repeat(63)}2`);
            await fsm.putContractStorage(address, position, value);
            await fsm.clearContractStorage(address);
            const clearedValue = await fsm.getContractStorage(address, position);
            chai_1.assert.lengthOf(clearedValue, 0);
        });
        it("can clear all remote values", async () => {
            const value = await fsm.getContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
            chai_1.assert.isNotTrue(value.equals(constants_1.NULL_BYTES_32));
            await fsm.clearContractStorage(constants_1.DAI_ADDRESS);
            const clearedValue = await fsm.getContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
            chai_1.assert.lengthOf(clearedValue, 0);
        });
        it("can clear remote values not previously read", async () => {
            await fsm.clearContractStorage(constants_1.DAI_ADDRESS);
            const clearedValue = await fsm.getContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
            chai_1.assert.lengthOf(clearedValue, 0);
        });
    });
    describe("getStateRoot", () => {
        it("returns current state root", async () => {
            const root = await fsm.getStateRoot();
            chai_1.assert.isNotTrue(root.equals((0, ethereumjs_util_1.toBuffer)([])));
        });
        it("returns the same state root if no storage was modified", async () => {
            const root1 = await fsm.getStateRoot();
            const root2 = await fsm.getStateRoot();
            chai_1.assert.isTrue(root1.equals(root2));
        });
        it("returns a different state root after storage modification", async () => {
            const root1 = await fsm.getStateRoot();
            await fsm.putContractCode((0, random_1.randomAddress)(), (0, ethereumjs_util_1.toBuffer)("0xdeadbeef"));
            const root2 = await fsm.getStateRoot();
            chai_1.assert.isNotTrue(root1.equals(root2));
        });
    });
    describe("setStateRoot", () => {
        it("throws an error when an unknown state root is passed", async () => {
            await chai_1.assert.isRejected(fsm.setStateRoot((0, random_1.randomHashBuffer)()), Error, "Unknown state root");
        });
        it("allows to change current state root", async () => {
            const beforeRoot = await fsm.getStateRoot();
            await fsm.putContractCode((0, random_1.randomAddress)(), (0, ethereumjs_util_1.toBuffer)("0xdeadbeef"));
            const afterRoot = await fsm.getStateRoot();
            await fsm.setStateRoot(beforeRoot);
            const restoredRoot = await fsm.getStateRoot();
            chai_1.assert.isTrue(restoredRoot.equals(beforeRoot));
            chai_1.assert.isNotTrue(afterRoot.equals(beforeRoot));
        });
        it("allows to change the state", async () => {
            const beforeRoot = await fsm.getStateRoot();
            const address = (0, random_1.randomAddress)();
            chai_1.assert.isTrue((await fsm.getContractCode(address)).equals((0, ethereumjs_util_1.toBuffer)([])));
            await fsm.putContractCode(address, (0, ethereumjs_util_1.toBuffer)("0xdeadbeef"));
            chai_1.assert.isTrue((await fsm.getContractCode(address)).equals((0, ethereumjs_util_1.toBuffer)("0xdeadbeef")));
            await fsm.setStateRoot(beforeRoot);
            chai_1.assert.isTrue((await fsm.getContractCode(address)).equals((0, ethereumjs_util_1.toBuffer)([])));
        });
    });
    describe("dumpStorage", () => {
        it("throws not supported error", async () => {
            await chai_1.assert.isRejected(fsm.dumpStorage((0, random_1.randomAddress)()), Error, "dumpStorage is not supported when forking from remote network");
        });
    });
    describe("hasGenesisState", () => {
        it("throws not supported error", async () => {
            await chai_1.assert.isRejected(fsm.hasGenesisState(), Error, "hasGenesisState is not supported when forking from remote network");
        });
    });
    describe("generateCanonicalGenesis", () => {
        it("throws not supported error", async () => {
            await chai_1.assert.isRejected(fsm.generateCanonicalGenesis(), Error, "generateCanonicalGenesis is not supported when forking from remote network");
        });
    });
    describe("generateGenesis", () => {
        it("throws not supported error", async () => {
            await chai_1.assert.isRejected(fsm.generateGenesis(null), Error, "generateGenesis is not supported when forking from remote network");
        });
    });
    describe("_clearOriginalStorageCache", () => {
        it("makes the subsequent call to getOriginalContractStorage return a fresh value", async () => {
            const newValue = (0, ethereumjs_util_1.toBuffer)("0xdeadbeef");
            const originalValue = await fsm.getOriginalContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
            chai_1.assert.isNotTrue(originalValue.equals(newValue));
            // Important: putContractStorage is implemented without position length checks in
            // FSM, whereas getOriginalContractStorage uses underlying StateManager (which checks).
            // These need to be brought into sync...
            await fsm.putContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, newValue);
            fsm.clearOriginalStorageCache();
            const freshValue = await fsm.getOriginalContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
            chai_1.assert.isTrue(freshValue.equals(newValue));
        });
    });
    describe("touchAccount", () => {
        it("does not throw an error", () => {
            fsm.touchAccount((0, random_1.randomAddress)());
        });
    });
    describe("cleanupTouchedAccounts", () => {
        it("does not throw an error", async () => {
            await fsm.cleanupTouchedAccounts();
        });
    });
    describe("setBlockContext", () => {
        it("throws an error if invoked during checkpoint", async () => {
            await fsm.checkpoint();
            chai_1.assert.throws(() => fsm.setBlockContext((0, random_1.randomHashBuffer)(), new ethereumjs_util_1.BN(0)), Error, "setBlockContext called when checkpointed");
        });
        describe("when blockNumber is smaller or equal to forkBlockNumber", () => {
            it("clears the state and changes the block context in which methods operate", async () => {
                const oldBlock = forkBlockNumber.subn(10);
                const valueAtOldBlock = await client.getStorageAt(constants_1.DAI_ADDRESS, new ethereumjs_util_1.BN(constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION), oldBlock);
                await fsm.putContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, (0, ethereumjs_util_1.toBuffer)("0xdeadbeef"));
                fsm.setBlockContext((0, random_1.randomHashBuffer)(), oldBlock);
                const fsmValue = await fsm.getContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
                chai_1.assert.equal((0, ethereumjs_util_1.bufferToHex)(fsmValue), (0, ethereumjs_util_1.bufferToHex)((0, ethereumjs_util_1.unpadBuffer)(valueAtOldBlock)));
            });
            it("sets the state root", async () => {
                const newStateRoot = (0, random_1.randomHashBuffer)();
                fsm.setBlockContext(newStateRoot, forkBlockNumber.subn(10));
                chai_1.assert.equal((0, ethereumjs_util_1.bufferToHex)(await fsm.getStateRoot()), (0, ethereumjs_util_1.bufferToHex)(newStateRoot));
            });
        });
        describe("when blockNumber is greater than forkBlockNumber", () => {
            it("sets the state root", async () => {
                await fsm.putContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, (0, ethereumjs_util_1.toBuffer)("0xdeadbeef"));
                const blockOneStateRoot = await fsm.getStateRoot();
                await fsm.putContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, (0, ethereumjs_util_1.toBuffer)("0xfeedface"));
                fsm.setBlockContext(blockOneStateRoot, forkBlockNumber.addn(1));
                const fsmValue = await fsm.getContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
                chai_1.assert.equal((0, ethereumjs_util_1.bufferToHex)(fsmValue), "0xdeadbeef");
            });
        });
    });
    describe("restoreForkBlockContext", () => {
        it("throws an error if there is uncommitted state", async () => {
            const stateRoot = await fsm.getStateRoot();
            fsm.setBlockContext((0, random_1.randomHashBuffer)(), forkBlockNumber.subn(10));
            await fsm.checkpoint();
            chai_1.assert.throws(() => fsm.restoreForkBlockContext(stateRoot), Error, "restoreForkBlockContext called when checkpointed");
        });
        describe("when the block context has been changed", () => {
            it("restores the fork block context in which methods operate", async () => {
                const valueAtForkBlock = await client.getStorageAt(constants_1.DAI_ADDRESS, new ethereumjs_util_1.BN(constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION), forkBlockNumber);
                const getStorageAt = sinon_1.default.spy(client, "getStorageAt");
                const stateRoot = await fsm.getStateRoot();
                fsm.setBlockContext((0, random_1.randomHashBuffer)(), forkBlockNumber.subn(10));
                fsm.restoreForkBlockContext(stateRoot);
                const fsmValue = await fsm.getContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
                chai_1.assert.equal((0, ethereumjs_util_1.bufferToHex)(fsmValue), (0, ethereumjs_util_1.bufferToHex)((0, ethereumjs_util_1.unpadBuffer)(valueAtForkBlock)));
                chai_1.assert.isTrue(getStorageAt.calledOnce);
                chai_1.assert.equal(getStorageAt.firstCall.lastArg.toString(), forkBlockNumber.toString());
                getStorageAt.restore();
            });
            it("sets the state root", async () => {
                await fsm.putContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, (0, ethereumjs_util_1.toBuffer)("0xdeadbeef"));
                const stateRoot = await fsm.getStateRoot();
                fsm.setBlockContext((0, random_1.randomHashBuffer)(), forkBlockNumber.subn(10));
                await fsm.putContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, (0, ethereumjs_util_1.toBuffer)("0xfeedface"));
                fsm.restoreForkBlockContext(stateRoot);
                const fsmValue = await fsm.getContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
                chai_1.assert.equal((0, ethereumjs_util_1.bufferToHex)(fsmValue), "0xdeadbeef");
            });
        });
        describe("when the block context has not been changed", () => {
            it("sets the state root", async () => {
                await fsm.putContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, (0, ethereumjs_util_1.toBuffer)("0xdeadbeef"));
                const blockOneStateRoot = await fsm.getStateRoot();
                await fsm.putContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, (0, ethereumjs_util_1.toBuffer)("0xfeedface"));
                const blockTwoStateRoot = await fsm.getStateRoot();
                fsm.setBlockContext(blockOneStateRoot, forkBlockNumber.addn(1));
                fsm.restoreForkBlockContext(blockTwoStateRoot);
                const fsmValue = await fsm.getContractStorage(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION);
                chai_1.assert.equal((0, ethereumjs_util_1.bufferToHex)(fsmValue), "0xfeedface");
            });
        });
    });
});
//# sourceMappingURL=ForkStateManager.js.map