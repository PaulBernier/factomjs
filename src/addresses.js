const base58 = require('base-58'),
    { RCD_TYPE_1, privateKeyToPublicKey, sha256d } = require('./util');

const FACTOID_PUBLIC_PREFIX = Buffer.from('5fb1', 'hex'),
    FACTOID_PRIVATE_PREFIX = Buffer.from('6478', 'hex'),
    ENTRYCREDIT_PUBLIC_PREFIX = Buffer.from('592a', 'hex'),
    ENTRYCREDIT_PRIVATE_PREFIX = Buffer.from('5db6', 'hex');

const VALID_PREFIXES = ['Fs', 'FA', 'EC', 'Es'];

function isValidAddress(address) {
    try {
        if (!VALID_PREFIXES.includes(address.slice(0, 2))) {
            return false;
        }

        const bytes = Buffer.from(base58.decode(address));
        if (bytes.length !== 38) {
            return false;
        }

        const checksum = sha256d(bytes.slice(0, 34)).slice(0, 4);
        if (checksum.equals(bytes.slice(34, 38))) {
            return true;
        }

        return false;
    } catch (err) {
        return false;
    }
}


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
        throw new Error(`Invalid address ${address}`);
    }

    if (address[1] !== 's') {
        return address;
    }

    const secret = base58.decode(address).slice(2, 34);
    const pub = privateKeyToPublicKey(secret);

    const publicAddress = address[0] === 'F' ? Buffer.concat([FACTOID_PUBLIC_PREFIX, keyToRCD1(pub)]) : Buffer.concat([ENTRYCREDIT_PUBLIC_PREFIX, pub]);
    const checksum = sha256d(publicAddress).slice(0, 4);
    return base58.encode(Buffer.concat([publicAddress, checksum]));
}

function keyToRCD1(key) {
    return sha256d(Buffer.concat([RCD_TYPE_1, key]));
}

function addressToKey(address) {
    if (!isValidAddress(address)) {
        throw new Error(`Invalid address ${address}`);
    }
    return Buffer.from(base58.decode(address).slice(2, 34));
}

module.exports = {
    isValidAddress,
    addressToKey,
    isValidPublicAddress,
    isValidEcAddress,
    isValidEcPublicAddress,
    isValidEcPrivateAddress,
    isValidFctAddress,
    isValidFctPublicAddress,
    isValidFctPrivateAddress,
    getPublicAddress
};