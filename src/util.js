const crypto = require('crypto'),
    {
        isValidAddress
    } = require('factomjs-util');

function sha256(data) {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest();
}

function sha256d(data) {
    return sha256(sha256(data));
}

function sha512(data) {
    const hash = crypto.createHash('sha512');
    hash.update(data);
    return hash.digest();
}

function toHex(arg) {
    return Buffer.isBuffer(arg) ? arg.toString('hex') : arg;
}

function isValidEcAddress(address) {
    return isValidAddress(address) && ['EC', 'Es'].includes(address.substring(0, 2));
}

function isValidEcPublicAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'EC';
}

function isValidEcPrivateAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'Es';
}

function isValidFctAddress(address) {
    return isValidAddress(address) && ['FA', 'Fs'].includes(address.substring(0, 2));
}

module.exports = {
    sha256,
    sha512,
    sha256d,
    toHex,
    isValidEcAddress,
    isValidEcPublicAddress,
    isValidEcPrivateAddress,
    isValidFctAddress
};