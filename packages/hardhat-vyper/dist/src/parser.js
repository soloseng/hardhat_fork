"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const cache_1 = require("./cache");
class Parser {
    constructor(_vyperFilesCache = cache_1.VyperFilesCache.createEmpty()) {
        this._vyperFilesCache = _vyperFilesCache;
        this._cache = new Map();
    }
    parse(fileContent, absolutePath, contentHash) {
        const cacheResult = this._getFromCache(absolutePath, contentHash);
        if (cacheResult !== null) {
            return cacheResult;
        }
        const result = {
            versionPragma: parseVersionPragma(fileContent),
        };
        this._cache.set(contentHash, result);
        return result;
    }
    _getFromCache(absolutePath, contentHash) {
        const internalCacheEntry = this._cache.get(contentHash);
        if (internalCacheEntry !== undefined) {
            return internalCacheEntry;
        }
        const vyperFilesCacheEntry = this._vyperFilesCache.getEntry(absolutePath);
        if (vyperFilesCacheEntry === undefined) {
            return null;
        }
        if (vyperFilesCacheEntry.contentHash !== contentHash) {
            return null;
        }
        const { versionPragma } = vyperFilesCacheEntry;
        return { versionPragma };
    }
}
exports.Parser = Parser;
function parseVersionPragma(fileContent) {
    var _a;
    const versionPragmasRegex = /#\s+@version\s+(.+)/g;
    const result = versionPragmasRegex.exec(fileContent);
    return (_a = result === null || result === void 0 ? void 0 : result[1]) !== null && _a !== void 0 ? _a : "*";
}
//# sourceMappingURL=parser.js.map