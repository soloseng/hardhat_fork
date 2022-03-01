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
exports.CompilerDownloader = void 0;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const semver_1 = __importDefault(require("semver"));
const types_1 = require("./types");
const constants_1 = require("./constants");
const util_1 = require("./util");
const log = (0, util_1.getLogger)("downloader");
async function downloadFile(url, destinationFile) {
    const { download } = await Promise.resolve().then(() => __importStar(require("hardhat/internal/util/download")));
    log(`Downloading from ${url} to ${destinationFile}`);
    await download(url, destinationFile);
}
class CompilerDownloader {
    constructor(_compilersDir, options = {}) {
        var _a;
        this._compilersDir = _compilersDir;
        this.compilersList = [];
        this._download = (_a = options.download) !== null && _a !== void 0 ? _a : downloadFile;
        this._platform = this._getCurrentPlatform();
    }
    get compilersListExists() {
        return this._fileExists(this.compilersListPath);
    }
    get downloadsDir() {
        return path_1.default.join(this._compilersDir, "vyper", this._platform);
    }
    get compilersListPath() {
        return path_1.default.join(this.downloadsDir, "list.json");
    }
    isCompilerDownloaded(version) {
        return this._fileExists(this._getDownloadedFilePath(version));
    }
    async initCompilersList({ forceDownload } = { forceDownload: true }) {
        if (forceDownload || !this.compilersListExists) {
            await this._downloadCompilersList();
        }
        this.compilersList = this._getCompilersListFromDisk();
    }
    async getCompilerAsset(version) {
        let versionRelease = this._findVersionRelease(version);
        if (versionRelease === undefined) {
            await this.initCompilersList({ forceDownload: true });
            versionRelease = this._findVersionRelease(version);
            if (versionRelease === undefined) {
                throw new util_1.VyperPluginError(`Unsupported vyper version: ${version}`);
            }
        }
        const compilerAsset = versionRelease.assets.find((asset) => asset.name.includes(this._platform));
        if (compilerAsset === undefined) {
            throw new util_1.VyperPluginError(`Vyper version ${version} is not supported on platform ${this._platform}`);
        }
        return compilerAsset;
    }
    async getOrDownloadCompiler(version) {
        try {
            const downloadedFilePath = this._getDownloadedFilePath(version);
            if (!this._fileExists(downloadedFilePath)) {
                const compilerAsset = await this.getCompilerAsset(version);
                await this._downloadCompiler(compilerAsset, downloadedFilePath);
            }
            if (this._isUnix) {
                fs_extra_1.default.chmodSync(downloadedFilePath, 0o755);
            }
            return downloadedFilePath;
        }
        catch (e) {
            if (util_1.VyperPluginError.isNomicLabsHardhatPluginError(e)) {
                throw e;
            }
            else {
                throw new util_1.VyperPluginError("An unexpected error occurred", e, true);
            }
        }
    }
    _findVersionRelease(version) {
        return this.compilersList.find((release) => semver_1.default.eq(release.tag_name, version));
    }
    async _downloadCompilersList() {
        try {
            await this._download(constants_1.GITHUB_RELEASES_URL, this.compilersListPath);
        }
        catch (_a) {
            throw new util_1.VyperPluginError("Failed to download compiler list", undefined, true);
        }
    }
    _getCompilersListFromDisk() {
        return fs_extra_1.default.readJSONSync(this.compilersListPath);
    }
    get _isUnix() {
        return (this._platform === types_1.CompilerPlatform.MACOS ||
            this._platform === types_1.CompilerPlatform.LINUX);
    }
    async _downloadCompiler(compilerAsset, downloadedFilePath) {
        const version = compilerAsset.name.split("+")[0].replace("vyper.", "");
        log(`Downloading compiler version ${version} platform ${this._platform}`);
        try {
            await this._download(compilerAsset.browser_download_url, downloadedFilePath);
        }
        catch (e) {
            throw new util_1.VyperPluginError("Compiler download failed", e);
        }
    }
    _getDownloadedFilePath(version) {
        return path_1.default.join(this.downloadsDir, version);
    }
    _fileExists(filepath) {
        return fs_extra_1.default.pathExistsSync(filepath);
    }
    _getCurrentPlatform() {
        switch (os_1.default.platform()) {
            case "win32":
                return types_1.CompilerPlatform.WINDOWS;
            case "linux":
                return types_1.CompilerPlatform.LINUX;
            case "darwin":
                return types_1.CompilerPlatform.MACOS;
            default:
                throw new util_1.VyperPluginError(`Vyper not supported on platform ${os_1.default.platform()}`);
        }
    }
}
exports.CompilerDownloader = CompilerDownloader;
//# sourceMappingURL=downloader.js.map