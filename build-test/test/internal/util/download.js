"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
// @ts-ignore
// eslint-disable-next-line  import/no-extraneous-dependencies
const proxy_1 = __importDefault(require("proxy"));
const download_1 = require("../../../src/internal/util/download");
const fs_1 = require("../../helpers/fs");
describe("Compiler List download", function () {
    (0, fs_1.useTmpDir)("compiler-downloader");
    describe("Compilers list download", function () {
        it("Should call download with the right params", async function () {
            const compilersDir = this.tmpDir;
            const downloadPath = path_1.default.join(compilersDir, "downloadedCompiler");
            const expectedUrl = `https://solc-bin.ethereum.org/wasm/list.json`;
            // download the file
            await (0, download_1.download)(expectedUrl, downloadPath);
            // Assert that the file exists
            chai_1.assert.isTrue(await fs_extra_1.default.pathExists(downloadPath));
        });
    });
});
describe("Compiler List download with proxy", function () {
    let env;
    let proxy;
    let proxyPort;
    (0, fs_1.useTmpDir)("compiler-downloader");
    before(function (done) {
        // Setup Proxy Server
        proxy = new proxy_1.default();
        proxy.listen(function () {
            proxyPort = proxy.address().port;
            done();
        });
    });
    describe("Compilers list download with HTTPS_PROXY", function () {
        before(function () {
            // Save the Environment Settings and Set
            env = process.env;
            process.env.HTTPS_PROXY = `http://127.0.0.1:${proxyPort}`;
        });
        it("Should call download with the right params", async function () {
            const compilersDir = this.tmpDir;
            const downloadPath = path_1.default.join(compilersDir, "downloadedCompilerProxy");
            const expectedUrl = `https://solc-bin.ethereum.org/wasm/list.json`;
            // download the file
            await (0, download_1.download)(expectedUrl, downloadPath);
            // Assert that the file exists
            chai_1.assert.isTrue(await fs_extra_1.default.pathExists(downloadPath));
        });
        after(function () {
            // restoring everything back to the environment
            process.env = env;
        });
    });
    describe("Compilers list download with HTTP_PROXY", function () {
        before(function () {
            // Save the Environment Settings and Set
            env = process.env;
            process.env.HTTP_PROXY = `http://127.0.0.1:${proxyPort}`;
        });
        it("Should call download with the right params", async function () {
            const compilersDir = this.tmpDir;
            const downloadPath = path_1.default.join(compilersDir, "downloadedCompilerProxy");
            const expectedUrl = `https://solc-bin.ethereum.org/wasm/list.json`;
            // download the file
            await (0, download_1.download)(expectedUrl, downloadPath);
            // Assert that the file exists
            chai_1.assert.isTrue(await fs_extra_1.default.pathExists(downloadPath));
        });
        after(function () {
            // restoring everything back to the environment
            process.env = env;
        });
    });
    after(function (done) {
        // Shutdown Proxy Server
        proxy.once("close", function () {
            done();
        });
        proxy.close();
    });
});
//# sourceMappingURL=download.js.map