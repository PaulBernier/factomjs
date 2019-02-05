const sign = require('tweetnacl/nacl-fast').sign,
    { addressToKey, isValidPrivateEcAddress, isValidPublicEcAddress } = require('./addresses'),
    { MAX_ENTRY_PAYLOAD_SIZE } = require('./constant'),
    { sha256, sha512 } = require('./util');

/**********************
 * Entry class
 **********************/

/**
 * Class representing an Entry.
 * @param {EntryBuilder} builder 
 * @property {Buffer} chainId - Chain ID.
 * @property {Buffer[]} extIds - External IDs.
 * @property {Buffer} content - Content.
 * @property {number} timestamp - Timestamp in milliseconds for the commit.
 * @property {EntryBlockContext} blockContext - Block context. This property is *not* populated when using the method getEntry.
 * @example
    const myEntry = Entry.builder()
        .chainId('9107a308f91fd7962fecb321fdadeb37e2ca7d456f1d99d24280136c0afd55f2')
        .extId('6d79206578742069642031') // If no encoding parameter is passed as 2nd argument, 'hex' is used as default
        .extId('Some external ID', 'utf8')
        .content('My new content',  'utf8')
        .build();
 */
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

    /**
     * @returns {string} Chain ID of the entry as hex encoded string.
     */
    get chainIdHex() {
        return this.chainId.toString('hex');
    }

    /**
     * @returns {string} Entry content as hex encoded string.
     */
    get contentHex() {
        return this.content.toString('hex');
    }

    /**
     * @returns {string[]} External ids as hex encoded strings.
     */
    get extIdsHex() {
        return this.extIds.map(extId => extId.toString('hex'));
    }


    /**
     * Get the entry size.
     * @returns {number} The entry size in bytes.
     */
    size() {
        // Header size is 35 for the first 127 versions
        return 35 + this.payloadSize();
    }

    /**
     * Get the entry payload size (excluding the header).
     * @returns {number} The entry payload size in bytes.
     */
    payloadSize() {
        return this.rawDataSize() + 2 * this.extIds.length;
    }

    /**
     * Get the entry raw data size (payload size excluding the 2 byte overhead per extID).
     * @returns {number} The entry raw size in bytes.
     */
    rawDataSize() {
        return this.content.length + this.extIds.reduce((acc, value) => acc + value.length, 0);
    }

    /**
     * Get the number of bytes that can be added to the entry for the same EC cost.
     * @returns {number} Remaining number of free bytes.
     */
    remainingFreeBytes() {
        const size = this.payloadSize();
        if (size === 0) {
            return 1024;
        }
        const remainder = size % 1024;
        return remainder ? 1024 - remainder : 0;
    }

    /**
     * Get the number of bytes that can be added to the entry before hitting the maximum (10kb).
     * @returns {number} Maximum number of bytes that can still be added to the entry. 
     */
    remainingMaxBytes() {
        const remainingMaxBytes = MAX_ENTRY_PAYLOAD_SIZE - this.payloadSize();
        if (remainingMaxBytes < 0) {
            throw new Error('Entry cannot be larger than 10Kb');
        }

        return remainingMaxBytes;
    }

    /**
     * Get hash of the entry.
     * @returns {Buffer} Hash of the entry. 
     */
    hash() {
        const data = this.marshalBinary();
        return sha256(Buffer.concat([sha512(data), data]));
    }

    /**
     * @returns {string} Hash of the entry as hex encoded string.
     */
    hashHex() {
        return this.hash().toString('hex');
    }


    /**
     * @returns {Buffer} Result of marshaling the entry.
     */
    marshalBinary() {
        if (this.chainId.length === 0) {
            throw new Error('ChainId is missing to marshal the entry');
        }

        const externalIds = marshalExternalIdsBinary(this.extIds);
        const header = marshalHeaderBinary(this.chainId, externalIds.length);
        return Buffer.concat([header, externalIds, this.content]);
    }

    /**
     * @returns {string} Result of marshaling the entry as hex encoded string.
     */
    marshalBinaryHex() {
        return this.marshalBinary().toString('hex');
    }

    /**
     * Get Entry Credit cost of the entry.
     * @returns {number} EC cost of the entry. 
     */
    ecCost() {
        const dataLength = this.payloadSize();
        if (dataLength > MAX_ENTRY_PAYLOAD_SIZE) {
            throw new Error('Entry cannot be larger than 10Kb');
        }

        return Math.ceil(dataLength / 1024);
    }

    /**
     * Convert to a JavaScript Object representation of the entry. Can be used as argument of {@link EntryBuilder}.
     * @returns {Object} JavaScript object representing the entry.
     */
    toObject() {
        const o = {
            chainId: this.chainIdHex,
            extIds: this.extIdsHex,
            content: this.contentHex
        };

        if (this.timestamp) {
            o.timestamp = this.timestamp;
        }

        return o;
    }

    /**
     * Entry builder static factory.
     * @param {Entry} [entry] - Optional entry to use to initialize the attributes of the builder.
     * @returns {EntryBuilder} A new EntryBuilder.
     */
    static builder(entry) {
        return new EntryBuilder(entry);
    }
}

/**********************
 * Entry builder class
 **********************/

/**
 * Class to build an {@link Entry}
 * @param {Entry|Object} [entry] - Optional entry to use to initialize the attributes of the builder.
 */
class EntryBuilder {

    constructor(entry) {
        if (entry instanceof Object) {
            this._chainId = entry.chainId ? Buffer.from(entry.chainId, 'hex') : Buffer.from('');
            this._extIds = Array.isArray(entry.extIds) ? entry.extIds.map(extId => Buffer.from(extId, 'hex')) : [];
            this._content = entry.content ? Buffer.from(entry.content, 'hex') : Buffer.from('');
            this._timestamp = entry.timestamp;
        } else {
            this._extIds = [];
            this._content = Buffer.from('');
            this._chainId = Buffer.from('');
        }
    }
    /**
     * Set content.
     * @param {string|Buffer} content | Content.
     * @param {string} [enc=hex] - Encoding of the content if it is a string.
     * @returns {EntryBuilder} - EntryBuilder instance.
     */
    content(content, enc) {
        if (content) {
            this._content = Buffer.from(content, enc || 'hex');
        }
        return this;
    }
    /**
     * Set chain ID.
     * @param {string|Buffer} chainId - Chain ID.
     * @param {string} [enc=hex] - Encoding of the chainId if it is a string.
     * @returns {EntryBuilder} - EntryBuilder instance.
     */
    chainId(chainId, enc) {
        if (chainId) {
            this._chainId = Buffer.from(chainId, enc || 'hex');
        }
        return this;
    }
    /**
     * Set external IDs.
     * @param {string[]|Buffer[]} extIds - External IDs.
     * @param {string} [enc=hex] - Encoding of the external ids if they are strings.
     * @returns {EntryBuilder} - EntryBuilder instance.
     */
    extIds(extIds, enc) {
        if (Array.isArray(extIds)) {
            this._extIds = extIds.map(extId => Buffer.from(extId, enc || 'hex'));
        }
        return this;
    }
    /**
     * Add an external ID.
     * @param {string|Buffer} extId - External ID.
     * @param {string} [enc=hex] - Encoding of the external id if it is a string.
     * @returns {EntryBuilder} - EntryBuilder instance.
     */
    extId(extId, enc) {
        if (extId) {
            this._extIds.push(Buffer.from(extId, enc || 'hex'));
        }
        return this;
    }
    /**
     * Set the timestamp for the entry commit. 
     * If not set the library will use Date.now() as the commit timestamp.
     * @param {number} timestamp - Timestamp in milliseconds.
     * @returns {EntryBuilder} - EntryBuilder instance.
     */
    timestamp(timestamp) {
        this._timestamp = timestamp;
        return this;
    }

    /**
     * Set block context. This method is used internally by the library to populate a block context, 
     * regular users should not have to use this.
     * @param {EntryBlockContext} blockContext 
     * @returns {EntryBuilder} - EntryBuilder instance.
     */
    blockContext(blockContext) {
        this._blockContext = blockContext;
        return this;
    }

    /**
     * Build the Entry.
     * @returns {Entry} - Built entry.
     */
    build() {
        return new Entry(this);
    }
}

/**
 * Block context of an {@link Entry}.
 * @typedef {Object} EntryBlockContext
 * @property {number} entryTimestamp - Epoch timestamp (in seconds) of the entry.
 * @property {number} directoryBlockHeight - Directory Block height.
 * @property {number} entryBlockTimestamp - Epoch timestamp (in seconds) of the Entry Block.
 * @property {number} entryBlockSequenceNumber - Entry Block sequence number.
 * @property {string} entryBlockKeyMR - Entry Block KeyMR.
 */

/**********************
 * Marshal and compose
 **********************/

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

/**
 * Compose the commit of an Entry, that can then be used as input of the factomd API `commit-entry`.
 * Note that if the Entry doesn't have a timestamp set the library will use Date.now() as the default for the commit timestamp.
 * @param {Entry} entry - Entry to compose the commit of.
 * @param {string} ecAddress - Entry Credit address that pays for the commit, either private (Es) or public (EC). 
 * If a public EC address is provided it is necessary to provide the signature of the commit as a 3rd argument (use case for hardware wallets)
 * @param {string|Buffer} [signature] - Optional signature of the commit (composeEntryLedger). Only necessary if a public EC address was passed as 2nd argument.
 * @returns {Buffer} - Entry commit.
 */
function composeEntryCommit(entry, ecAddress, signature) {
    validateEntryInstance(entry);

    const buffer = composeEntryLedger(entry);

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
            throw new Error('Invalid signature manually provided for the entry commit. (entry timestamp not fixed?)');
        }
    } else {
        throw new Error(`${ecAddress} is not a valid EC address`);
    }

    return Buffer.concat([buffer, ecPublicKey, sig]);
}

function composeEntryLedger(entry) {
    validateEntryInstance(entry);

    const buffer = Buffer.alloc(40);

    buffer.writeInt8(0);
    buffer.writeIntBE(entry.timestamp || Date.now(), 1, 6);
    entry.hash().copy(buffer, 7);
    buffer.writeInt8(entry.ecCost(), 39);

    return buffer;
}

/**
 * Compose the reveal of an Entry, that can then be used as input of the factomd API `reveal-entry`.
 * @param {Entry} entry - Entry to compose the reveal of.
 * @returns {Buffer} - Entry reveal.
 */
function composeEntryReveal(entry) {
    validateEntryInstance(entry);
    return entry.marshalBinary();
}

/**
 * Compose the commit and reveal of an Entry, that can then be used as inputs of the factomd APIs `commit-entry` and `reveal-entry`.
 * @param {Entry} entry - Entry to compose the commit and reveal of.
 * @param {string} ecAddress - Entry Credit address that pays for the commit, either private (Es) or public (EC). 
 * If a public EC address is provided it is necessary to manually pass the signature of the commit as a 3rd argument (use case for hardware wallets)
 * @param {string|Buffer} [signature] - Optional signature of the commit (composeEntryLedger). Only necessary if a public EC address was passed as 2nd argument.
 * @returns {{commit:Buffer, reveal:Buffer}} - Entry commit and reveal.
 */
function composeEntry(entry, ecAddress, signature) {
    validateEntryInstance(entry);

    return {
        commit: composeEntryCommit(entry, ecAddress, signature),
        reveal: composeEntryReveal(entry)
    };
}

/**********************
 * Other functions
 **********************/

function validateEntryInstance(entry) {
    if (!(entry instanceof Entry)) {
        throw new Error('Argument must be an instance of Entry');
    }
}

/**
 * Compute the transaction ID of the Entry commit. The transaction ID is dependent on the timestamp set in the entry.
 * Note that if the timestamp is not set the library uses Date.now() as the default, changing the result of this function if called at different times. 
 * @param {Entry} entry 
 * @returns {Buffer} - The transaction id of the Entry commit.
 */
function computeEntryTxId(entry) {
    validateEntryInstance(entry);
    return sha256(composeEntryLedger(entry));
}

module.exports = {
    Entry,
    computeEntryTxId,
    validateEntryInstance,
    composeEntryCommit,
    composeEntryReveal,
    composeEntry,
    composeEntryLedger
};