const base58 = require('base-58'),
    { RCD_TYPE_1, privateKeyToPublicKey, sha256d } = require('./util');

const {
    FACTOID_PUBLIC_PREFIX,
    FACTOID_PRIVATE_PREFIX,
    ENTRYCREDIT_PUBLIC_PREFIX,
    ENTRYCREDIT_PRIVATE_PREFIX,
    VALID_PREFIXES,
    PUBLIC_ADDRESS_VALID_PREFIXES,
    PRIVATE_ADDRESS_VALID_PREFIXES,
    EC_ADDRESS_VALID_PREFIXES,
    FCT_ADDRESS_VALID_PREFIXES
} = require('./constant');

function isValidAddress(address) {
    try {
        if (!VALID_PREFIXES.has(address.slice(0, 2))) {
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
    return isValidAddress(address) && PUBLIC_ADDRESS_VALID_PREFIXES.has(address.substring(0, 2));
}

function isValidPrivateAddress(address) {
    return isValidAddress(address) && PRIVATE_ADDRESS_VALID_PREFIXES.has(address.substring(0, 2));
}


function isValidEcAddress(address) {
    return isValidAddress(address) && EC_ADDRESS_VALID_PREFIXES.has(address.substring(0, 2));
}

function isValidEcPublicAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'EC';
}

function isValidEcPrivateAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'Es';
}

function isValidFctAddress(address) {
    return isValidAddress(address) && FCT_ADDRESS_VALID_PREFIXES.has(address.substring(0, 2));
}

function isValidFctPublicAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'FA';
}

function isValidFctPrivateAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'Fs';
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

    return address[0] === 'F' ? keyToPublicFctAddress(pub) : keyToPublicEcAddress(pub);
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

function keyToAddress(key, prefix, computeRCD) {
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== 32) {
        throw new Error(`Key ${keyBuffer} is not 32 bytes long.`);
    }

    const address = Buffer.concat([prefix, computeRCD ? keyToRCD1(keyBuffer) : keyBuffer]);
    const checksum = sha256d(address).slice(0, 4);
    return base58.encode(Buffer.concat([address, checksum]));
}

function keyToPublicFctAddress(key) {
    return keyToAddress(key, FACTOID_PUBLIC_PREFIX, true);
}

function rcdHashToPublicFctAddress(rcdHash) {
    return keyToAddress(rcdHash, FACTOID_PUBLIC_PREFIX);
}

function keyToPrivateFctAddress(key) {
    return keyToAddress(key, FACTOID_PRIVATE_PREFIX);
}

function keyToPublicEcAddress(key) {
    return keyToAddress(key, ENTRYCREDIT_PUBLIC_PREFIX);
}

function keyToPrivateEcAddress(key) {
    return keyToAddress(key, ENTRYCREDIT_PRIVATE_PREFIX);
}

module.exports = {
    isValidAddress,
    addressToKey,
    isValidPublicAddress,
    isValidPrivateAddress,
    isValidEcAddress,
    isValidEcPublicAddress,
    isValidEcPrivateAddress,
    isValidFctAddress,
    isValidFctPublicAddress,
    isValidFctPrivateAddress,
    getPublicAddress,
    keyToPublicFctAddress,
    rcdHashToPublicFctAddress,
    keyToPrivateFctAddress,
    keyToPublicEcAddress,
    keyToPrivateEcAddress
};