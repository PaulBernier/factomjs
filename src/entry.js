const EdDSA = require('elliptic').eddsa,
    { addressToKey, isValidEcPrivateAddress } = require('./addresses'),
    { MAX_ENTRY_PAYLOAD_SIZE } = require('./constant'),
    { sha256, sha512 } = require('./util');

const ec = new EdDSA('ed25519');

class Entry {
    constructor(builder) {
        if (builder instanceof EntryBuilder) {
            this.chainId = builder._chainId;
            this.content = builder._content;
            this.timestamp = builder._timestamp;
            this.extIds = Object.freeze(builder._extIds);
            this.blockContext = Object.freeze(builder._blockContext);
            Object.freeze(this);
        } else {
            throw new Error('Use `Entry.builder()` syntax to create a new Entry');
        }
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

    size() {
        // Header size is 35 for the first 127 versions
        return 35 + this.payloadSize();
    }

    payloadSize() {
        return this.rawDataSize() + 2 * this.extIds.length;
    }

    rawDataSize() {
        return this.content.length + this.extIds.reduce((acc, value) => acc + value.length, 0);
    }

    remainingFreeBytes() {
        const size = this.payloadSize();
        if (size === 0) {
            return 1024;
        }
        const remainder = size % 1024;
        return remainder ? 1024 - remainder : 0;
    }

    remainingMaxBytes() {
        const remainingMaxBytes = MAX_ENTRY_PAYLOAD_SIZE - this.payloadSize();
        if (remainingMaxBytes < 0) {
            throw new Error('Entry cannot be larger than 10Kb');
        }

        return remainingMaxBytes;
    }

    hash() {
        const data = this.marshalBinary();
        return sha256(Buffer.concat([sha512(data), data]));
    }

    hashHex() {
        return this.hash().toString('hex');
    }

    marshalBinary() {
        if (this.chainId.length === 0) {
            throw new Error('ChainId is missing to marshal the entry');
        }

        const externalIds = marshalExternalIdsBinary(this.extIds);
        const header = marshalHeaderBinary(this.chainId, externalIds.length);
        return Buffer.concat([header, externalIds, this.content]);
    }

    marshalBinaryHex() {
        return this.marshalBinary().toString('hex');
    }

    ecCost() {
        const dataLength = this.payloadSize();
        if (dataLength > MAX_ENTRY_PAYLOAD_SIZE) {
            throw new Error('Entry cannot be larger than 10Kb');
        }

        return Math.ceil(dataLength / 1024);
    }

    static builder(entry) {
        return new EntryBuilder(entry);
    }
}

class EntryBuilder {
    constructor(entry) {
        if (entry instanceof Object) {
            this._extIds = entry.extIds;
            this._content = entry.content;
            this._chainId = entry.chainId;
            this._timestamp = entry.timestamp;
            this._blockContext = entry._blockContext;
        } else {
            this._extIds = [];
            this._content = Buffer.from('');
            this._chainId = Buffer.from('');
        }
    }
    content(content, enc) {
        if (content) {
            this._content = Buffer.from(content, enc || 'hex');
        }
        return this;
    }
    chainId(chainId, enc) {
        if (chainId) {
            this._chainId = Buffer.from(chainId, enc || 'hex');
        }
        return this;
    }
    extIds(extIds, enc) {
        if (Array.isArray(extIds)) {
            this._extIds = extIds.map(extId => Buffer.from(extId, enc || 'hex'));
        }
        return this;
    }
    extId(extId, enc) {
        if (extId) {
            this._extIds.push(Buffer.from(extId, enc || 'hex'));
        }
        return this;
    }
    timestamp(timestamp) {
        this._timestamp = timestamp;
        return this;
    }
    entryBlockContext(blockContext) {
        this._blockContext = blockContext;
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
    if (!isValidEcPrivateAddress(ecPrivate)) {
        throw new Error(`${ecPrivate} is not a valid EC private address`);
    }

    const buffer = composeEntryLedger(entry);

    // Sign commit
    const secret = addressToKey(ecPrivate);
    const key = ec.keyFromSecret(secret);
    const signature = Buffer.from(key.sign(buffer).toBytes());
    const ecPublic = Buffer.from(key.getPublic());

    return Buffer.concat([buffer, ecPublic, signature]);
}

function computeEntryTxId(entry) {
    validateEntryInstance(entry);
    return sha256(composeEntryLedger(entry));
}

function composeEntryLedger(entry) {
    const buffer = Buffer.alloc(40);

    buffer.writeInt8(0);
    buffer.writeIntBE(entry.timestamp || Date.now(), 1, 6);
    entry.hash().copy(buffer, 7);
    buffer.writeInt8(entry.ecCost(), 39);

    return buffer;
}

function composeEntryReveal(entry) {
    validateEntryInstance(entry);
    return entry.marshalBinary();
}

function composeEntry(entry, ecPrivate) {
    validateEntryInstance(entry);

    return {
        commit: composeEntryCommit(entry, ecPrivate),
        reveal: composeEntryReveal(entry)
    };
}

function validateEntryInstance(entry) {
    if (!(entry instanceof Entry)) {
        throw new Error('Argument must be an instance of Entry');
    }
}

module.exports = {
    Entry,
    computeEntryTxId,
    validateEntryInstance,
    composeEntryCommit,
    composeEntryReveal,
    composeEntry
};