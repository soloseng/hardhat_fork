"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertEqualTraces = void 0;
const chai_1 = require("chai");
function assertEqualTraces(expected, actual) {
    chai_1.assert.equal(actual.failed, expected.failed);
    chai_1.assert.equal(actual.gas, expected.gas);
    // geth doesn't seem to include the returnValue
    // assert.equal(actual.returnValue, expected.returnValue);
    chai_1.assert.equal(actual.structLogs.length, expected.structLogs.length);
    for (const [i, log] of expected.structLogs.entries()) {
        // we ignore the gasCost of the last step because
        // we don't guarantee that it's correct
        if (i === expected.structLogs.length - 1) {
            actual.structLogs[i].gasCost = 0;
            log.gasCost = 0;
        }
        chai_1.assert.deepEqual(actual.structLogs[i], log, `Different logs at ${i} (opcode: ${log.op}, gas: ${log.gas})`);
    }
}
exports.assertEqualTraces = assertEqualTraces;
//# sourceMappingURL=assertEqualTraces.js.map