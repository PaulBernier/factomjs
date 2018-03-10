const EdDSA = require('elliptic').eddsa,
    fctUtils = require('factomjs-util'),
    { Entry, entryCost } = require('./entry'),
    { sha256, sha256d } = require('./util'),
    { CHAIN_CREATION_COST } = require('./constant');

const ec = new EdDSA('ed25519');

class Chain {
    constructor(firstEntry) {
        if (firstEntry instanceof Entry) {
            const chainId = getChainId(firstEntry);
            this.firstEntry = Entry.Builder(firstEntry)
                .chainId(chainId)
                .build();
            this.chainId = chainId;
            Object.freeze(this);
        } else {
            throw new Error('Argument on Chain constructor should be an instance of Entry');
        }
    }
}

function getChainId(firstEntry) {
    if (firstEntry.extIds.length === 0) {
        throw new Error('First entry of a chain must contain at least 1 external id');
    }

    const extIdsHashes = firstEntry.extIds.map(sha256);
    const hashes = Buffer.concat(extIdsHashes);
    return sha256(hashes);
}

function chainCost(arg) {
    let ecCost = 0;
    if (arg instanceof Chain) {
        ecCost = entryCost(arg.firstEntry);
    } else if (arg instanceof Entry) {
        ecCost = entryCost(arg);
    } else {
        throw new Error('Argument must be an instance of Chain or Entry');
    }
    return CHAIN_CREATION_COST + ecCost;
}

function composeChainCommit(chain, ecPrivate) {
    validateChainInstance(chain);

    const firstEntry = chain.firstEntry;
    const entryHash = firstEntry.hash;
    const cost = entryCost(firstEntry);
    const buffer = Buffer.alloc(104);

    buffer.writeInt8(0);
    buffer.writeIntBE(Date.now(), 1, 6);
    const chainIdHash = sha256d(chain.chainId);
    chainIdHash.copy(buffer, 7);
    const commitWeld = sha256d(Buffer.concat([entryHash, chain.chainId]));
    commitWeld.copy(buffer, 39);
    entryHash.copy(buffer, 71);
    buffer.writeInt8(cost + CHAIN_CREATION_COST, 103);

    // Signing commit
    const secret = fctUtils.privateHumanAddressStringToPrivate(ecPrivate);
    const key = ec.keyFromSecret(secret);
    const signature = Buffer.from(key.sign(buffer).toBytes());
    const ecPublic = Buffer.from(key.getPublic());

    return Buffer.concat([buffer, ecPublic, signature]);
}

function composeChainReveal(chain) {
    validateChainInstance(chain);
    return chain.firstEntry.marshalBinary;
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
    validateChainInstance,
    chainCost,
    composeChainCommit,
    composeChainReveal,
    composeChain
};