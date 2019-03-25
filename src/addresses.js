const base58 = require('base-58'),
    nacl = require('tweetnacl/nacl-fast'),
    { RCD_TYPE_1, secretToPublicKey, sha256d } = require('./util');

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

/**
 * Validate that an address is valid (well formed).
 * @param {string} address - Address to validate
 * @returns {boolean} - True if the address is valid.
 */
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

/**
 * Validate if an address is a valid public EC or FCT address.
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid public EC or FCT address.
 */
function isValidPublicAddress(address) {
    return isValidAddress(address) && PUBLIC_ADDRESS_VALID_PREFIXES.has(address.substring(0, 2));
}

/**
 * Validate if an address is a valid private EC or FCT address.
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid private EC or FCT address.
 */
function isValidPrivateAddress(address) {
    return isValidAddress(address) && PRIVATE_ADDRESS_VALID_PREFIXES.has(address.substring(0, 2));
}

/**
 * Validate if an address is a valid EC address (public or private).
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid EC address.
 */
function isValidEcAddress(address) {
    return isValidAddress(address) && EC_ADDRESS_VALID_PREFIXES.has(address.substring(0, 2));
}

/**
 * Validate if an address is a valid public EC address.
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid public EC address.
 */
function isValidPublicEcAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'EC';
}

/**
 * Validate if an address is a valid private EC address.
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid private EC address.
 */
function isValidPrivateEcAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'Es';
}

/**
 * Validate if an address is a valid FCT address (public or private).
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid FCT address.
 */
function isValidFctAddress(address) {
    return isValidAddress(address) && FCT_ADDRESS_VALID_PREFIXES.has(address.substring(0, 2));
}

/**
 * Validate if an address is a valid public FCT address.
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid public FCT address.
 */
function isValidPublicFctAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'FA';
}

/**
 * Validate if an address is a valid private FCT address.
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid private FCT address.
 */
function isValidPrivateFctAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'Fs';
}

/**
 * Get public address corresponding to an address.
 * @param {string} address - Any address.
 * @returns {string} - Public address.
 */
function getPublicAddress(address) {
    if (!isValidAddress(address)) {
        throw new Error(`Invalid address ${address}.`);
    }

    if (address[1] !== 's') {
        return address;
    }

    const secret = base58.decode(address).slice(2, 34);
    const pub = secretToPublicKey(secret);

    return address[0] === 'F' ? keyToPublicFctAddress(pub) : keyToPublicEcAddress(pub);
}

/**
 * Extract the key contained in an address. Cannot be used with public FCT address as those contain a RCD hash and not a key (See {@link addressToRcdHash}).
 * @param {string} address - Any address, except public FCT address.
 * @returns {Buffer} - Key contained in the address.
 */
function addressToKey(address) {
    if (!isValidAddress(address)) {
        throw new Error(`Invalid address ${address}.`);
    }
    if (address.startsWith('FA')) {
        throw new Error(
            'A public Factoid address does not hold a public key but a RCD hash. Use addressToRcdHash function instead.'
        );
    }
    return Buffer.from(base58.decode(address).slice(2, 34));
}

/**
 * Extract the RCD hash from a public FCT address.
 * @param {string} address - Public FCT address.
 * @returns {Buffer} - RCD hash.
 */
function addressToRcdHash(address) {
    if (!isValidPublicFctAddress(address)) {
        throw new Error(`Address ${address} is not a valid public Factoid address`);
    }
    return Buffer.from(base58.decode(address).slice(2, 34));
}

/**
 * Build a human readable public FCT address from a key.
 * @param {Buffer|string} key
 * @returns {string} - Public FCT address.
 */
function keyToPublicFctAddress(key) {
    return keyToAddress(key, FACTOID_PUBLIC_PREFIX, true);
}

/**
 * Build a human readable public FCT address from a RCD hash.
 * @param {Buffer|string} rcdHash
 * @returns {string} - Public FCT address.
 */
function rcdHashToPublicFctAddress(rcdHash) {
    return keyToAddress(rcdHash, FACTOID_PUBLIC_PREFIX);
}

/**
 * Build a human readable private FCT address from a 32-byte seed.
 * @param {Buffer|string} seed 32-byte seed.
 * @returns {string} - Private FCT address.
 */
function seedToPrivateFctAddress(seed) {
    return keyToAddress(seed, FACTOID_PRIVATE_PREFIX);
}

/**
 * Build a human readable public EC address from a 32-byte key.
 * @param {Buffer|string} key 32-byte key.
 * @returns {string} - Public EC address.
 */
function keyToPublicEcAddress(key) {
    return keyToAddress(key, ENTRYCREDIT_PUBLIC_PREFIX);
}

/**
 * Build a human readable private EC address from a 32-byte seed.
 * @param {Buffer|string} seed 32-byte seed.
 * @returns {string} - Private EC address.
 */
function seedToPrivateEcAddress(seed) {
    return keyToAddress(seed, ENTRYCREDIT_PRIVATE_PREFIX);
}

function keyToAddress(key, prefix, computeRCDHash) {
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== 32) {
        throw new Error(`Key ${keyBuffer} is not 32 bytes long.`);
    }

    const address = Buffer.concat([prefix, computeRCDHash ? keyToRCD1Hash(keyBuffer) : keyBuffer]);
    const checksum = sha256d(address).slice(0, 4);
    return base58.encode(Buffer.concat([address, checksum]));
}

function keyToRCD1Hash(key) {
    return sha256d(Buffer.concat([RCD_TYPE_1, key]));
}

/**
 * Generate a new random FCT address pair (private and public).
 * @returns {{public: string, private: string}} - Public and private FCT addresses.
 */
function generateRandomFctAddress() {
    const seed = nacl.randomBytes(32);
    const keyPair = nacl.sign.keyPair.fromSeed(seed);
    return {
        public: keyToPublicFctAddress(keyPair.publicKey),
        private: seedToPrivateFctAddress(seed)
    };
}

/**
 * Generate a new random EC address pair (private and public).
 * @returns {{public: string, private: string}} - Public and private EC addresses.
 */
function generateRandomEcAddress() {
    const seed = nacl.randomBytes(32);
    const keyPair = nacl.sign.keyPair.fromSeed(seed);
    return {
        public: keyToPublicEcAddress(keyPair.publicKey),
        private: seedToPrivateEcAddress(seed)
    };
}

module.exports = {
    isValidAddress,
    addressToKey,
    addressToRcdHash,
    isValidPublicAddress,
    isValidPrivateAddress,
    isValidEcAddress,
    isValidPublicEcAddress,
    isValidPrivateEcAddress,
    isValidFctAddress,
    isValidPublicFctAddress,
    isValidPrivateFctAddress,
    getPublicAddress,
    keyToPublicFctAddress,
    rcdHashToPublicFctAddress,
    seedToPrivateFctAddress,
    keyToPublicEcAddress,
    seedToPrivateEcAddress,
    generateRandomFctAddress,
    generateRandomEcAddress
};
