"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hexStripZeros = void 0;
const ethereumjs_util_1 = require("ethereumjs-util");
function hexStripZeros(hexString) {
    return (0, ethereumjs_util_1.addHexPrefix)((0, ethereumjs_util_1.unpadHexString)(hexString));
}
exports.hexStripZeros = hexStripZeros;
//# sourceMappingURL=hexStripZeros.js.map