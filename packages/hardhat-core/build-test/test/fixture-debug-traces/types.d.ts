import { RpcDebugTraceOutput, RpcStructLog } from "../../src/internal/hardhat-network/provider/output";
export declare type GethTrace = Omit<RpcDebugTraceOutput, "structLogs"> & {
    structLogs: Array<Omit<RpcStructLog, "memSize">>;
};
export declare type TurboGethTrace = GethTrace;
//# sourceMappingURL=types.d.ts.map