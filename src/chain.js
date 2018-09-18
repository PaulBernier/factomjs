const sign = require('tweetnacl/nacl-fast').sign,
    { addressToKey, isValidEcPrivateAddress, isValidEcPublicAddress } = require('./addresses'),
    { Entry } = require('./entry'),
    { sha256, sha256d } = require('./util'),
    { CHAIN_CREATION_COST } = require('./constant');

/**********************
 * Chain class
 **********************/

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
            throw new Error('Argument on Chain constructor should be an instance of Entry');
        }
        Object.freeze(this);
    }

    get idHex() {
        return this.id.toString('hex');
    }

    ecCost() {
        return CHAIN_CREATION_COST + this.firstEntry.ecCost();
    }
}

/**********************
 * Compose
 **********************/

function composeChainCommit(chain, ecAddress, sig) {
    validateChainInstance(chain);

    const buffer = composeChainLedger(chain);
    let ecPublicKey, signature;

    if (isValidEcPrivateAddress(ecAddress)) {
        // Sign commit
        const secret = addressToKey(ecAddress);
        const key = sign.keyPair.fromSeed(secret);
        ecPublicKey = Buffer.from(key.publicKey);
        signature = Buffer.from(sign.detached(buffer, key.secretKey));
    } else if (isValidEcPublicAddress(ecAddress)) {
        // Verify the signature manually provided
        if (!sig) {
            throw new Error('Signature of the commit missing.');
        }
        ecPublicKey = addressToKey(ecAddress);
        signature = Buffer.from(sig, 'hex');
        if (!sign.detached.verify(buffer, signature, ecPublicKey)) {
            throw new Error('Invalid signature manually provided for the chain commit. (first entry timestamp not fixed?)');
        }
    } else {
        throw new Error(`${ecAddress} is not a valid EC address`);
    }

    return Buffer.concat([buffer, ecPublicKey, signature]);
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

function composeChainReveal(chain) {
    validateChainInstance(chain);
    return chain.firstEntry.marshalBinary();
}

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

function computeChainTxId(chain) {
    validateChainInstance(chain);
    return sha256(composeChainLedger(chain));
}

function computeChainId(firstEntry) {
    if (firstEntry.extIds.length === 0) {
        throw new Error('First entry of a chain must contain at least 1 external id');
    }

    const extIdsHashes = firstEntry.extIds.map(sha256);
    const hashes = Buffer.concat(extIdsHashes);
    return sha256(hashes);
}

module.exports = {
    Chain,
    computeChainTxId,
    validateChainInstance,
    computeChainId,
    composeChainCommit,
    composeChainReveal,
    composeChain,
    composeChainLedger
};