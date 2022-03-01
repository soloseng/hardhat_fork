import type { Debugger } from "debug";
import type { Artifact } from "hardhat/types/artifacts";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import type { VyperUserConfig, MultiVyperConfig, ContractOutput } from "./types";
export declare function getLogger(suffix: string): Debugger;
export declare class VyperPluginError extends NomicLabsHardhatPluginError {
    constructor(message: string, parent?: Error, shouldBeReported?: boolean);
}
export declare function assertPluginInvariant(invariant: boolean, message: string): asserts invariant;
export declare function normalizeVyperConfig(vyperConfig: VyperUserConfig): MultiVyperConfig;
export declare function getArtifactFromVyperOutput(sourceName: string, output: ContractOutput): Artifact;
//# sourceMappingURL=util.d.ts.map