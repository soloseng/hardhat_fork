"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethers_1 = require("ethers");
const plugins_1 = require("hardhat/plugins");
const util_1 = __importDefault(require("util"));
const helpers_1 = require("./helpers");
describe("Ethers plugin", function () {
    describe("ganache", function () {
        (0, helpers_1.useEnvironment)("hardhat-project");
        describe("HRE extensions", function () {
            it("should extend hardhat runtime environment", function () {
                chai_1.assert.isDefined(this.env.ethers);
                chai_1.assert.containsAllKeys(this.env.ethers, [
                    "provider",
                    "getSigners",
                    "getContractFactory",
                    "getContractAt",
                    ...Object.keys(ethers_1.ethers),
                ]);
            });
            describe("Custom formatters", function () {
                const assertBigNumberFormat = function (BigNumber, value, expected) {
                    chai_1.assert.equal(util_1.default.format("%o", BigNumber.from(value)), expected);
                };
                describe("BigNumber", function () {
                    it("should format zero unaltered", function () {
                        assertBigNumberFormat(this.env.ethers.BigNumber, 0, 'BigNumber { value: "0" }');
                    });
                    it("should provide human readable versions of positive integers", function () {
                        const BigNumber = this.env.ethers.BigNumber;
                        assertBigNumberFormat(BigNumber, 1, 'BigNumber { value: "1" }');
                        assertBigNumberFormat(BigNumber, 999, 'BigNumber { value: "999" }');
                        assertBigNumberFormat(BigNumber, 1000, 'BigNumber { value: "1000" }');
                        assertBigNumberFormat(BigNumber, 999999, 'BigNumber { value: "999999" }');
                        assertBigNumberFormat(BigNumber, 1000000, 'BigNumber { value: "1000000" }');
                        assertBigNumberFormat(BigNumber, "999999999999999999292", 'BigNumber { value: "999999999999999999292" }');
                    });
                    it("should provide human readable versions of negative integers", function () {
                        const BigNumber = this.env.ethers.BigNumber;
                        assertBigNumberFormat(BigNumber, -1, 'BigNumber { value: "-1" }');
                        assertBigNumberFormat(BigNumber, -999, 'BigNumber { value: "-999" }');
                        assertBigNumberFormat(BigNumber, -1000, 'BigNumber { value: "-1000" }');
                        assertBigNumberFormat(BigNumber, -999999, 'BigNumber { value: "-999999" }');
                        assertBigNumberFormat(BigNumber, -1000000, 'BigNumber { value: "-1000000" }');
                        assertBigNumberFormat(BigNumber, "-999999999999999999292", 'BigNumber { value: "-999999999999999999292" }');
                    });
                });
            });
        });
        describe("Provider", function () {
            it("the provider should handle requests", async function () {
                const accounts = await this.env.ethers.provider.send("eth_accounts", []);
                chai_1.assert.equal(accounts[0], "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1");
            });
        });
        describe("Signers and contracts helpers", function () {
            let signers;
            let greeterArtifact;
            let iGreeterArtifact;
            beforeEach(async function () {
                signers = await this.env.ethers.getSigners();
                await this.env.run("compile", { quiet: true });
                greeterArtifact = await this.env.artifacts.readArtifact("Greeter");
                iGreeterArtifact = await this.env.artifacts.readArtifact("IGreeter");
            });
            describe("getSigners", function () {
                it("should return the signers", async function () {
                    const sigs = await this.env.ethers.getSigners();
                    chai_1.assert.equal(await sigs[0].getAddress(), "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1");
                });
                it("should expose the address synchronously", async function () {
                    const sigs = await this.env.ethers.getSigners();
                    chai_1.assert.equal(sigs[0].address, "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1");
                });
            });
            describe("signer", function () {
                it("should sign a message", async function () {
                    const [sig] = await this.env.ethers.getSigners();
                    const result = await sig.signMessage("hello");
                    chai_1.assert.equal(result, "0x1845faa75f53acb0c3e7247dcf294ce045c139722418dc9638709b54bafffa093591aeaaa195e7dc53f7e774c80e9a7f1371f0647a100d1c9e81db83d8ddd47801");
                });
                it("should throw when sign a transaction", async function () {
                    const [sig] = await this.env.ethers.getSigners();
                    const Greeter = await this.env.ethers.getContractFactory("Greeter");
                    const tx = Greeter.getDeployTransaction();
                    chai_1.assert.throws(() => sig.signTransaction(tx));
                });
                it("should return the balance of the account", async function () {
                    const [sig] = await this.env.ethers.getSigners();
                    chai_1.assert.equal((await sig.getBalance()).toString(), "100000000000000000000");
                });
                it("should return the transaction count of the account", async function () {
                    const [sig] = await this.env.ethers.getSigners();
                    chai_1.assert.equal((await sig.getTransactionCount()).toString(), "0");
                });
                it("should allow to use the estimateGas method", async function () {
                    const [sig] = await this.env.ethers.getSigners();
                    const Greeter = await this.env.ethers.getContractFactory("Greeter");
                    const tx = Greeter.getDeployTransaction();
                    const result = await sig.estimateGas(tx);
                    chai_1.assert.isTrue(result.gt(0));
                });
                it("should allow to use the call method", async function () {
                    const [sig] = await this.env.ethers.getSigners();
                    const Greeter = await this.env.ethers.getContractFactory("Greeter");
                    const tx = Greeter.getDeployTransaction();
                    const result = await sig.call(tx);
                    chai_1.assert.isString(result);
                });
                it("should send a transaction", async function () {
                    const [sig] = await this.env.ethers.getSigners();
                    const Greeter = await this.env.ethers.getContractFactory("Greeter");
                    const tx = Greeter.getDeployTransaction();
                    const response = await sig.sendTransaction(tx);
                    const receipt = await response.wait();
                    chai_1.assert.equal(receipt.status, 1);
                });
                it("should get the chainId", async function () {
                    const [sig] = await this.env.ethers.getSigners();
                    const chainId = await sig.getChainId();
                    chai_1.assert.equal(chainId, 1337);
                });
                it("should get the gas price", async function () {
                    const [sig] = await this.env.ethers.getSigners();
                    const gasPrice = await sig.getGasPrice();
                    chai_1.assert.equal(gasPrice.toString(), "20000000000");
                });
                it("should check and populate a transaction", async function () {
                    const [sig] = await this.env.ethers.getSigners();
                    const Greeter = await this.env.ethers.getContractFactory("Greeter");
                    const tx = Greeter.getDeployTransaction();
                    const checkedTransaction = sig.checkTransaction(tx);
                    chai_1.assert.equal(await checkedTransaction.from, sig.address);
                    const populatedTransaction = await sig.populateTransaction(checkedTransaction);
                    chai_1.assert.equal(populatedTransaction.from, sig.address);
                });
            });
            describe("getContractFactory", function () {
                describe("By name", function () {
                    it("should return a contract factory", async function () {
                        // It's already compiled in artifacts/
                        const contract = await this.env.ethers.getContractFactory("Greeter");
                        chai_1.assert.containsAllKeys(contract.interface.functions, [
                            "setGreeting(string)",
                            "greet()",
                        ]);
                        chai_1.assert.equal(await contract.signer.getAddress(), await signers[0].getAddress());
                    });
                    it("should fail to return a contract factory for an interface", async function () {
                        try {
                            await this.env.ethers.getContractFactory("IGreeter");
                        }
                        catch (reason) {
                            chai_1.assert.instanceOf(reason, plugins_1.NomicLabsHardhatPluginError, "getContractFactory should fail with a hardhat plugin error");
                            chai_1.assert.isTrue(reason.message.includes("is abstract and can't be deployed"), "getContractFactory should report the abstract contract as the cause");
                            return;
                        }
                        // The test shouldn't reach this point.
                        chai_1.assert.fail("getContractFactory should fail with an abstract contract");
                    });
                    it("should link a library", async function () {
                        const libraryFactory = await this.env.ethers.getContractFactory("TestLibrary");
                        const library = await libraryFactory.deploy();
                        const contractFactory = await this.env.ethers.getContractFactory("TestContractLib", { libraries: { TestLibrary: library.address } });
                        chai_1.assert.equal(await contractFactory.signer.getAddress(), await signers[0].getAddress());
                        const numberPrinter = await contractFactory.deploy();
                        const someNumber = 50;
                        chai_1.assert.equal(await numberPrinter.callStatic.printNumber(someNumber), someNumber * 2);
                    });
                    it("should fail to link when passing in an ambiguous library link", async function () {
                        const libraryFactory = await this.env.ethers.getContractFactory("contracts/TestContractLib.sol:TestLibrary");
                        const library = await libraryFactory.deploy();
                        try {
                            await this.env.ethers.getContractFactory("TestContractLib", {
                                libraries: {
                                    TestLibrary: library.address,
                                    "contracts/TestContractLib.sol:TestLibrary": library.address,
                                },
                            });
                        }
                        catch (reason) {
                            chai_1.assert.instanceOf(reason, plugins_1.NomicLabsHardhatPluginError, "getContractFactory should fail with a hardhat plugin error");
                            chai_1.assert.isTrue(reason.message.includes("refer to the same library and were given as two separate library links"), "getContractFactory should report the ambiguous link as the cause");
                            chai_1.assert.isTrue(reason.message.includes("TestLibrary and contracts/TestContractLib.sol:TestLibrary"), "getContractFactory should display the ambiguous library links");
                            return;
                        }
                        // The test shouldn't reach this point
                        chai_1.assert.fail("getContractFactory should fail when the link for one library is ambiguous");
                    });
                    it("should link a library even if there's an identically named library in the project", async function () {
                        const libraryFactory = await this.env.ethers.getContractFactory("contracts/TestNonUniqueLib.sol:NonUniqueLibrary");
                        const library = await libraryFactory.deploy();
                        const contractFactory = await this.env.ethers.getContractFactory("TestNonUniqueLib", { libraries: { NonUniqueLibrary: library.address } });
                        chai_1.assert.equal(await contractFactory.signer.getAddress(), await signers[0].getAddress());
                    });
                    it("should fail to link an ambiguous library", async function () {
                        const libraryFactory = await this.env.ethers.getContractFactory("contracts/AmbiguousLibrary.sol:AmbiguousLibrary");
                        const library = await libraryFactory.deploy();
                        const library2Factory = await this.env.ethers.getContractFactory("contracts/AmbiguousLibrary2.sol:AmbiguousLibrary");
                        const library2 = await library2Factory.deploy();
                        try {
                            await this.env.ethers.getContractFactory("TestAmbiguousLib", {
                                libraries: {
                                    AmbiguousLibrary: library.address,
                                    "contracts/AmbiguousLibrary2.sol:AmbiguousLibrary": library2.address,
                                },
                            });
                        }
                        catch (reason) {
                            chai_1.assert.instanceOf(reason, plugins_1.NomicLabsHardhatPluginError, "getContractFactory should fail with a hardhat plugin error");
                            chai_1.assert.isTrue(reason.message.includes("is ambiguous for the contract"), "getContractFactory should report the ambiguous name resolution as the cause");
                            chai_1.assert.isTrue(reason.message.includes("AmbiguousLibrary.sol:AmbiguousLibrary") &&
                                reason.message.includes("AmbiguousLibrary2.sol:AmbiguousLibrary"), "getContractFactory should enumerate both available library name candidates");
                            return;
                        }
                        // The test shouldn't reach this point
                        chai_1.assert.fail("getContractFactory should fail to retrieve an ambiguous library name");
                    });
                    it("should fail to create a contract factory with missing libraries", async function () {
                        try {
                            await this.env.ethers.getContractFactory("TestContractLib");
                        }
                        catch (reason) {
                            chai_1.assert.instanceOf(reason, plugins_1.NomicLabsHardhatPluginError, "getContractFactory should fail with a hardhat plugin error");
                            chai_1.assert.isTrue(reason.message.includes("missing links for the following libraries"), "getContractFactory should report the missing libraries as the cause");
                            chai_1.assert.isTrue(reason.message.includes("TestContractLib.sol:TestLibrary"), "getContractFactory should enumerate missing library names");
                            return;
                        }
                        // The test shouldn't reach this point
                        chai_1.assert.fail("getContractFactory should fail to create a contract factory if there are missing libraries");
                    });
                    it("should fail to create a contract factory with an invalid address", async function () {
                        const notAnAddress = "definitely not an address";
                        try {
                            await this.env.ethers.getContractFactory("TestContractLib", {
                                libraries: { TestLibrary: notAnAddress },
                            });
                        }
                        catch (reason) {
                            chai_1.assert.instanceOf(reason, plugins_1.NomicLabsHardhatPluginError, "getContractFactory should fail with a hardhat plugin error");
                            chai_1.assert.isTrue(reason.message.includes("invalid address"), "getContractFactory should report the invalid address as the cause");
                            chai_1.assert.isTrue(reason.message.includes(notAnAddress), "getContractFactory should display the invalid address");
                            return;
                        }
                        // The test shouldn't reach this point
                        chai_1.assert.fail("getContractFactory should fail to create a contract factory if there is an invalid address");
                    });
                    it("should fail to create a contract factory when incorrectly linking a library with an ethers.Contract", async function () {
                        const libraryFactory = await this.env.ethers.getContractFactory("TestLibrary");
                        const library = await libraryFactory.deploy();
                        try {
                            await this.env.ethers.getContractFactory("TestContractLib", {
                                libraries: { TestLibrary: library },
                            });
                        }
                        catch (reason) {
                            chai_1.assert.instanceOf(reason, plugins_1.NomicLabsHardhatPluginError, "getContractFactory should fail with a hardhat plugin error");
                            chai_1.assert.isTrue(reason.message.includes("invalid address", "getContractFactory should report the invalid address as the cause"));
                            // This assert is here just to make sure we don't end up printing an enormous object
                            // in the error message. This may happen if the argument received is particularly complex.
                            chai_1.assert.isTrue(reason.message.length <= 400, "getContractFactory should fail with an error message that isn't too large");
                            return;
                        }
                        chai_1.assert.fail("getContractFactory should fail to create a contract factory if there is an invalid address");
                    });
                    it("Should be able to send txs and make calls", async function () {
                        const Greeter = await this.env.ethers.getContractFactory("Greeter");
                        const greeter = await Greeter.deploy();
                        chai_1.assert.equal(await greeter.functions.greet(), "Hi");
                        await greeter.functions.setGreeting("Hola");
                        chai_1.assert.equal(await greeter.functions.greet(), "Hola");
                    });
                    describe("with custom signer", function () {
                        it("should return a contract factory connected to the custom signer", async function () {
                            // It's already compiled in artifacts/
                            const contract = await this.env.ethers.getContractFactory("Greeter", signers[1]);
                            chai_1.assert.containsAllKeys(contract.interface.functions, [
                                "setGreeting(string)",
                                "greet()",
                            ]);
                            chai_1.assert.equal(await contract.signer.getAddress(), await signers[1].getAddress());
                        });
                    });
                });
                describe("by abi and bytecode", function () {
                    it("should return a contract factory", async function () {
                        // It's already compiled in artifacts/
                        const contract = await this.env.ethers.getContractFactory(greeterArtifact.abi, greeterArtifact.bytecode);
                        chai_1.assert.containsAllKeys(contract.interface.functions, [
                            "setGreeting(string)",
                            "greet()",
                        ]);
                        chai_1.assert.equal(await contract.signer.getAddress(), await signers[0].getAddress());
                    });
                    it("should return a contract factory for an interface", async function () {
                        const contract = await this.env.ethers.getContractFactory(iGreeterArtifact.abi, iGreeterArtifact.bytecode);
                        chai_1.assert.equal(contract.bytecode, "0x");
                        chai_1.assert.containsAllKeys(contract.interface.functions, ["greet()"]);
                        chai_1.assert.equal(await contract.signer.getAddress(), await signers[0].getAddress());
                    });
                    it("Should be able to send txs and make calls", async function () {
                        const Greeter = await this.env.ethers.getContractFactory(greeterArtifact.abi, greeterArtifact.bytecode);
                        const greeter = await Greeter.deploy();
                        chai_1.assert.equal(await greeter.functions.greet(), "Hi");
                        await greeter.functions.setGreeting("Hola");
                        chai_1.assert.equal(await greeter.functions.greet(), "Hola");
                    });
                    describe("with custom signer", function () {
                        it("should return a contract factory connected to the custom signer", async function () {
                            // It's already compiled in artifacts/
                            const contract = await this.env.ethers.getContractFactory(greeterArtifact.abi, greeterArtifact.bytecode, signers[1]);
                            chai_1.assert.containsAllKeys(contract.interface.functions, [
                                "setGreeting(string)",
                                "greet()",
                            ]);
                            chai_1.assert.equal(await contract.signer.getAddress(), await signers[1].getAddress());
                        });
                    });
                });
            });
            describe("getContractFactoryFromArtifact", function () {
                it("should return a contract factory", async function () {
                    const contract = await this.env.ethers.getContractFactoryFromArtifact(greeterArtifact);
                    chai_1.assert.containsAllKeys(contract.interface.functions, [
                        "setGreeting(string)",
                        "greet()",
                    ]);
                    chai_1.assert.equal(await contract.signer.getAddress(), await signers[0].getAddress());
                });
                it("should link a library", async function () {
                    const libraryFactory = await this.env.ethers.getContractFactory("TestLibrary");
                    const library = await libraryFactory.deploy();
                    const testContractLibArtifact = await this.env.artifacts.readArtifact("TestContractLib");
                    const contractFactory = await this.env.ethers.getContractFactoryFromArtifact(testContractLibArtifact, { libraries: { TestLibrary: library.address } });
                    chai_1.assert.equal(await contractFactory.signer.getAddress(), await signers[0].getAddress());
                    const numberPrinter = await contractFactory.deploy();
                    const someNumber = 50;
                    chai_1.assert.equal(await numberPrinter.callStatic.printNumber(someNumber), someNumber * 2);
                });
                it("Should be able to send txs and make calls", async function () {
                    const Greeter = await this.env.ethers.getContractFactoryFromArtifact(greeterArtifact);
                    const greeter = await Greeter.deploy();
                    chai_1.assert.equal(await greeter.functions.greet(), "Hi");
                    await greeter.functions.setGreeting("Hola");
                    chai_1.assert.equal(await greeter.functions.greet(), "Hola");
                });
                describe("with custom signer", function () {
                    it("should return a contract factory connected to the custom signer", async function () {
                        const contract = await this.env.ethers.getContractFactoryFromArtifact(greeterArtifact, signers[1]);
                        chai_1.assert.containsAllKeys(contract.interface.functions, [
                            "setGreeting(string)",
                            "greet()",
                        ]);
                        chai_1.assert.equal(await contract.signer.getAddress(), await signers[1].getAddress());
                    });
                });
            });
            describe("getContractAt", function () {
                let deployedGreeter;
                beforeEach(async function () {
                    const Greeter = await this.env.ethers.getContractFactory("Greeter");
                    deployedGreeter = await Greeter.deploy();
                });
                describe("by name and address", function () {
                    it("Should return an instance of a contract", async function () {
                        const contract = await this.env.ethers.getContractAt("Greeter", deployedGreeter.address);
                        chai_1.assert.containsAllKeys(contract.functions, [
                            "setGreeting(string)",
                            "greet()",
                        ]);
                        chai_1.assert.equal(await contract.signer.getAddress(), await signers[0].getAddress());
                    });
                    it("Should return an instance of an interface", async function () {
                        const contract = await this.env.ethers.getContractAt("IGreeter", deployedGreeter.address);
                        chai_1.assert.containsAllKeys(contract.functions, ["greet()"]);
                        chai_1.assert.equal(await contract.signer.getAddress(), await signers[0].getAddress());
                    });
                    it("Should be able to send txs and make calls", async function () {
                        const greeter = await this.env.ethers.getContractAt("Greeter", deployedGreeter.address);
                        chai_1.assert.equal(await greeter.functions.greet(), "Hi");
                        await greeter.functions.setGreeting("Hola");
                        chai_1.assert.equal(await greeter.functions.greet(), "Hola");
                    });
                    describe("with custom signer", function () {
                        it("Should return an instance of a contract associated to a custom signer", async function () {
                            const contract = await this.env.ethers.getContractAt("Greeter", deployedGreeter.address, signers[1]);
                            chai_1.assert.equal(await contract.signer.getAddress(), await signers[1].getAddress());
                        });
                    });
                });
                describe("by abi and address", function () {
                    it("Should return an instance of a contract", async function () {
                        const contract = await this.env.ethers.getContractAt(greeterArtifact.abi, deployedGreeter.address);
                        chai_1.assert.containsAllKeys(contract.functions, [
                            "setGreeting(string)",
                            "greet()",
                        ]);
                        chai_1.assert.equal(await contract.signer.getAddress(), await signers[0].getAddress());
                    });
                    it("Should return an instance of an interface", async function () {
                        const contract = await this.env.ethers.getContractAt(iGreeterArtifact.abi, deployedGreeter.address);
                        chai_1.assert.containsAllKeys(contract.functions, ["greet()"]);
                        chai_1.assert.equal(await contract.signer.getAddress(), await signers[0].getAddress());
                    });
                    it("Should be able to send txs and make calls", async function () {
                        const greeter = await this.env.ethers.getContractAt(greeterArtifact.abi, deployedGreeter.address);
                        chai_1.assert.equal(await greeter.functions.greet(), "Hi");
                        await greeter.functions.setGreeting("Hola");
                        chai_1.assert.equal(await greeter.functions.greet(), "Hola");
                    });
                    it("Should be able to detect events", async function () {
                        const greeter = await this.env.ethers.getContractAt(greeterArtifact.abi, deployedGreeter.address);
                        // at the time of this writing, ethers' default polling interval is
                        // 4000 ms. here we turn it down in order to speed up this test.
                        // see also
                        // https://github.com/ethers-io/ethers.js/issues/615#issuecomment-848991047
                        const provider = greeter.provider;
                        provider.pollingInterval = 100;
                        let eventEmitted = false;
                        greeter.on("GreetingUpdated", () => {
                            eventEmitted = true;
                        });
                        await greeter.functions.setGreeting("Hola");
                        // wait for 1.5 polling intervals for the event to fire
                        await new Promise((resolve) => setTimeout(resolve, provider.pollingInterval * 2));
                        chai_1.assert.equal(eventEmitted, true);
                    });
                    describe("with custom signer", function () {
                        it("Should return an instance of a contract associated to a custom signer", async function () {
                            const contract = await this.env.ethers.getContractAt(greeterArtifact.abi, deployedGreeter.address, signers[1]);
                            chai_1.assert.equal(await contract.signer.getAddress(), await signers[1].getAddress());
                        });
                    });
                    it("should work with linked contracts", async function () {
                        const libraryFactory = await this.env.ethers.getContractFactory("TestLibrary");
                        const library = await libraryFactory.deploy();
                        const contractFactory = await this.env.ethers.getContractFactory("TestContractLib", { libraries: { TestLibrary: library.address } });
                        const numberPrinter = await contractFactory.deploy();
                        const numberPrinterAtAddress = await this.env.ethers.getContractAt("TestContractLib", numberPrinter.address);
                        const someNumber = 50;
                        chai_1.assert.equal(await numberPrinterAtAddress.callStatic.printNumber(someNumber), someNumber * 2);
                    });
                });
            });
            describe("getContractAtFromArtifact", function () {
                let deployedGreeter;
                beforeEach(async function () {
                    const Greeter = await this.env.ethers.getContractFactory("Greeter");
                    deployedGreeter = await Greeter.deploy();
                });
                describe("by artifact and address", function () {
                    it("Should return an instance of a contract", async function () {
                        const contract = await this.env.ethers.getContractAtFromArtifact(greeterArtifact, deployedGreeter.address);
                        chai_1.assert.containsAllKeys(contract.functions, [
                            "setGreeting(string)",
                            "greet()",
                        ]);
                        chai_1.assert.equal(await contract.signer.getAddress(), await signers[0].getAddress());
                    });
                    it("Should be able to send txs and make calls", async function () {
                        const greeter = await this.env.ethers.getContractAtFromArtifact(greeterArtifact, deployedGreeter.address);
                        chai_1.assert.equal(await greeter.functions.greet(), "Hi");
                        await greeter.functions.setGreeting("Hola");
                        chai_1.assert.equal(await greeter.functions.greet(), "Hola");
                    });
                    describe("with custom signer", function () {
                        it("Should return an instance of a contract associated to a custom signer", async function () {
                            const contract = await this.env.ethers.getContractAtFromArtifact(greeterArtifact, deployedGreeter.address, signers[1]);
                            chai_1.assert.equal(await contract.signer.getAddress(), await signers[1].getAddress());
                        });
                    });
                });
            });
        });
    });
    describe("hardhat", function () {
        (0, helpers_1.useEnvironment)("hardhat-project", "hardhat");
        describe("contract events", function () {
            it("should be detected", async function () {
                const Greeter = await this.env.ethers.getContractFactory("Greeter");
                const deployedGreeter = await Greeter.deploy();
                // at the time of this writing, ethers' default polling interval is
                // 4000 ms. here we turn it down in order to speed up this test.
                // see also
                // https://github.com/ethers-io/ethers.js/issues/615#issuecomment-848991047
                const provider = deployedGreeter.provider;
                provider.pollingInterval = 100;
                let eventEmitted = false;
                deployedGreeter.on("GreetingUpdated", () => {
                    eventEmitted = true;
                });
                await deployedGreeter.functions.setGreeting("Hola");
                // wait for 1.5 polling intervals for the event to fire
                await new Promise((resolve) => setTimeout(resolve, provider.pollingInterval * 1.5));
                chai_1.assert.equal(eventEmitted, true);
            });
        });
        describe("hardhat_reset", function () {
            it("should return the correct block number after a hardhat_reset", async function () {
                let blockNumber = await this.env.ethers.provider.getBlockNumber();
                chai_1.assert.equal(blockNumber.toString(), "0");
                await this.env.ethers.provider.send("evm_mine", []);
                await this.env.ethers.provider.send("evm_mine", []);
                blockNumber = await this.env.ethers.provider.getBlockNumber();
                chai_1.assert.equal(blockNumber.toString(), "2");
                await this.env.ethers.provider.send("hardhat_reset", []);
                blockNumber = await this.env.ethers.provider.getBlockNumber();
                chai_1.assert.equal(blockNumber.toString(), "0");
            });
            it("should return the correct block after a hardhat_reset", async function () {
                await this.env.ethers.provider.send("evm_mine", []);
                let blockOne = await this.env.ethers.provider.getBlock(1);
                let blockTwo = await this.env.ethers.provider.getBlock(2);
                chai_1.assert.isNotNull(blockOne);
                chai_1.assert.isNull(blockTwo);
                await this.env.ethers.provider.send("hardhat_reset", []);
                blockOne = await this.env.ethers.provider.getBlock(1);
                blockTwo = await this.env.ethers.provider.getBlock(2);
                chai_1.assert.isNull(blockOne);
                chai_1.assert.isNull(blockTwo);
            });
            it("should return the correct nonce after a hardhat_reset", async function () {
                const [sig] = await this.env.ethers.getSigners();
                let nonce = await this.env.ethers.provider.getTransactionCount(sig.address);
                chai_1.assert.equal(nonce, 0);
                const response = await sig.sendTransaction({
                    from: sig.address,
                    to: this.env.ethers.constants.AddressZero,
                    value: "0x1",
                });
                await response.wait();
                nonce = await this.env.ethers.provider.getTransactionCount(sig.address);
                chai_1.assert.equal(nonce, 1);
                await this.env.ethers.provider.send("hardhat_reset", []);
                nonce = await this.env.ethers.provider.getTransactionCount(sig.address);
                chai_1.assert.equal(nonce, 0);
            });
            it("should return the correct balance after a hardhat_reset", async function () {
                const [sig] = await this.env.ethers.getSigners();
                let balance = await this.env.ethers.provider.getBalance(sig.address);
                chai_1.assert.equal(balance.toString(), "10000000000000000000000");
                const response = await sig.sendTransaction({
                    from: sig.address,
                    to: this.env.ethers.constants.AddressZero,
                    gasPrice: 8e9,
                });
                await response.wait();
                balance = await this.env.ethers.provider.getBalance(sig.address);
                chai_1.assert.equal(balance.toString(), "9999999832000000000000");
                await this.env.ethers.provider.send("hardhat_reset", []);
                balance = await this.env.ethers.provider.getBalance(sig.address);
                chai_1.assert.equal(balance.toString(), "10000000000000000000000");
            });
            it("should return the correct code after a hardhat_reset", async function () {
                const [sig] = await this.env.ethers.getSigners();
                const Greeter = await this.env.ethers.getContractFactory("Greeter");
                const tx = Greeter.getDeployTransaction();
                const response = await sig.sendTransaction(tx);
                const receipt = await response.wait();
                let code = await this.env.ethers.provider.getCode(receipt.contractAddress);
                chai_1.assert.lengthOf(code, 1880);
                await this.env.ethers.provider.send("hardhat_reset", []);
                code = await this.env.ethers.provider.getCode(receipt.contractAddress);
                chai_1.assert.lengthOf(code, 2);
            });
        });
        describe("evm_revert", function () {
            it("should return the correct block number after a evm_revert", async function () {
                const snapshotId = await this.env.ethers.provider.send("evm_snapshot", []);
                let blockNumber = await this.env.ethers.provider.getBlockNumber();
                chai_1.assert.equal(blockNumber.toString(), "0");
                await this.env.ethers.provider.send("evm_mine", []);
                await this.env.ethers.provider.send("evm_mine", []);
                blockNumber = await this.env.ethers.provider.getBlockNumber();
                chai_1.assert.equal(blockNumber.toString(), "2");
                await this.env.ethers.provider.send("evm_revert", [snapshotId]);
                blockNumber = await this.env.ethers.provider.getBlockNumber();
                chai_1.assert.equal(blockNumber.toString(), "0");
            });
            it("should return the correct block after a evm_revert", async function () {
                const snapshotId = await this.env.ethers.provider.send("evm_snapshot", []);
                await this.env.ethers.provider.send("evm_mine", []);
                let blockOne = await this.env.ethers.provider.getBlock(1);
                let blockTwo = await this.env.ethers.provider.getBlock(2);
                chai_1.assert.isNotNull(blockOne);
                chai_1.assert.isNull(blockTwo);
                await this.env.ethers.provider.send("evm_revert", [snapshotId]);
                blockOne = await this.env.ethers.provider.getBlock(1);
                blockTwo = await this.env.ethers.provider.getBlock(2);
                chai_1.assert.isNull(blockOne);
                chai_1.assert.isNull(blockTwo);
            });
            it("should return the correct nonce after a evm_revert", async function () {
                const snapshotId = await this.env.ethers.provider.send("evm_snapshot", []);
                const [sig] = await this.env.ethers.getSigners();
                let nonce = await this.env.ethers.provider.getTransactionCount(sig.address);
                chai_1.assert.equal(nonce, 0);
                const response = await sig.sendTransaction({
                    from: sig.address,
                    to: this.env.ethers.constants.AddressZero,
                    value: "0x1",
                });
                await response.wait();
                nonce = await this.env.ethers.provider.getTransactionCount(sig.address);
                chai_1.assert.equal(nonce, 1);
                await this.env.ethers.provider.send("evm_revert", [snapshotId]);
                nonce = await this.env.ethers.provider.getTransactionCount(sig.address);
                chai_1.assert.equal(nonce, 0);
            });
            it("should return the correct balance after a evm_revert", async function () {
                const snapshotId = await this.env.ethers.provider.send("evm_snapshot", []);
                const [sig] = await this.env.ethers.getSigners();
                let balance = await this.env.ethers.provider.getBalance(sig.address);
                chai_1.assert.equal(balance.toString(), "10000000000000000000000");
                const response = await sig.sendTransaction({
                    from: sig.address,
                    to: this.env.ethers.constants.AddressZero,
                    gasPrice: 8e9,
                });
                await response.wait();
                balance = await this.env.ethers.provider.getBalance(sig.address);
                chai_1.assert.equal(balance.toString(), "9999999832000000000000");
                await this.env.ethers.provider.send("evm_revert", [snapshotId]);
                balance = await this.env.ethers.provider.getBalance(sig.address);
                chai_1.assert.equal(balance.toString(), "10000000000000000000000");
            });
            it("should return the correct code after a evm_revert", async function () {
                const snapshotId = await this.env.ethers.provider.send("evm_snapshot", []);
                const [sig] = await this.env.ethers.getSigners();
                const Greeter = await this.env.ethers.getContractFactory("Greeter");
                const tx = Greeter.getDeployTransaction();
                const response = await sig.sendTransaction(tx);
                const receipt = await response.wait();
                let code = await this.env.ethers.provider.getCode(receipt.contractAddress);
                chai_1.assert.lengthOf(code, 1880);
                await this.env.ethers.provider.send("evm_revert", [snapshotId]);
                code = await this.env.ethers.provider.getCode(receipt.contractAddress);
                chai_1.assert.lengthOf(code, 2);
            });
        });
        it("_signTypedData integration test", async function () {
            // See https://eips.ethereum.org/EIPS/eip-712#parameters
            // There's a json schema and an explanation for each field.
            const typedMessage = {
                domain: {
                    chainId: 31337,
                    name: "Hardhat Network test suite",
                },
                message: {
                    name: "Translation",
                    start: {
                        x: 200,
                        y: 600,
                    },
                    end: {
                        x: 300,
                        y: 350,
                    },
                    cost: 50,
                },
                primaryType: "WeightedVector",
                types: {
                    // ethers.js derives the EIP712Domain type from the domain object itself
                    // EIP712Domain: [
                    //   { name: "name", type: "string" },
                    //   { name: "chainId", type: "uint256" },
                    // ],
                    WeightedVector: [
                        { name: "name", type: "string" },
                        { name: "start", type: "Point" },
                        { name: "end", type: "Point" },
                        { name: "cost", type: "uint256" },
                    ],
                    Point: [
                        { name: "x", type: "uint256" },
                        { name: "y", type: "uint256" },
                    ],
                },
            };
            const [signer] = await this.env.ethers.getSigners();
            const signature = await signer._signTypedData(typedMessage.domain, typedMessage.types, typedMessage.message);
            const byteToHex = 2;
            const hexPrefix = 2;
            const signatureSizeInBytes = 65;
            chai_1.assert.lengthOf(signature, signatureSizeInBytes * byteToHex + hexPrefix);
        });
    });
    describe("ganache via WebSocket", function () {
        (0, helpers_1.useEnvironment)("hardhat-project");
        it("should be able to detect events", async function () {
            await this.env.run("compile", { quiet: true });
            const Greeter = await this.env.ethers.getContractFactory("Greeter");
            const deployedGreeter = await Greeter.deploy();
            const readonlyContract = deployedGreeter.connect(new ethers_1.ethers.providers.WebSocketProvider("ws://localhost:8545"));
            let emitted = false;
            readonlyContract.on("GreetingUpdated", () => {
                emitted = true;
            });
            await deployedGreeter.functions.setGreeting("Hola");
            // wait for the event to fire
            await new Promise((resolve) => setTimeout(resolve, 100));
            chai_1.assert.equal(emitted, true);
        });
    });
});
//# sourceMappingURL=index.js.map