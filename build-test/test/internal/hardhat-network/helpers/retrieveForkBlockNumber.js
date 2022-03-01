"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveForkBlockNumber = void 0;
const ForkBlockchain_1 = require("../../../../src/internal/hardhat-network/provider/fork/ForkBlockchain");
/* eslint-disable @typescript-eslint/dot-notation */
async function retrieveForkBlockNumber(provider) {
    var _a;
    if (provider["_node"] === undefined) {
        await provider["_init"]();
    }
    const forkBlockchain = (_a = provider["_node"]) === null || _a === void 0 ? void 0 : _a["_blockchain"];
    if (!(forkBlockchain instanceof ForkBlockchain_1.ForkBlockchain)) {
        throw new Error("Provider has not been initialised with forkConfig");
    }
    return forkBlockchain["_forkBlockNumber"].toNumber();
}
exports.retrieveForkBlockNumber = retrieveForkBlockNumber;
//# sourceMappingURL=retrieveForkBlockNumber.js.map