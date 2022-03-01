"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArtifactFromVyperOutput = exports.normalizeVyperConfig = exports.assertPluginInvariant = exports.VyperPluginError = exports.getLogger = void 0;
const path_1 = __importDefault(require("path"));
const plugins_1 = require("hardhat/plugins");
const constants_1 = require("./constants");
function getLogger(suffix) {
    const debug = require("debug");
    return debug(`${constants_1.DEBUG_NAMESPACE}:${suffix}`);
}
exports.getLogger = getLogger;
class VyperPluginError extends plugins_1.NomicLabsHardhatPluginError {
    constructor(message, parent, shouldBeReported) {
        super("hardhat-vyper", message, parent, shouldBeReported);
    }
}
exports.VyperPluginError = VyperPluginError;
function assertPluginInvariant(invariant, message) {
    if (!invariant) {
        throw new VyperPluginError(message);
    }
}
exports.assertPluginInvariant = assertPluginInvariant;
function normalizeVyperConfig(vyperConfig) {
    if (typeof vyperConfig === "string") {
        return {
            compilers: [
                {
                    version: vyperConfig,
                },
            ],
        };
    }
    if ("version" in vyperConfig) {
        return { compilers: [vyperConfig] };
    }
    return vyperConfig;
}
exports.normalizeVyperConfig = normalizeVyperConfig;
function ensureHexPrefix(hex) {
    return `${/^0x/i.test(hex) ? "" : "0x"}${hex}`;
}
/** Vyper contract names are taken from their file names, so we can convert directly */
function pathToContractName(file) {
    const sourceName = path_1.default.basename(file);
    return sourceName.substring(0, sourceName.indexOf("."));
}
function getArtifactFromVyperOutput(sourceName, output) {
    const contractName = pathToContractName(sourceName);
    return {
        _format: constants_1.ARTIFACT_FORMAT_VERSION,
        contractName,
        sourceName,
        abi: output.abi,
        bytecode: ensureHexPrefix(output.bytecode),
        deployedBytecode: ensureHexPrefix(output.bytecode_runtime),
        linkReferences: {},
        deployedLinkReferences: {},
    };
}
exports.getArtifactFromVyperOutput = getArtifactFromVyperOutput;
//# sourceMappingURL=util.js.map