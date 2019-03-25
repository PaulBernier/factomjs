const { isValidAddress } = require('./addresses');
const { PRIVATE_ADDRESS_VALID_PREFIXES } = require('./constant');

async function getPrivateAddress(walletd, address) {
    if (!isValidAddress(address)) {
        throw new Error(`${address} is not a valid address`);
    }

    if (PRIVATE_ADDRESS_VALID_PREFIXES.has(address.substring(0, 2))) {
        return address;
    }

    const walletAddress = await walletd.call('address', { address: address });
    return walletAddress.secret;
}

module.exports = {
    getPrivateAddress
};
