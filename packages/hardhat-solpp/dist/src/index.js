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
exports.PROCESSED_CACHE_DIRNAME = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const task_names_1 = require("hardhat/builtin-tasks/task-names");
const config_1 = require("hardhat/config");
const path_1 = __importDefault(require("path"));
require("./type-extensions");
exports.PROCESSED_CACHE_DIRNAME = "solpp-generated-contracts";
function getDefaultConfig(config) {
    return {
        defs: {},
        cwd: config.paths.sources,
        name: "hardhat-solpp",
        collapseEmptyLines: false,
        noPreprocessor: false,
        noFlatten: true,
        tolerant: false,
    };
}
async function readFiles(filePaths) {
    return Promise.all(filePaths.map((filePath) => fs_extra_1.default.readFile(filePath, "utf-8").then((content) => [filePath, content])));
}
(0, config_1.extendConfig)((config) => {
    const defaultConfig = getDefaultConfig(config);
    config.solpp = Object.assign(Object.assign({}, defaultConfig), config.solpp);
});
(0, config_1.subtask)("hardhat-solpp:run-solpp", async ({ files, opts }, { config }) => {
    const processedPaths = [];
    const solpp = await Promise.resolve().then(() => __importStar(require("solpp")));
    for (const [filePath, content] of files) {
        const processedFilePath = path_1.default.join(config.paths.cache, exports.PROCESSED_CACHE_DIRNAME, path_1.default.relative(config.paths.sources, filePath));
        await fs_extra_1.default.ensureDir(path_1.default.dirname(processedFilePath));
        const processedCode = await solpp.processCode(content, opts);
        await fs_extra_1.default.writeFile(processedFilePath, processedCode, "utf-8");
        processedPaths.push(processedFilePath);
    }
    return processedPaths;
});
(0, config_1.subtask)(task_names_1.TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS, async (_, { config, run }, runSuper) => {
    const filePaths = await runSuper();
    const files = await readFiles(filePaths);
    const opts = config.solpp;
    return run("hardhat-solpp:run-solpp", { files, opts });
});
//# sourceMappingURL=index.js.map