"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeModulesLogger = void 0;
const logger_1 = require("../../../../src/internal/hardhat-network/provider/modules/logger");
class FakeModulesLogger extends logger_1.ModulesLogger {
    constructor(enabled) {
        super(enabled, (line) => {
            this.lines.push(line);
        }, (line) => {
            this.lines[this.lines.length - 1] = line;
        });
        this.lines = [];
    }
    getOutput() {
        return this.lines.join("\n");
    }
    reset() {
        this.lines = [];
    }
}
exports.FakeModulesLogger = FakeModulesLogger;
//# sourceMappingURL=fakeLogger.js.map