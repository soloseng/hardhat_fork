"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const plugins_1 = require("hardhat/plugins");
const fixture_1 = require("../src/fixture");
const task_names_1 = require("../src/task-names");
const helpers_1 = require("./helpers");
describe("Truffle fixtures support", function () {
    describe("Migration detection", function () {
        describe("In a project without migrations", function () {
            (0, helpers_1.useEnvironment)("hardhat-project-solc-0.4", plugins_1.HARDHAT_NETWORK_NAME);
            it("Should not detect any", async function () {
                chai_1.assert.isFalse(await (0, fixture_1.hasMigrations)(this.env.config.paths));
            });
        });
        describe("In a project with migrations", function () {
            (0, helpers_1.useEnvironment)("hardhat-project-with-migrations", plugins_1.HARDHAT_NETWORK_NAME);
            it("Should detect them", async function () {
                chai_1.assert.isTrue(await (0, fixture_1.hasMigrations)(this.env.config.paths));
            });
        });
    });
    describe("Fixtures detection", function () {
        describe("In a project without fixture", function () {
            (0, helpers_1.useEnvironment)("hardhat-project-solc-0.4", plugins_1.HARDHAT_NETWORK_NAME);
            it("Should not detect any", async function () {
                chai_1.assert.isFalse(await (0, fixture_1.hasTruffleFixture)(this.env.config.paths));
            });
        });
        describe("In a project with a js fixture", function () {
            (0, helpers_1.useEnvironment)("hardhat-project-with-fixture", plugins_1.HARDHAT_NETWORK_NAME);
            it("Should detect them", async function () {
                chai_1.assert.isTrue(await (0, fixture_1.hasTruffleFixture)(this.env.config.paths));
            });
        });
        describe("In a project with a ts fixture", function () {
            (0, helpers_1.useEnvironment)("hardhat-project-with-ts-fixture", plugins_1.HARDHAT_NETWORK_NAME);
            it("Should detect them", async function () {
                chai_1.assert.isTrue(await (0, fixture_1.hasTruffleFixture)(this.env.config.paths));
            });
        });
    });
    describe("Fixtures function loading", function () {
        describe("In a project with a js fixture", function () {
            (0, helpers_1.useEnvironment)("hardhat-project-with-fixture", plugins_1.HARDHAT_NETWORK_NAME);
            it("Should load it correctly", async function () {
                const fixture = await (0, fixture_1.getTruffleFixtureFunction)(this.env.config.paths);
                chai_1.assert.isFunction(fixture);
            });
        });
        describe("In a project with a ts fixture", function () {
            (0, helpers_1.useEnvironment)("hardhat-project-with-ts-fixture", plugins_1.HARDHAT_NETWORK_NAME);
            it("Should load it correctly", async function () {
                const fixture = await (0, fixture_1.getTruffleFixtureFunction)(this.env.config.paths);
                chai_1.assert.isFunction(fixture);
            });
        });
        describe("In an invalid fixture", function () {
            (0, helpers_1.useEnvironment)("hardhat-project-with-invalid-fixture", plugins_1.HARDHAT_NETWORK_NAME);
            it("Should load it correctly", async function () {
                try {
                    await (0, fixture_1.getTruffleFixtureFunction)(this.env.config.paths);
                }
                catch (error) {
                    chai_1.assert.include(error.message, "Truffle fixture file");
                    chai_1.assert.include(error.message, "must return a function");
                    return;
                }
                chai_1.assert.fail("Should have failed");
            });
        });
    });
    describe("Fixtures integration test", function () {
        (0, helpers_1.useEnvironment)("hardhat-project-solc-0.5", plugins_1.HARDHAT_NETWORK_NAME);
        it("Should detect deployed contracts", async function () {
            await this.env.run(task_names_1.RUN_TRUFFLE_FIXTURE_TASK);
            const Greeter = this.env.artifacts.require("Greeter");
            const greeter = await Greeter.deployed();
            chai_1.assert.equal(await greeter.greet(), "Hi");
        });
        it("Should give the right error on non-deployed contracts", async function () {
            await this.env.run(task_names_1.RUN_TRUFFLE_FIXTURE_TASK);
            const Lib = this.env.artifacts.require("Lib");
            try {
                await Lib.deployed();
            }
            catch (error) {
                chai_1.assert.equal(error.message, "Trying to get deployed instance of Lib, but none was set.");
                return;
            }
            chai_1.assert.fail("Should have failed");
        });
    });
});
//# sourceMappingURL=fixtures.js.map