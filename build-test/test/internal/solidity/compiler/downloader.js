"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const errors_list_1 = require("../../../../src/internal/core/errors-list");
const downloader_1 = require("../../../../src/internal/solidity/compiler/downloader");
const errors_1 = require("../../../helpers/errors");
const fs_1 = require("../../../helpers/fs");
// The CompilerDownloader's logic is complex and has/depends on lots of
// side-effects. This is not ideal, but enables many optimizations. In
// particular, it doesn't download unnecessary files.
//
// To make it easier to test, CompilerDownloader exposes helper methods with
// internal logic and they are tested individually here.
describe("Compiler downloader", function () {
    let localCompilerBuild;
    let mockCompilerList;
    (0, fs_1.useTmpDir)("compiler-downloader");
    before(function () {
        localCompilerBuild = {
            path: "soljson-v0.7.3+commit.9bfce1f6.js",
            version: "0.7.3",
            build: "commit.9bfce1f6",
            longVersion: "0.7.3+commit.9bfce1f6",
            keccak256: "0xcf099e7057d6c3d5acac1f4e349798ad5a581b6cb7ffcebdf5b37b86eac4872d",
            urls: [
                "bzzr://2f8ec45d2d7298ab1fa49f3568ada6c6e030c7dd7f490a1505ed9d4713d86dc8",
                "dweb:/ipfs/QmQMH2o7Nz3DaQ31hNYyHVAgejqTyZouvA35Zzzwe2UBPt",
            ],
            platform: downloader_1.CompilerPlatform.WASM,
        };
        mockCompilerList = {
            builds: [localCompilerBuild],
            releases: {
                [localCompilerBuild.version]: localCompilerBuild.path,
            },
            latestRelease: localCompilerBuild.version,
        };
    });
    describe("Downloaded compiler verification", function () {
        it("Shouldn't do anything if the compiler is fine", async function () {
            const downloader = new downloader_1.CompilerDownloader(this.tmpDir, {
                download: async () => {
                    throw new Error("This shouldn't be called");
                },
            });
            const compilerBin = require.resolve("solc/soljson.js");
            await downloader.verifyCompiler(localCompilerBuild, compilerBin);
        });
        it("Should throw if the download checksum verification fails, and delete it, and the compilers list", async function () {
            const compilersDir = this.tmpDir;
            const downloader = new downloader_1.CompilerDownloader(compilersDir, {
                download: async () => {
                    throw new Error("Expected");
                },
            });
            const compilersList = downloader.getCompilersListPath(localCompilerBuild.platform);
            const corruptCompilerBin = path_1.default.join(compilersDir, "asd");
            await fs_extra_1.default.createFile(compilersList);
            await fs_extra_1.default.createFile(corruptCompilerBin);
            await (0, errors_1.expectHardhatErrorAsync)(() => downloader.verifyCompiler(localCompilerBuild, corruptCompilerBin), errors_list_1.ERRORS.SOLC.INVALID_DOWNLOAD);
            chai_1.assert.isFalse(await fs_extra_1.default.pathExists(corruptCompilerBin));
            chai_1.assert.isFalse(await fs_extra_1.default.pathExists(compilersList));
        });
    });
    describe("Compiler download", function () {
        it("should call the download function with the right params", async function () {
            const compilersDir = this.tmpDir;
            const downloadPath = path_1.default.join(compilersDir, "downloadedCompiler");
            const expectedUrl = `https://binaries.soliditylang.org/wasm/${localCompilerBuild.path}`;
            let urlUsed;
            let pathUsed;
            const downloader = new downloader_1.CompilerDownloader(compilersDir, {
                download: async (url, compilerPath) => {
                    urlUsed = url;
                    pathUsed = compilerPath;
                },
            });
            await downloader.downloadCompiler(localCompilerBuild, downloadPath);
            chai_1.assert.equal(urlUsed, expectedUrl);
            chai_1.assert.equal(pathUsed, downloadPath);
        });
        it("Should throw the right error if the download fails", async function () {
            const compilersDir = this.tmpDir;
            const downloadPath = path_1.default.join(compilersDir, "downloadedCompiler");
            const downloader = new downloader_1.CompilerDownloader(compilersDir, {
                download: async () => {
                    throw new Error("Expected");
                },
            });
            await (0, errors_1.expectHardhatErrorAsync)(() => downloader.downloadCompiler(localCompilerBuild, downloadPath), errors_list_1.ERRORS.SOLC.DOWNLOAD_FAILED);
        });
    });
    describe("Compilers list download", function () {
        it("Should call download with the right params", async function () {
            const compilersDir = this.tmpDir;
            const expectedUrl = `https://binaries.soliditylang.org/wasm/list.json`;
            let urlUsed;
            let pathUsed;
            const downloader = new downloader_1.CompilerDownloader(compilersDir, {
                download: async (url, compilerPath) => {
                    urlUsed = url;
                    pathUsed = compilerPath;
                },
            });
            await downloader.downloadCompilersList(downloader_1.CompilerPlatform.WASM);
            chai_1.assert.equal(urlUsed, expectedUrl);
            chai_1.assert.equal(pathUsed, path_1.default.join(compilersDir, downloader_1.CompilerPlatform.WASM, "list.json"));
        });
        it("Should throw the right error if the download fails", async function () {
            const downloader = new downloader_1.CompilerDownloader(this.tmpDir, {
                download: async () => {
                    throw new Error("Expected");
                },
            });
            await (0, errors_1.expectHardhatErrorAsync)(() => downloader.downloadCompilersList(downloader_1.CompilerPlatform.WASM), errors_list_1.ERRORS.SOLC.VERSION_LIST_DOWNLOAD_FAILED);
        });
    });
    describe("Compilers list exists", function () {
        it("Should return true if it does", async function () {
            const compilersDir = this.tmpDir;
            await fs_extra_1.default.createFile(path_1.default.join(compilersDir, downloader_1.CompilerPlatform.WASM, "list.json"));
            const downloader = new downloader_1.CompilerDownloader(compilersDir, {
                download: async () => {
                    throw new Error("This shouldn't be called");
                },
            });
            chai_1.assert.isTrue(await downloader.compilersListExists(downloader_1.CompilerPlatform.WASM));
        });
        it("should return false if it doesn't", async function () {
            const downloader = new downloader_1.CompilerDownloader(this.tmpDir, {
                download: async () => {
                    throw new Error("This shouldn't be called");
                },
            });
            chai_1.assert.isFalse(await downloader.compilersListExists(downloader_1.CompilerPlatform.WASM));
        });
    });
    describe("Get compilers lists and CompilerBuild", function () {
        let compilersDir;
        let downloadCallCount;
        let successDownloadTry;
        let mockDownloader;
        beforeEach(async function () {
            compilersDir = this.tmpDir;
            downloadCallCount = 0;
            successDownloadTry = 0;
            mockDownloader = new downloader_1.CompilerDownloader(compilersDir, {
                download: async () => {
                    if (downloadCallCount >= successDownloadTry) {
                        await saveMockCompilersList();
                    }
                    else {
                        await saveMalformedCompilersList();
                    }
                    downloadCallCount++;
                },
                forceSolcJs: true,
            });
        });
        async function saveMalformedCompilersList() {
            await fs_extra_1.default.outputFile(path_1.default.join(compilersDir, downloader_1.CompilerPlatform.WASM, "list.json"), "{ malformed");
        }
        async function saveMockCompilersList() {
            await fs_extra_1.default.outputJSON(path_1.default.join(compilersDir, downloader_1.CompilerPlatform.WASM, "list.json"), mockCompilerList);
        }
        describe("When there's an already downloaded list", function () {
            beforeEach(async function () {
                await saveMockCompilersList();
            });
            describe("getCompilersList", function () {
                it("Doesn't download the list again", async function () {
                    await mockDownloader.getCompilersList(downloader_1.CompilerPlatform.WASM);
                    chai_1.assert.equal(downloadCallCount, 0);
                });
                it("Returns the right list", async function () {
                    const list = await mockDownloader.getCompilersList(downloader_1.CompilerPlatform.WASM);
                    chai_1.assert.deepEqual(list, mockCompilerList);
                });
            });
            describe("getCompilerBuild", function () {
                describe("When the build is in the list", function () {
                    it("Doesn't re-download the list", async function () {
                        await mockDownloader.getCompilerBuild(localCompilerBuild.version);
                        chai_1.assert.equal(downloadCallCount, 0);
                    });
                    it("Returns the right build", async function () {
                        const build = await mockDownloader.getCompilerBuild(localCompilerBuild.version);
                        chai_1.assert.deepEqual(build, localCompilerBuild);
                    });
                });
                describe("When it isn't", function () {
                    it("Downloads the build", async function () {
                        try {
                            await mockDownloader.getCompilerBuild("non-existent");
                            chai_1.assert.equal(downloadCallCount, 1);
                        }
                        catch (e) {
                            // We ignore the error here, see next test.
                        }
                    });
                    it("Throws the right error if the build is not included in the new list", async function () {
                        await (0, errors_1.expectHardhatErrorAsync)(() => mockDownloader.getCompilerBuild("non-existent"), errors_list_1.ERRORS.SOLC.INVALID_VERSION);
                    });
                });
            });
        });
        describe("When there isn't", function () {
            describe("getCompilersList", function () {
                it("Downloads the compilers list", async function () {
                    await mockDownloader.getCompilersList(downloader_1.CompilerPlatform.WASM);
                    chai_1.assert.equal(downloadCallCount, 1);
                });
            });
            describe("getCompilerBuild", function () {
                it("Downloads the compilers list", async function () {
                    await mockDownloader.getCompilerBuild(localCompilerBuild.version);
                    chai_1.assert.equal(downloadCallCount, 1);
                });
            });
        });
        describe("When there is but it is malformed", function () {
            beforeEach(async function () {
                await saveMalformedCompilersList();
            });
            describe("getCompilersList", function () {
                it("Redownloads the compilers list", async function () {
                    await mockDownloader.getCompilersList(downloader_1.CompilerPlatform.WASM);
                    chai_1.assert.equal(downloadCallCount, 1);
                });
            });
            describe("getCompilerBuild", function () {
                it("Redownloads the compilers list", async function () {
                    await mockDownloader.getCompilerBuild(localCompilerBuild.version);
                    chai_1.assert.equal(downloadCallCount, 1);
                });
            });
        });
        describe("When downloading fails", function () {
            describe("getCompilersList", function () {
                it("retries on a failed download", async function () {
                    successDownloadTry = 1;
                    await mockDownloader.getCompilersList(downloader_1.CompilerPlatform.WASM);
                    chai_1.assert.equal(downloadCallCount, 2);
                });
                it("errors on too many failed downloads", async function () {
                    successDownloadTry = 999;
                    await chai_1.assert.isRejected(mockDownloader.getCompilersList(downloader_1.CompilerPlatform.WASM), SyntaxError);
                    chai_1.assert.equal(downloadCallCount, 4);
                });
            });
            describe("getCompilerBuild", function () {
                it("retries on a failed download", async function () {
                    successDownloadTry = 1;
                    await mockDownloader.getCompilerBuild(localCompilerBuild.version);
                    chai_1.assert.equal(downloadCallCount, 2);
                });
                it("errors on too many failed downloads", async function () {
                    successDownloadTry = 999;
                    await chai_1.assert.isRejected(mockDownloader.getCompilersList(downloader_1.CompilerPlatform.WASM), SyntaxError);
                    chai_1.assert.equal(downloadCallCount, 4);
                });
            });
        });
    });
    describe("getDownloadedCompilerPath", function () {
        let compilersDir;
        let downloadedPath;
        let downloadCalled;
        let mockDownloader;
        beforeEach(async function () {
            compilersDir = this.tmpDir;
            downloadedPath = path_1.default.join(compilersDir, downloader_1.CompilerPlatform.WASM, localCompilerBuild.path);
            downloadCalled = false;
            await fs_extra_1.default.outputJSON(path_1.default.join(compilersDir, downloader_1.CompilerPlatform.WASM, "list.json"), mockCompilerList);
            mockDownloader = new downloader_1.CompilerDownloader(compilersDir, {
                download: async () => {
                    downloadCalled = true;
                    // Just create an empty file
                    await fs_extra_1.default.createFile(downloadedPath);
                },
                forceSolcJs: true,
            });
        });
        describe("If the compiler already existed", function () {
            it("Should return it if it's passes the verification", async function () {
                const compilerBin = require.resolve("solc/soljson.js");
                await fs_extra_1.default.copy(compilerBin, downloadedPath);
                const compilerPathResult = await mockDownloader.getDownloadedCompilerPath(localCompilerBuild.version);
                chai_1.assert.isDefined(compilerPathResult);
                chai_1.assert.equal(compilerPathResult.compilerPath, downloadedPath);
            });
            it("Should throw and delete it if it doesn't", async function () {
                await fs_extra_1.default.createFile(downloadedPath);
                await (0, errors_1.expectHardhatErrorAsync)(() => mockDownloader.getDownloadedCompilerPath(localCompilerBuild.version), errors_list_1.ERRORS.SOLC.INVALID_DOWNLOAD);
                chai_1.assert.isFalse(await fs_extra_1.default.pathExists(downloadedPath));
            });
        });
        describe("If the compiler didn't exist", function () {
            it("should download and verify it", async function () {
                await (0, errors_1.expectHardhatErrorAsync)(() => mockDownloader.getDownloadedCompilerPath(localCompilerBuild.version), errors_list_1.ERRORS.SOLC.INVALID_DOWNLOAD);
                chai_1.assert.isFalse(await fs_extra_1.default.pathExists(downloadedPath));
                chai_1.assert.isTrue(downloadCalled);
            });
        });
    });
});
//# sourceMappingURL=downloader.js.map