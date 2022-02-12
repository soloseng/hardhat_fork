import { ModulesLogger } from "../../../../src/internal/hardhat-network/provider/modules/logger";
export declare class FakeModulesLogger extends ModulesLogger {
    lines: string[];
    constructor(enabled: boolean);
    getOutput(): string;
    reset(): void;
}
//# sourceMappingURL=fakeLogger.d.ts.map