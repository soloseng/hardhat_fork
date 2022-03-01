"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fsExtra = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const task_names_1 = require("hardhat/builtin-tasks/task-names");
const constants_1 = require("../src/constants");
const helpers_1 = require("./helpers");
describe("Vyper plugin", function () {
    beforeEach(function () {
        fsExtra.removeSync("artifacts");
        fsExtra.removeSync(path_1.default.join("cache", constants_1.VYPER_FILES_CACHE_FILENAME));
    });
    describe("project with single file", function () {
        (0, helpers_1.useFixtureProject)("compilation-single-file");
        (0, helpers_1.useEnvironment)();
        it("should compile and emit artifacts", async function () {
            await this.env.run(task_names_1.TASK_COMPILE);
            (0, helpers_1.assertFileExists)(path_1.default.join("artifacts", "contracts", "A.vy", "A.json"));
        });
    });
    describe("project with two files with different compiler versions", function () {
        (0, helpers_1.useFixtureProject)("compilation-two-files-different-versions");
        (0, helpers_1.useEnvironment)();
        it("should compile and emit artifacts", async function () {
            await this.env.run(task_names_1.TASK_COMPILE);
            (0, helpers_1.assertFileExists)(path_1.default.join("artifacts", "contracts", "A.vy", "A.json"));
            (0, helpers_1.assertFileExists)(path_1.default.join("artifacts", "contracts", "B.vy", "B.json"));
        });
    });
    describe("old versions of vyper", function () {
        (0, helpers_1.useFixtureProject)("old-vyper-versions");
        describe("project with an old version of vyper", function () {
            (0, helpers_1.useEnvironment)("old-vyper-version.js");
            it("should throw an error", async function () {
                await (0, helpers_1.expectVyperErrorAsync)(async () => {
                    await this.env.run(task_names_1.TASK_COMPILE);
                }, "Unsupported vyper version: 0.1.0-beta.15");
            });
        });
        describe("project with an old version of vyper (multiple compilers)", function () {
            (0, helpers_1.useEnvironment)("old-vyper-version-multiple-compilers.js");
            it("should throw an error", async function () {
                await (0, helpers_1.expectVyperErrorAsync)(async () => {
                    await this.env.run(task_names_1.TASK_COMPILE);
                }, "Unsupported vyper version: 0.1.0-beta.15");
            });
        });
    });
    describe("Mixed language", async function () {
        (0, helpers_1.useFixtureProject)("mixed-language");
        (0, helpers_1.useEnvironment)();
        it("Should successfully compile the contracts", async function () {
            await this.env.run(task_names_1.TASK_COMPILE);
            chai_1.assert.equal(this.env.artifacts.readArtifactSync("test").contractName, "test");
            chai_1.assert.equal(this.env.artifacts.readArtifactSync("Greeter").contractName, "Greeter");
        });
    });
    describe("project with file that cannot be compiled", function () {
        (0, helpers_1.useFixtureProject)("unmatched-compiler-version");
        (0, helpers_1.useEnvironment)();
        it("should throw an error", async function () {
            await (0, helpers_1.expectVyperErrorAsync)(async () => {
                await this.env.run(task_names_1.TASK_COMPILE);
            }, "The Vyper version pragma statement in this file doesn't match any of the configured compilers in your config.");
        });
    });
});
//# sourceMappingURL=tests.js.map