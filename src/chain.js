const sign = require('tweetnacl/nacl-fast').sign,
    { addressToKey, isValidPrivateEcAddress, isValidPublicEcAddress } = require('./addresses'),
    { Entry } = require('./entry'),
    { sha256, sha256d } = require('./util'),
    { CHAIN_CREATION_COST } = require('./constant');

/**********************
 * Chain class
 **********************/

/**
 * Class representing a Chain.
 * @param {Entry|Chain} arg - First entry of the chain or another chain to copy.
 * @property {Buffer} id - Chain ID.
 * @property {Entry} firstEntry - First entry of the chain.
 */
class Chain {
    constructor(arg) {
        if (arg instanceof Entry) {
            const chainId = computeChainId(arg);
            this.firstEntry = Entry.builder(arg)
                .chainId(chainId)
                .build();
            this.id = chainId;
        } else if (arg.firstEntry instanceof Entry) {
            const chainId = computeChainId(arg.firstEntry);
            this.firstEntry = Entry.builder(arg.firstEntry)
                .chainId(chainId)
                .build();
            this.id = chainId;
        } else {
            throw new Error('Argument of Chain constructor must be an instance of Entry or Chain.');
        }
        Object.freeze(this);
    }

    /**
     * @returns {string} - Chain ID as a hex encoded string.
     */
    get idHex() {
        return this.id.toString('hex');
    }

    /**
     * Get Entry Credit cost of the chain.
     * @returns {number} - Entry Credit cost of the chain.
     */
    ecCost() {
        return CHAIN_CREATION_COST + this.firstEntry.ecCost();
    }

    /**
     * Convert to a JavaScript Object representation of the chain.
     * @returns {Object} JavaScript object representing the chain.
     */
    toObject() {
        return {
            firstEntry: this.firstEntry.toObject(),
            id: this.idHex
        };
    }
}

/**********************
 * Compose
 **********************/


/**
 * Compose the commit of a Chain, that can then be used as input of the factomd API `commit-chain`.
 * Note that if the chain first entry doesn't have a timestamp set the library will use Date.now() as the default for the commit timestamp.
 * @param {Chain} chain - Chain to compose the commit of.
 * @param {string} ecAddress - Entry Credit address that pays for the commit, either private (Es) or public (EC). 
 * If a public EC address is provided it is necessary to provide the signature of the commit as a 3rd argument (use case for hardware wallets)
 * @param {string|Buffer} [signature] - Optional signature of the commit (composeChainLedger). Only necessary if a public EC address was passed as 2nd argument.
 * @returns {Buffer} - Chain commit.
 */
function composeChainCommit(chain, ecAddress, signature) {
    validateChainInstance(chain);

    const buffer = composeChainLedger(chain);
    let ecPublicKey, sig;

    if (isValidPrivateEcAddress(ecAddress)) {
        // Sign commit
        const secret = addressToKey(ecAddress);
        const key = sign.keyPair.fromSeed(secret);
        ecPublicKey = Buffer.from(key.publicKey);
        sig = Buffer.from(sign.detached(buffer, key.secretKey));
    } else if (isValidPublicEcAddress(ecAddress)) {
        // Verify the signature manually provided
        if (!signature) {
            throw new Error('Signature of the commit missing.');
        }
        ecPublicKey = addressToKey(ecAddress);
        sig = Buffer.from(signature, 'hex');
        if (!sign.detached.verify(buffer, sig, ecPublicKey)) {
            throw new Error('Invalid signature manually provided for the chain commit. (first entry timestamp not fixed?)');
        }
    } else {
        throw new Error(`${ecAddress} is not a valid EC address`);
    }

    return Buffer.concat([buffer, ecPublicKey, sig]);
}

function composeChainLedger(chain) {
    validateChainInstance(chain);

    const firstEntry = chain.firstEntry;
    const entryHash = firstEntry.hash();
    const buffer = Buffer.alloc(104);

    buffer.writeInt8(0);
    buffer.writeIntBE(firstEntry.timestamp || Date.now(), 1, 6);
    const chainIdHash = sha256d(chain.id);
    chainIdHash.copy(buffer, 7);
    const commitWeld = sha256d(Buffer.concat([entryHash, chain.id]));
    commitWeld.copy(buffer, 39);
    entryHash.copy(buffer, 71);
    buffer.writeInt8(chain.ecCost(), 103);

    return buffer;
}

/**
 * Compose the reveal of a Chain, that can then be used as input of the factomd API `reveal-chain`.
 * @param {Chain} chain - Chain to compose the reveal of.
 * @returns {Buffer} - Chain reveal.
 */
function composeChainReveal(chain) {
    validateChainInstance(chain);
    return chain.firstEntry.marshalBinary();
}

/**
 * Compose the commit and reveal of a Chain, that can then be used as inputs of the factomd APIs `commit-chain` and `reveal-chain`.
 * @param {Chain} chain - Chain to compose the commit and reveal of.
 * @param {string} ecAddress - Entry Credit address that pays for the commit, either private (Es) or public (EC). 
 * If a public EC address is provided it is necessary to manually pass the signature of the commit as a 3rd argument (use case for hardware wallets)
 * @param {string|Buffer} [signature] - Optional signature of the commit (composeChainLedger). Only necessary if a public EC address was passed as 2nd argument.
 * @returns {{commit:Buffer, reveal:Buffer}} - Chain commit and reveal.
 */
function composeChain(chain, ecAddress, signature) {
    validateChainInstance(chain);

    return {
        commit: composeChainCommit(chain, ecAddress, signature),
        reveal: composeChainReveal(chain)
    };
}

/**********************
 * Other functions
 **********************/

function validateChainInstance(chain) {
    if (!(chain instanceof Chain)) {
        throw new Error('Argument must be an instance of Chain');
    }
}

/**
 * Compute the transaction ID of the Chain commit. The transaction ID is dependent on the timestamp set in the chain first entry.
 * Note that if the timestamp is not set the library uses Date.now() as the default, changing the result of this function if called at different times. 
 * @param {Chain} chain 
 * @returns {Buffer} - The transaction id of the Chain commit.
 */
function computeChainTxId(chain) {
    validateChainInstance(chain);
    return sha256(composeChainLedger(chain));
}

/**
 * Compute the ID of a Chain provided its first entry.
 * @param {Entry} firstEntry - The first entry of the chain. 
 * @returns {Buffer} - Chain ID.
 */
function computeChainId(firstEntry) {
    const extIdsHashes = firstEntry.extIds.map(sha256);
    const hashes = Buffer.concat(extIdsHashes);
    return sha256(hashes);
}

module.exports = {
    Chain,
    computeChainTxId,
    computeChainId,
    composeChainCommit,
    composeChainReveal,
    composeChain,
    composeChainLedger,
    validateChainInstance
};
