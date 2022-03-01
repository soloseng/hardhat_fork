import { HardhatRuntimeEnvironment } from "hardhat/types";
declare module "mocha" {
    interface Context {
        env: HardhatRuntimeEnvironment;
    }
}
export declare function assertFileExists(pathToFile: string): void;
export declare function useFixtureProject(projectName: string): void;
export declare function useEnvironment(configPath?: string): void;
export declare function expectVyperErrorAsync(f: () => Promise<any>, errorMessage?: string | RegExp): Promise<void>;
//# sourceMappingURL=helpers.d.ts.map