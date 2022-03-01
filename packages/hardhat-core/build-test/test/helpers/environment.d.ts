import { HardhatRuntimeEnvironment } from "../../src/types";
declare module "mocha" {
    interface Context {
        env: HardhatRuntimeEnvironment;
    }
}
export declare function useEnvironment(configPath?: string): void;
//# sourceMappingURL=environment.d.ts.map