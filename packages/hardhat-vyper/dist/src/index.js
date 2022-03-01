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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = __importStar(require("os"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const semver_1 = __importDefault(require("semver"));
const glob_1 = require("hardhat/internal/util/glob");
const global_dir_1 = require("hardhat/internal/util/global-dir");
const source_names_1 = require("hardhat/utils/source-names");
const contract_names_1 = require("hardhat/utils/contract-names");
const task_names_1 = require("hardhat/builtin-tasks/task-names");
const config_1 = require("hardhat/config");
const task_names_2 = require("./task-names");
const constants_1 = require("./constants");
const cache_1 = require("./cache");
const compiler_1 = require("./compiler");
const downloader_1 = require("./downloader");
const parser_1 = require("./parser");
const resolver_1 = require("./resolver");
const util_1 = require("./util");
require("./type-extensions");
const log = (0, util_1.getLogger)("tasks:compile");
(0, config_1.extendConfig)((config, userConfig) => {
    var _a;
    const userVyperConfig = (_a = userConfig.vyper) !== null && _a !== void 0 ? _a : constants_1.DEFAULT_VYPER_VERSION;
    config.vyper = (0, util_1.normalizeVyperConfig)(userVyperConfig);
});
(0, config_1.subtask)(task_names_1.TASK_COMPILE_GET_COMPILATION_TASKS, async (_, __, runSuper) => {
    const otherTasks = await runSuper();
    return [...otherTasks, task_names_2.TASK_COMPILE_VYPER];
});
(0, config_1.subtask)(task_names_2.TASK_COMPILE_VYPER_GET_SOURCE_PATHS, async (_, { config }) => {
    const vyPaths = await (0, glob_1.glob)(path_1.default.join(config.paths.sources, "**/*.vy"));
    const vpyPaths = await (0, glob_1.glob)(path_1.default.join(config.paths.sources, "**/*.v.py"));
    return [...vyPaths, ...vpyPaths];
});
(0, config_1.subtask)(task_names_2.TASK_COMPILE_VYPER_GET_SOURCE_NAMES)
    .addParam("sourcePaths", undefined, undefined, config_1.types.any)
    .setAction(async ({ sourcePaths }, { config }) => {
    const sourceNames = await Promise.all(sourcePaths.map((p) => (0, source_names_1.localPathToSourceName)(config.paths.root, p)));
    return sourceNames;
});
(0, config_1.subtask)(task_names_2.TASK_COMPILE_VYPER_READ_FILE)
    .addParam("absolutePath", undefined, undefined, config_1.types.string)
    .setAction(async ({ absolutePath }) => {
    const content = await fs_extra_1.default.readFile(absolutePath, {
        encoding: "utf8",
    });
    return content;
});
(0, config_1.subtask)(task_names_2.TASK_COMPILE_VYPER_GET_BUILD)
    .addParam("quiet", undefined, undefined, config_1.types.boolean)
    .addParam("vyperVersion", undefined, undefined, config_1.types.string)
    .setAction(async ({ quiet, vyperVersion }, { run }) => {
    const compilersCache = await (0, global_dir_1.getCompilersDir)();
    const downloader = new downloader_1.CompilerDownloader(compilersCache);
    await downloader.initCompilersList();
    const isDownloaded = downloader.isCompilerDownloaded(vyperVersion);
    await run(task_names_2.TASK_COMPILE_VYPER_LOG_DOWNLOAD_COMPILER_START, {
        vyperVersion,
        isDownloaded,
        quiet,
    });
    const compilerPath = await downloader.getOrDownloadCompiler(vyperVersion);
    if (compilerPath === undefined) {
        throw new util_1.VyperPluginError("Can't download vyper compiler");
    }
    await run(task_names_2.TASK_COMPILE_VYPER_LOG_DOWNLOAD_COMPILER_END, {
        vyperVersion,
        isDownloaded,
        quiet,
    });
    return { compilerPath, version: vyperVersion };
});
(0, config_1.subtask)(task_names_2.TASK_COMPILE_VYPER_LOG_DOWNLOAD_COMPILER_START)
    .addParam("quiet", undefined, undefined, config_1.types.boolean)
    .addParam("isDownloaded", undefined, undefined, config_1.types.boolean)
    .addParam("vyperVersion", undefined, undefined, config_1.types.string)
    .setAction(async ({ quiet, isDownloaded, vyperVersion, }) => {
    if (isDownloaded || quiet)
        return;
    console.log(`Downloading compiler ${vyperVersion}`);
});
(0, config_1.subtask)(task_names_2.TASK_COMPILE_VYPER_LOG_DOWNLOAD_COMPILER_END)
    .addParam("quiet", undefined, undefined, config_1.types.boolean)
    .addParam("isDownloaded", undefined, undefined, config_1.types.boolean)
    .addParam("vyperVersion", undefined, undefined, config_1.types.string)
    .setAction(async ({}) => { });
(0, config_1.subtask)(task_names_2.TASK_COMPILE_VYPER_LOG_COMPILATION_RESULT)
    .addParam("versionGroups", undefined, undefined, config_1.types.any)
    .addParam("quiet", undefined, undefined, config_1.types.boolean)
    .setAction(async ({ versionGroups, quiet, }) => {
    if (quiet || Object.entries(versionGroups).length === 0)
        return;
    console.log("Vyper compilation finished successfully");
});
(0, config_1.subtask)(task_names_2.TASK_COMPILE_VYPER_RUN_BINARY)
    .addParam("inputPaths", undefined, undefined, config_1.types.any)
    .addParam("vyperPath", undefined, undefined, config_1.types.string)
    .setAction(async ({ inputPaths, vyperPath, }) => {
    const compiler = new compiler_1.Compiler(vyperPath);
    const _a = await compiler.compile(inputPaths), { version } = _a, contracts = __rest(_a, ["version"]);
    return Object.assign({ version }, contracts);
});
(0, config_1.subtask)(task_names_2.TASK_COMPILE_VYPER)
    .addParam("quiet", undefined, undefined, config_1.types.boolean)
    .setAction(async ({ quiet }, { artifacts, config, run }) => {
    const sourcePaths = await run(task_names_2.TASK_COMPILE_VYPER_GET_SOURCE_PATHS);
    const sourceNames = await run(task_names_2.TASK_COMPILE_VYPER_GET_SOURCE_NAMES, { sourcePaths });
    const vyperFilesCachePath = (0, cache_1.getVyperFilesCachePath)(config.paths);
    let vyperFilesCache = await cache_1.VyperFilesCache.readFromFile(vyperFilesCachePath);
    const parser = new parser_1.Parser(vyperFilesCache);
    const resolver = new resolver_1.Resolver(config.paths.root, parser, (absolutePath) => run(task_names_2.TASK_COMPILE_VYPER_READ_FILE, { absolutePath }));
    const resolvedFiles = await Promise.all(sourceNames.map(resolver.resolveSourceName));
    vyperFilesCache = await invalidateCacheMissingArtifacts(vyperFilesCache, artifacts, resolvedFiles);
    const configuredVersions = config.vyper.compilers.map(({ version }) => version);
    const versionGroups = {};
    const unmatchedFiles = [];
    for (const file of resolvedFiles) {
        const hasChanged = vyperFilesCache.hasFileChanged(file.absolutePath, file.contentHash, { version: file.content.versionPragma });
        if (!hasChanged)
            continue;
        const maxSatisfyingVersion = semver_1.default.maxSatisfying(configuredVersions, file.content.versionPragma);
        // check if there are files that don't match any configured compiler
        // version
        if (maxSatisfyingVersion === null) {
            unmatchedFiles.push(file);
            continue;
        }
        if (versionGroups[maxSatisfyingVersion] === undefined) {
            versionGroups[maxSatisfyingVersion] = [file];
            continue;
        }
        versionGroups[maxSatisfyingVersion].push(file);
    }
    if (unmatchedFiles.length > 0) {
        const list = unmatchedFiles
            .map((file) => `  * ${file.sourceName} (${file.content.versionPragma})`)
            .join(os.EOL);
        throw new util_1.VyperPluginError(`The Vyper version pragma statement in ${unmatchedFiles.length > 1 ? "these files" : "this file"} doesn't match any of the configured compilers in your config. Change the pragma or configure additional compiler versions in your hardhat config.

${list}`);
    }
    for (const [vyperVersion, files] of Object.entries(versionGroups)) {
        const vyperBuild = await run(task_names_2.TASK_COMPILE_VYPER_GET_BUILD, {
            quiet,
            vyperVersion,
        });
        log(`Compiling ${files.length} files for Vyper version ${vyperVersion}`);
        const _a = await run(task_names_2.TASK_COMPILE_VYPER_RUN_BINARY, {
            inputPaths: files.map(({ absolutePath }) => absolutePath),
            vyperPath: vyperBuild.compilerPath,
        }), { version } = _a, contracts = __rest(_a, ["version"]);
        for (const [sourceName, output] of Object.entries(contracts)) {
            const artifact = (0, util_1.getArtifactFromVyperOutput)(sourceName, output);
            await artifacts.saveArtifactAndDebugFile(artifact);
            const file = files.find((f) => f.sourceName === sourceName);
            (0, util_1.assertPluginInvariant)(file !== undefined, "File should always be found");
            vyperFilesCache.addFile(file.absolutePath, {
                lastModificationDate: file.lastModificationDate.valueOf(),
                contentHash: file.contentHash,
                sourceName: file.sourceName,
                vyperConfig: { version },
                versionPragma: file.content.versionPragma,
                artifacts: [artifact.contractName],
            });
        }
    }
    const allArtifacts = vyperFilesCache.getEntries();
    // We know this is the actual implementation, so we use some
    // non-public methods here.
    const artifactsImpl = artifacts;
    artifactsImpl.addValidArtifacts(allArtifacts);
    await vyperFilesCache.writeToFile(vyperFilesCachePath);
    await run(task_names_2.TASK_COMPILE_VYPER_LOG_COMPILATION_RESULT, {
        versionGroups,
        quiet,
    });
});
/**
 * If a file is present in the cache, but some of its artifacts are missing on
 * disk, we remove it from the cache to force it to be recompiled.
 */
async function invalidateCacheMissingArtifacts(vyperFilesCache, artifacts, resolvedFiles) {
    for (const file of resolvedFiles) {
        const cacheEntry = vyperFilesCache.getEntry(file.absolutePath);
        if (cacheEntry === undefined) {
            continue;
        }
        const { artifacts: emittedArtifacts } = cacheEntry;
        for (const emittedArtifact of emittedArtifacts) {
            const artifactExists = await artifacts.artifactExists((0, contract_names_1.getFullyQualifiedName)(file.sourceName, emittedArtifact));
            if (!artifactExists) {
                log(`Invalidate cache for '${file.absolutePath}' because artifact '${emittedArtifact}' doesn't exist`);
                vyperFilesCache.removeEntry(file.absolutePath);
                break;
            }
        }
    }
    return vyperFilesCache;
}
//# sourceMappingURL=index.js.map