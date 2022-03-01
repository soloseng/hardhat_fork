"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ganache_service_1 = require("../src/ganache-service");
const helpers_1 = require("./helpers");
describe("Ganache plugin with empty configs", function () {
    (0, helpers_1.useEnvironment)("hardhat-project", "ganache");
    it("Should add ganache network to the config", function () {
        chai_1.assert.isDefined(this.env.config.networks.ganache);
    });
    it("Should expose ganache defaults configs in hardhat's config", function () {
        chai_1.assert.isDefined(this.env.config.networks.ganache);
        const defaultOptions = ganache_service_1.GanacheService.getDefaultOptions();
        const options = this.env.config.networks.ganache;
        // Iterate over all default options and assert equality
        for (const [key, value] of Object.entries(defaultOptions)) {
            chai_1.assert.equal(options[key], value);
        }
    });
    it("Should run Hardhat TEST task using Ganache", async function () {
        const failures = await this.env.run("test", {
            testFiles: [],
        });
        chai_1.assert.equal(failures, 0);
    });
    it("Should run Hardhat RUN task 'accounts-sample.js' using Ganache", async function () {
        await this.env.run("run", {
            noCompile: true,
            script: "scripts/accounts-sample.js",
        });
        chai_1.assert.equal(process.exitCode, 0);
    });
    it("Should run Hardhat RUN task 'delayed-sample.js' using Ganache", async function () {
        await this.env.run("run", {
            noCompile: true,
            script: "scripts/delayed-sample.js",
        });
        chai_1.assert.equal(process.exitCode, 0);
    });
});
describe("Ganache plugin with custom configs", function () {
    (0, helpers_1.useEnvironment)("hardhat-project-with-configs", "ganache");
    it("Should add ganache network to hardhat's config", function () {
        chai_1.assert.isDefined(this.env.config.networks.ganache);
    });
    it("Should load custom configs in hardhat's config'", function () {
        chai_1.assert.isDefined(this.env.config.networks.ganache);
        const customConfigs = require("./fixture-projects/hardhat-project-with-configs/hardhat.config.ts").default;
        chai_1.assert.isDefined(customConfigs.networks.ganache);
        const customOptions = customConfigs.networks.ganache;
        const options = this.env.config.networks.ganache;
        // Iterate over all custom options and assert equality
        for (const [key, value] of Object.entries(customOptions)) {
            chai_1.assert.equal(options[key], value);
        }
    });
    it("Should expose merged (custom + defaults) configs in hardhat's config", function () {
        chai_1.assert.isDefined(this.env.config.networks.ganache);
        const customConfigs = require("./fixture-projects/hardhat-project-with-configs/hardhat.config.ts").default;
        const defaultOptions = ganache_service_1.GanacheService.getDefaultOptions();
        chai_1.assert.isDefined(customConfigs.networks.ganache);
        const customOptions = customConfigs.networks.ganache;
        const mergedOptions = Object.assign(Object.assign({}, defaultOptions), customOptions);
        const options = this.env.config.networks.ganache;
        // Iterate over all custom options and assert equality
        for (const [key, value] of Object.entries(mergedOptions)) {
            chai_1.assert.equal(options[key], value);
        }
    });
    it("Should run Hardhat RUN task using Ganache with custom configs", async function () {
        await this.env.run("run", {
            noCompile: true,
            script: "scripts/custom-accounts-sample.js",
        });
        chai_1.assert.equal(process.exitCode, 0);
    });
});
//# sourceMappingURL=index.js.map