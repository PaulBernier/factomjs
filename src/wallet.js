const {
    isValidAddress
} = require('factomjs-util');

function getAddress(walletd, address) {
    return walletd.address(address);
}

function getPrivateAddress(walletd, address) {
    if (!isValidAddress(address)) {
        throw `${address} is not a valid address`;
    }

    if (['Es', 'Fs'].includes(address.substring(0, 2))) {
        return address;
    }

    return getAddress(walletd, address)
        .then(r => r.secret);
}

module.exports = {
    getAddress,
    getPrivateAddress
};