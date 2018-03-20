const fctUtils = require('factomjs-util'),
    EdDSA = require('elliptic').eddsa,
    { MAX_ENTRY_SIZE } = require('./constant'),
    { sha256, sha512 } = require('./util');

const ec = new EdDSA('ed25519');

class Entry {
    constructor(builder) {
        if (builder instanceof EntryBuilder) {
            this.chainId = builder._chainId;
            this.content = builder._content;
            this.extIds = Object.freeze(builder._extIds);
            Object.freeze(this);
        } else {
            throw new Error('Use `Entry.builder()` syntax to create a new Entry');
        }
    }

    get size() {
        return this.content.length + this.extIds.reduce((acc, value) => acc + value.length, 0);
    }

    get contentHex() {
        return this.content.toString('hex');
    }

    get extIdsHex() {
        return this.extIds.map(extId => extId.toString('hex'));
    }

    get chainIdHex() {
        return this.chainId.toString('hex');
    }

    get hash() {
        const data = this.marshalBinary;
        return sha256(Buffer.concat([sha512(data), data]));
    }

    get marshalBinary() {
        if (this.chainId.length === 0) {
            throw new Error('ChainId is missing to marshal the entry');
        }

        const externalIds = marshalExternalIdsBinary(this.extIds);
        const header = marshalHeaderBinary(this.chainId, externalIds.length);
        return Buffer.concat([header, externalIds, this.content]);
    }

    static builder(entry) {
        return new EntryBuilder(entry);
    }
}

class EntryBuilder {
    constructor(entry) {
        if (entry instanceof Entry) {
            this._extIds = entry.extIds;
            this._content = entry.content;
            this._chainId = entry.chainId;
        } else {
            this._extIds = [];
            this._content = Buffer.from('');
            this._chainId = Buffer.from('');
        }
    }
    content(content, enc) {
        if (content) {
            this._content = Buffer.from(content, enc);
        }
        return this;
    }
    chainId(chainId, enc) {
        if (chainId) {
            this._chainId = Buffer.from(chainId, enc);
        }
        return this;
    }
    extIds(extIds, enc) {
        if (Array.isArray(extIds)) {
            this._extIds = extIds.map(extId => Buffer.from(extId, enc));
        }
        return this;
    }
    extId(extId, enc) {
        if (extId) {
            this._extIds.push(Buffer.from(extId, enc));
        }
        return this;
    }
    build() {
        return new Entry(this);
    }
}

function marshalHeaderBinary(chainId, extIdsSize) {
    const header = Buffer.alloc(35);
    header.writeInt8(0);
    chainId.copy(header, 1);
    header.writeInt16BE(extIdsSize, 33);

    return header;
}

function marshalExternalIdsBinary(extIds) {
    const result = [];

    for (let extId of extIds) {
        const size = Buffer.alloc(2);
        size.writeInt16BE(extId.length);
        result.push(size);
        result.push(extId);
    }

    return Buffer.concat(result);
}

function composeEntryCommit(entry, ecPrivate) {
    validateEntryInstance(entry);

    const cost = entryCost(entry);
    const buffer = Buffer.alloc(40);

    buffer.writeInt8(0);
    buffer.writeIntBE(Date.now(), 1, 6);
    entry.hash.copy(buffer, 7);
    buffer.writeInt8(cost, 39);

    // Signing commit
    const secret = fctUtils.privateHumanAddressStringToPrivate(ecPrivate);
    const key = ec.keyFromSecret(secret);
    const signature = Buffer.from(key.sign(buffer).toBytes());
    const ecPublic = Buffer.from(key.getPublic());

    return Buffer.concat([buffer, ecPublic, signature]);
}

function composeEntryReveal(entry) {
    validateEntryInstance(entry);
    return entry.marshalBinary;
}

function composeEntry(entry, ecPrivate) {
    validateEntryInstance(entry);

    return {
        commit: composeEntryCommit(entry, ecPrivate),
        reveal: composeEntryReveal(entry)
    };
}

// TODO: Method of Entry?
function entrySize(entry) {
    validateEntryInstance(entry);

    const extIdsLength = entry.extIds.reduce((acc, val) => acc + val.length, 0);
    return 35 + 2 * entry.extIds.length + extIdsLength + entry.content.length;
}

// TODO: Method of Entry?
function entryCost(entry) {
    validateEntryInstance(entry);
    // Header size (35) is not counted in the cost
    const dataLength = entrySize(entry) - 35;
    if (dataLength > MAX_ENTRY_SIZE) {
        throw new Error('Entry cannot be larger than 10Kb');
    }

    return Math.ceil(dataLength / 1024);
}

function validateEntryInstance(entry) {
    if (!(entry instanceof Entry)) {
        throw new Error('Argument must be an instance of Entry');
    }
}

module.exports = {
    Entry,
    validateEntryInstance,
    composeEntryCommit,
    composeEntryReveal,
    composeEntry,
    entrySize,
    entryCost
};