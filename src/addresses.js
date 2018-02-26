const EdDSA = require('elliptic').eddsa,
    crypto = require('crypto'),
    {
        isValidAddress,
        privateHumanAddressStringToPrivate,
        publicECKeyToHumanAddress,
        publicFactoidKeyToHumanAddress
    } = require('factomjs-util');

const ec = new EdDSA('ed25519');

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

function getPublicAddress(address) {
    if (!isValidAddress(address)) {
        throw `Invalid address ${address}`;
    }

    const prefix = address.substring(0, 2);
    if (['EC', 'FA'].includes(prefix)) {
        return address;
    }

    const secret = privateHumanAddressStringToPrivate(address);
    const key = ec.keyFromSecret(secret);
    const pub = Buffer.from(key.getPublic());

    return prefix[0] === 'F' ? publicFactoidKeyToHumanAddress(pub) : publicECKeyToHumanAddress(pub);
}

module.exports = {
    isValidEcAddress,
    isValidEcPublicAddress,
    isValidEcPrivateAddress,
    isValidFctAddress,
    isValidAddress,
    getPublicAddress
};