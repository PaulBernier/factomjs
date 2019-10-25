const naclSign = require('tweetnacl/nacl-fast').sign,
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
 * @param {string} ecAddress - Private Entry Credit address that pays for and sign the commit.
 * @param {string} signature - Deprecated. Use {@link composeChainCommitDelegateSig} instead.
 * @returns {Buffer} - Chain commit.
 */
function composeChainCommit(chain, ecAddress, signature) {
    validateChainInstance(chain);

    const dataToSign = composeChainLedger(chain);
    let ecPublicKey, sig;

    if (isValidPrivateEcAddress(ecAddress)) {
        // Sign commit
        const secret = addressToKey(ecAddress);
        const key = naclSign.keyPair.fromSeed(secret);
        ecPublicKey = Buffer.from(key.publicKey);
        sig = Buffer.from(naclSign.detached(dataToSign, key.secretKey));
    } else if (isValidPublicEcAddress(ecAddress)) {
        // Verify the signature manually provided
        if (!signature) {
            throw new Error('Signature of the commit missing.');
        }
        console.warn(
            'composeChainCommit with signature is deprecated. Use composeEntryCommitDelegateSig.'
        );
        ecPublicKey = addressToKey(ecAddress);
        sig = Buffer.from(signature, 'hex');
        if (!naclSign.detached.verify(dataToSign, sig, ecPublicKey)) {
            throw new Error(
                'Invalid signature manually provided for the chain commit. (first entry timestamp not fixed?)'
            );
        }
    } else {
        throw new Error(`${ecAddress} is not a valid EC address`);
    }

    return Buffer.concat([dataToSign, ecPublicKey, sig]);
}

/**
 * Compose the commit of a Chain using an external signing function.
 * The commit can then be sent through factomd API `commit-chain`.
 * @param {Chain} chain - Chain to compose the commit of.
 * @param {string} ecPublicAddress - Public Entry Credit address that pays for the commit.
 * @param {function(Buffer, string): (Buffer | string | Promise<Buffer | string>)} sign - Signing function.
 * Takes as input the data to sign with the EC public key paying for the commmit
 * and should return its signature as a Buffer or a hex encoded string (or a Promise of those).
 * The returned signature must have been made by the private key corresponding to the ecPublicAddress argument.
 * @returns {Buffer} - Chain commit.
 * @async
 */
async function composeChainCommitDelegateSig(chain, ecPublicAddress, sign) {
    validateChainInstance(chain);
    if (!isValidPublicEcAddress(ecPublicAddress)) {
        throw new Error(`${ecPublicAddress} is not a valid public EC address`);
    }
    if (typeof sign !== 'function') {
        throw new Error('sign must be a function');
    }

    const dataToSign = composeChainLedger(chain);
    const signature = Buffer.from(await sign(dataToSign, ecPublicAddress), 'hex');
    const ecPublicKey = addressToKey(ecPublicAddress);

    if (!naclSign.detached.verify(dataToSign, signature, ecPublicKey)) {
        throw new Error(
            'Invalid signature manually returned by the signing function for the chain commit.'
        );
    }

    return Buffer.concat([dataToSign, ecPublicKey, signature]);
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
 * @param {string} ecAddress - Private Entry Credit address that pays for and sign the commit.
 * @param {string} signature - Deprecated. Use {@link composeChainDelegateSig} instead.
 * @returns {{commit:Buffer, reveal:Buffer}} - Chain commit and reveal.
 */
function composeChain(chain, ecAddress, signature) {
    return {
        commit: composeChainCommit(chain, ecAddress, signature),
        reveal: composeChainReveal(chain)
    };
}

/**
 * Compose the commit and reveal of a Chain using an external signing function for the commit.
 * The result can then be used as inputs of the factomd APIs `commit-chain` and `reveal-chain`.
 * @param {Chain} chain - Chain to compose the commit and reveal of.
 * @param {string} ecPublicAddress - Public Entry Credit address that pays for the commit.
 * @param {function(Buffer, string): (Buffer | string | Promise<Buffer | string>)} sign - Signing function.
 * Takes as input the data to sign with the EC public key paying for the commmit
 * and should return its signature as a Buffer or a hex encoded string (or a Promise of those).
 * The returned signature must have been made by the private key corresponding to the ecPublicAddress argument.
 * @returns {{commit:Buffer, reveal:Buffer}} - Chain commit and reveal.
 * @async
 */
async function composeChainDelegateSig(chain, ecPublicAddress, sign) {
    return {
        commit: await composeChainCommitDelegateSig(chain, ecPublicAddress, sign),
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
    composeChainCommitDelegateSig,
    composeChainReveal,
    composeChain,
    composeChainDelegateSig,
    composeChainLedger,
    validateChainInstance
};
