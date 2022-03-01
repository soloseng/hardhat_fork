"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignedTxHash = exports.sendTransactionFromTxParams = exports.sendTxToZeroAddress = exports.deployContract = void 0;
const tx_1 = require("@ethereumjs/tx");
const ethereumjs_util_1 = require("ethereumjs-util");
const base_types_1 = require("../../../../src/internal/core/jsonrpc/types/base-types");
const providers_1 = require("./providers");
const getPendingBaseFeePerGas_1 = require("./getPendingBaseFeePerGas");
const retrieveCommon_1 = require("./retrieveCommon");
async function deployContract(provider, deploymentCode, from = providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0]) {
    const hash = await provider.send("eth_sendTransaction", [
        {
            from,
            data: deploymentCode,
            gas: (0, base_types_1.numberToRpcQuantity)(providers_1.DEFAULT_BLOCK_GAS_LIMIT),
        },
    ]);
    const { contractAddress } = await provider.send("eth_getTransactionReceipt", [
        hash,
    ]);
    return contractAddress;
}
exports.deployContract = deployContract;
async function sendTxToZeroAddress(provider, from) {
    const accounts = await provider.send("eth_accounts");
    const burnTxParams = {
        from: from !== null && from !== void 0 ? from : accounts[0],
        to: (0, ethereumjs_util_1.zeroAddress)(),
        value: (0, base_types_1.numberToRpcQuantity)(1),
        gas: (0, base_types_1.numberToRpcQuantity)(21000),
        gasPrice: (0, base_types_1.numberToRpcQuantity)(await (0, getPendingBaseFeePerGas_1.getPendingBaseFeePerGas)(provider)),
    };
    return provider.send("eth_sendTransaction", [burnTxParams]);
}
exports.sendTxToZeroAddress = sendTxToZeroAddress;
async function sendTransactionFromTxParams(provider, txParams) {
    const rpcTxParams = {
        from: (0, ethereumjs_util_1.bufferToHex)(txParams.from),
        data: (0, ethereumjs_util_1.bufferToHex)(txParams.data),
        nonce: (0, base_types_1.numberToRpcQuantity)(txParams.nonce),
        value: (0, base_types_1.numberToRpcQuantity)(txParams.value),
        gas: (0, base_types_1.numberToRpcQuantity)(txParams.gasLimit),
    };
    if ("accessList" in txParams) {
        rpcTxParams.accessList = txParams.accessList.map(([address, storageKeys]) => ({
            address: (0, ethereumjs_util_1.bufferToHex)(address),
            storageKeys: storageKeys.map(ethereumjs_util_1.bufferToHex),
        }));
    }
    if ("gasPrice" in txParams) {
        rpcTxParams.gasPrice = (0, base_types_1.numberToRpcQuantity)(txParams.gasPrice);
    }
    else {
        rpcTxParams.maxFeePerGas = (0, base_types_1.numberToRpcQuantity)(txParams.maxFeePerGas);
        rpcTxParams.maxPriorityFeePerGas = (0, base_types_1.numberToRpcQuantity)(txParams.maxPriorityFeePerGas);
    }
    if (txParams.to !== undefined) {
        rpcTxParams.to = (0, ethereumjs_util_1.bufferToHex)(txParams.to);
    }
    return provider.send("eth_sendTransaction", [rpcTxParams]);
}
exports.sendTransactionFromTxParams = sendTransactionFromTxParams;
async function getSignedTxHash(hardhatNetworkProvider, txParams, signerAccountIndex) {
    const txToSign = new tx_1.Transaction(txParams, {
        common: await (0, retrieveCommon_1.retrieveCommon)(hardhatNetworkProvider),
    });
    const signedTx = txToSign.sign((0, ethereumjs_util_1.toBuffer)(providers_1.DEFAULT_ACCOUNTS[signerAccountIndex].privateKey));
    return (0, ethereumjs_util_1.bufferToHex)(signedTx.hash());
}
exports.getSignedTxHash = getSignedTxHash;
//# sourceMappingURL=transactions.js.map