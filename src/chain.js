const EdDSA = require('elliptic').eddsa,
    { addressToKey, isValidEcPrivateAddress } = require('./addresses'),
    { Entry } = require('./entry'),
    { sha256, sha256d } = require('./util'),
    { CHAIN_CREATION_COST } = require('./constant');

const ec = new EdDSA('ed25519');

class Chain {
    constructor(firstEntry) {
        if (firstEntry instanceof Entry) {
            const chainId = computeChainId(firstEntry);
            this.firstEntry = Entry.builder(firstEntry)
                .chainId(chainId)
                .build();
            this.id = chainId;
            Object.freeze(this);
        } else {
            throw new Error('Argument on Chain constructor should be an instance of Entry');
        }
    }

    get idHex() {
        return this.id.toString('hex');
    }

    ecCost() {
        return CHAIN_CREATION_COST + this.firstEntry.ecCost();
    }
}

function computeChainId(firstEntry) {
    if (firstEntry.extIds.length === 0) {
        throw new Error('First entry of a chain must contain at least 1 external id');
    }

    const extIdsHashes = firstEntry.extIds.map(sha256);
    const hashes = Buffer.concat(extIdsHashes);
    return sha256(hashes);
}

function composeChainCommit(chain, ecPrivate) {
    validateChainInstance(chain);
    if (!isValidEcPrivateAddress(ecPrivate)) {
        throw new Error(`${ecPrivate} is not a valid EC private address`);
    }

    const buffer = composeChainLedger(chain);

    // Sign commit
    const secret = addressToKey(ecPrivate);
    const key = ec.keyFromSecret(secret);
    const signature = Buffer.from(key.sign(buffer).toBytes());
    const ecPublic = Buffer.from(key.getPublic());

    return Buffer.concat([buffer, ecPublic, signature]);
}

function composeChainLedger(chain) {
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

function computeChainTxId(chain) {
    validateChainInstance(chain);
    return sha256(composeChainLedger(chain));
}

function composeChainReveal(chain) {
    validateChainInstance(chain);
    return chain.firstEntry.marshalBinary();
}

function composeChain(chain, ecPrivate) {
    validateChainInstance(chain);

    return {
        commit: composeChainCommit(chain, ecPrivate),
        reveal: composeChainReveal(chain)
    };
}

function validateChainInstance(chain) {
    if (!(chain instanceof Chain)) {
        throw new Error('Argument must be an instance of Chain');
    }
}

module.exports = {
    Chain,
    computeChainTxId,
    validateChainInstance,
    computeChainId,
    composeChainCommit,
    composeChainReveal,
    composeChain
};