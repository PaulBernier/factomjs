const { isValidAddress } = require('./addresses');
const { PRIVATE_ADDRESS_VALID_PREFIXES } = require('./constant');

function getAddress(walletd, address) {
    return walletd.call('address', { address: address });
}

function getPrivateAddress(walletd, address) {
    if (!isValidAddress(address)) {
        throw new Error(`${address} is not a valid address`);
    }

    if (PRIVATE_ADDRESS_VALID_PREFIXES.has(address.substring(0, 2))) {
        return address;
    }

    return getAddress(walletd, address)
        .then(r => r.secret);
}

module.exports = {
    getAddress,
    getPrivateAddress
};