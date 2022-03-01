"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const web3_1 = __importDefault(require("web3"));
const pweb3_1 = require("../src/pweb3");
const CONTRACT_BYTECODE = "6080604052348015600f57600080fd5b50609b8061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80635a44b650146037578063e730f60b146053575b600080fd5b603d605b565b6040518082815260200191505060405180910390f35b60596064565b005b60006001905090565b56fea265627a7a7230582075918bec172b335d3087851edc0735dd08bf398d38b6680f77bd9d9765d02be464736f6c634300050a0032";
const ABI = [
    {
        constant: true,
        inputs: [],
        name: "constantFunction",
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
        payable: false,
        stateMutability: "pure",
        type: "function",
    },
    {
        constant: false,
        inputs: [],
        name: "nonConstantFunction",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
];
describe("pweb3", () => {
    let web3;
    let pweb3;
    beforeEach("Initialize web3 and pweb3", () => {
        const provider = new web3_1.default.providers.HttpProvider("http://localhost:8545");
        web3 = new web3_1.default(provider);
        pweb3 = (0, pweb3_1.promisifyWeb3)(web3);
    });
    it("Should throw if a synch call is made", () => {
        chai_1.assert.throws(() => pweb3.eth.accounts, "pweb3 doesn't support synchronous calls.");
    });
    it("Should promisify contracts", async () => {
        const accounts = await pweb3.eth.getAccounts();
        const TestContract = pweb3.eth.contract(ABI);
        const test = await TestContract.new({
            data: `0x${CONTRACT_BYTECODE}`,
            from: accounts[0],
            gas: 456789,
        });
        await test.nonConstantFunction({ from: accounts[0] });
        chai_1.assert.equal(await test.constantFunction(), 1);
    });
    it("Should give the same result as calling web3 but promisified", (done) => {
        web3.eth.getAccounts((error, expectedAccounts) => {
            const promise = pweb3.eth.getAccounts();
            chai_1.assert.instanceOf(promise, Promise);
            promise
                .then((actualAccounts) => chai_1.assert.deepEqual(actualAccounts, expectedAccounts), (_pweb3Error) => chai_1.assert.instanceOf(error, Error))
                .then(done);
        });
    });
});
//# sourceMappingURL=pweb3.js.map