"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = __importDefault(require("@ethereumjs/common"));
const chai_1 = require("chai");
const hardforks_1 = require("../../../src/internal/util/hardforks");
const errors_1 = require("../../helpers/errors");
const errors_list_1 = require("../../../src/internal/core/errors-list");
describe("Hardfork utils", function () {
    describe("HardforkName", function () {
        it("Only has hardforks that ethereumjs recognizes", function () {
            for (const name of Object.values(hardforks_1.HardforkName)) {
                chai_1.assert.doesNotThrow(() => new common_1.default({ chain: "mainnet", hardfork: name }));
            }
        });
    });
    describe("getHardforkName", function () {
        it("Throws on invalid hardforks", function () {
            (0, errors_1.expectHardhatError)(() => {
                (0, hardforks_1.getHardforkName)("asd");
            }, errors_list_1.ERRORS.GENERAL.ASSERTION_ERROR);
            (0, errors_1.expectHardhatError)(() => {
                (0, hardforks_1.getHardforkName)("berling");
            }, errors_list_1.ERRORS.GENERAL.ASSERTION_ERROR);
        });
        it("Returns the right hardfork name", function () {
            chai_1.assert.equal("spuriousDragon", hardforks_1.HardforkName.SPURIOUS_DRAGON);
            chai_1.assert.equal("byzantium", hardforks_1.HardforkName.BYZANTIUM);
            chai_1.assert.equal("berlin", hardforks_1.HardforkName.BERLIN);
            chai_1.assert.equal("london", hardforks_1.HardforkName.LONDON);
            chai_1.assert.equal("arrowGlacier", hardforks_1.HardforkName.ARROW_GLACIER);
        });
    });
    describe("hardforkGte", function () {
        it("Should return the right result for each pair of HFs", function () {
            const common = new common_1.default({ chain: "mainnet" });
            for (const hfa of Object.values(hardforks_1.HardforkName)) {
                for (const hfb of Object.values(hardforks_1.HardforkName)) {
                    chai_1.assert.equal((0, hardforks_1.hardforkGte)(hfa, hfb), common.hardforkGteHardfork(hfa, hfb));
                }
            }
        });
    });
});
//# sourceMappingURL=hardforks.js.map