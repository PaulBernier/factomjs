const { privateKeyToPublicKey } = require('./util'), {
    isValidAddress,
    privateHumanAddressStringToPrivate,
    publicECKeyToHumanAddress,
    publicFactoidKeyToHumanAddress
} = require('factomjs-util');

function isValidPublicAddress(address) {
    return isValidAddress(address) && ['EC', 'FA'].includes(address.substring(0, 2));
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

function isValidFctPrivateAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'Fs';
}

function isValidFctPublicAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'FA';
}

function getPublicAddress(address) {
    if (!isValidAddress(address)) {
        throw `Invalid address ${address}`;
    }

    const prefix = address.substring(0, 2);
    if (['EC', 'FA'].includes(prefix)) {
        return address;
    }

    const secret = privateHumanAddressStringToPrivate(address);
    const pub = privateKeyToPublicKey(secret);

    return prefix[0] === 'F' ? publicFactoidKeyToHumanAddress(pub) : publicECKeyToHumanAddress(pub);
}

module.exports = {
    isValidAddress,
    isValidPublicAddress,
    isValidEcAddress,
    isValidEcPublicAddress,
    isValidEcPrivateAddress,
    isValidFctAddress,
    isValidFctPublicAddress,
    isValidFctPrivateAddress,
    getPublicAddress
};