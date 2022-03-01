"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEnvironment = void 0;
const plugins_testing_1 = require("hardhat/plugins-testing");
const path_1 = __importDefault(require("path"));
function useEnvironment(fixtureProjectName, networkName = "localhost") {
    beforeEach("Loading hardhat environment", function () {
        process.chdir(path_1.default.join(__dirname, "fixture-projects", fixtureProjectName));
        process.env.HARDHAT_NETWORK = networkName;
        this.env = require("hardhat");
    });
    beforeEach("Loading hardhat environment", async function () {
        await this.env.run("compile", { quiet: true });
    });
    afterEach("Resetting hardhat", function () {
        (0, plugins_testing_1.resetHardhatContext)();
        delete process.env.HARDHAT_NETWORK;
    });
}
exports.useEnvironment = useEnvironment;
//# sourceMappingURL=helpers.js.map