const { Transaction } = require('./transaction'),
    { keyToPublicEcAddress, rcdHashToPublicFctAddress } = require('./addresses'),
    {
        ADMIN_ID_TO_CODE,
        ADMIN_BLOCKS_CHAIN_ID,
        ENTRY_CREDIT_BLOCKS_CHAIN_ID,
        FACTOID_BLOCKS_CHAIN_ID
    } = require('./constant');

/**
 * Class representing a Directory block.
 * @property {string} keyMR - Key Merkel Root.
 * @property {number} height - Height.
 * @property {string} previousBlockKeyMR - Key Merkel Root of the previous Directory block.
 * @property {number} timestamp - UNIX timestamp (seconds).
 * @property {string} fullHash - Full hash of the block. Only available when the block is queried by height.
 * @property {string} previousFullHash - Full hash of the previous Directory block. Only available when the block is queried by height.
 * @property {string} bodyKeyMR - Key Merkle Root of the block body. Only available when the block is queried by height.
 * @property {string} adminBlockRef - Reference to the admin block.
 * @property {string} entryCreditBlockRef - Reference to the entry credit block.
 * @property {string} factoidBlockRef - Reference to the factoid block.
 * @property {{chainId: string, keyMR: string}[]} entryBlockRefs - References to the entry blocks.
 */
class DirectoryBlock {
    /**
     * @hideconstructor
     */
    constructor(block, keyMR) {
        let entries = [];
        if (block.dblock) {
            const dblock = block.dblock;

            this.keyMR = dblock.keymr;
            this.height = dblock.header.dbheight;
            this.previousBlockKeyMR = dblock.header.prevkeymr;
            this.timestamp = dblock.header.timestamp * 60;
            entries = dblock.dbentries;

            // Extra fields
            this.fullHash = dblock.dbhash;
            this.previousFullHash = dblock.header.prevfullhash;
            this.bodyKeyMR = dblock.header.bodymr;
        } else {
            this.keyMR = keyMR;
            this.height = block.header.sequencenumber;
            this.previousBlockKeyMR = block.header.prevblockkeymr;
            this.timestamp = block.header.timestamp;
            entries = block.entryblocklist;
        }

        this.entryBlockRefs = [];
        for (const entry of entries) {
            switch (entry.chainid) {
                case ADMIN_BLOCKS_CHAIN_ID:
                    this.adminBlockRef = entry.keymr;
                    break;
                case ENTRY_CREDIT_BLOCKS_CHAIN_ID:
                    this.entryCreditBlockRef = entry.keymr;
                    break;
                case FACTOID_BLOCKS_CHAIN_ID:
                    this.factoidBlockRef = entry.keymr;
                    break;
                default:
                    this.entryBlockRefs.push({
                        chainId: entry.chainid,
                        keyMR: entry.keymr
                    });
            }
        }

        Object.freeze(this);
    }
}

/**
 * Class representing an Admin block.
 * @property {string} backReferenceHash - Back reference hash.
 * @property {string} lookupHash - Lookup hash.
 * @property {number} directoryBlockHeight - Directory block height.
 * @property {string} previousBackReferenceHash - Back reference hash of previous Admin block.
 * @property {number} headerExpansionSize - Header expansion size.
 * @property {string} headerExpansionArea - Header expansion area.
 * @property {number} bodySize - Size of the body.
 * @property {Object} entries - Admin entries. Each entry has its own type (can be identified either by its adminId (number) or its adminCode (string)).
 */
class AdminBlock {
    /**
     * @hideconstructor
     */
    constructor(block) {
        const ab = block.ablock;
        this.backReferenceHash = ab.backreferencehash;
        this.lookupHash = ab.lookuphash;
        const header = ab.header;
        this.directoryBlockHeight = header.dbheight;
        this.previousBackReferenceHash = header.prevbackrefhash;
        this.headerExpansionSize = header.headerexpansionsize;
        this.headerExpansionArea = header.headerexpansionarea;
        this.bodySize = header.bodysize;
        this.entries = ab.abentries.map(transformAdminBlockEntry);
        Object.freeze(this);
    }

    /**
     * Return all the admin entries for given types.
     * @param  {...number|string} types - A sequence of either numbers representing an adminId or strings representing an adminCode.
     * @returns {Object} - Admin entries.
     */
    getEntriesOfTypes(...types) {
        const set = new Set(types);
        return this.entries.filter(e => set.has(e.adminId) || set.has(e.adminCode));
    }
}

// https://github.com/FactomProject/factomd/tree/3871e26d562c3ed920a1a8fc0e61e50d49f1cf9b/common/adminBlock
function transformAdminBlockEntry(entry) {
    const base = {
        adminId: entry.adminidtype,
        adminCode: ADMIN_ID_TO_CODE.get(entry.adminidtype)
    };

    let data = {};
    switch (base.adminId) {
        case 1:
            data.identityChainId = entry.identityadminchainid;
            data.previousDirectoryBlockSignature = {
                publicKey: entry.prevdbsig.pub,
                signature: entry.prevdbsig.sig
            };
            break;
        case 2:
        case 3:
            data.identityChainId = entry.identitychainid;
            data.matryoshkaHash = entry.mhash;
            break;
        case 4:
            data.amount = entry.amount;
            break;
        case 5:
        case 6:
        case 7:
            data.identityChainId = entry.identitychainid;
            data.directoryBlockHeight = entry.dbheight;
            break;
        case 8:
            data.identityChainId = entry.identitychainid;
            data.keyPriority = entry.keypriority;
            data.publicKey = entry.publickey;
            data.directoryBlockHeight = entry.dbheight;
            break;
        case 9:
            data.identityChainId = entry.identitychainid;
            data.keyPriority = entry.keypriority;
            data.keyType = entry.keytype;
            data.ecdsaPublicKey = entry.ecdsapublickey;
            break;
        case 11:
            data.outputs = entry.Outputs.map(o => ({
                address: o.useraddress,
                rcdHash: o.address,
                amount: o.amount
            }));
            break;
        case 12:
            data.descriptorHeight = entry.descriptor_height;
            data.descriptorIndex = entry.DescriptorIndex;
            break;
        case 13:
            data.identityChainId = entry.IdentityChainID;
            data.rcdHash = entry.FactoidAddress;
            data.factoidAddress = rcdHashToPublicFctAddress(entry.FactoidAddress);
            break;
        case 14:
            data.identityChainId = entry.IdentityChainID;
            data.efficiency = entry.Efficiency / 100;
            break;
    }

    return Object.assign(base, data);
}

/**
 * Class representing an Entry block.
 * @property {string} keyMR - Key Mertle Root.
 * @property {string} previousBlockKeyMR - Key Mertle Root of the previous Entry block.
 * @property {number} directoryBlockHeight - Directory block height.
 * @property {number} timestamp - UNIX timestamp (seconds).
 * @property {string} chainId - Chain ID.
 * @property {number} sequenceNumber - Sequence number of this block relative to that sub chain.
 * @property {{ entryHash: string, timestamp: number }[]} entryRefs - References to entries with their UNIX timestamps.
 */
class EntryBlock {
    /**
     * @hideconstructor
     */
    constructor(block, keyMR) {
        this.keyMR = keyMR;
        const header = block.header;
        this.directoryBlockHeight = header.dbheight;
        this.timestamp = header.timestamp;
        this.previousBlockKeyMR = header.prevkeymr;
        this.chainId = header.chainid;
        this.sequenceNumber = header.blocksequencenumber;
        this.entryRefs = block.entrylist.map(e => ({
            entryHash: e.entryhash,
            timestamp: e.timestamp
        }));
        Object.freeze(this);
    }
}

/**
 * Class representing a Factoid block.
 * @property {string} keyMR - Key Mertle Root.
 * @property {string} bodyMR - Merkle Root of the body.
 * @property {string} previousBlockKeyMR - Key Merkle Root of the previous Factoid block.
 * @property {string} ledgerKeyMR - Ledger Key Merkle Root.
 * @property {string} previousLedgerKeyMR - Ledger Key Merkle Root of the previous Factoid block.
 * @property {number} entryCreditRate - Entry credit rate.
 * @property {number} directoryBlockHeight - Directory block height.
 * @property {Transaction[]} transactions - Array of Factoid transactions part of this block.
 */
class FactoidBlock {
    /**
     * @hideconstructor
     */
    constructor(block) {
        const fb = block.fblock;
        this.keyMR = fb.keymr;
        this.bodyMR = fb.bodymr;
        this.previousBlockKeyMR = fb.prevkeymr;
        this.ledgerKeyMR = fb.ledgerkeymr;
        this.previousLedgerKeyMR = fb.prevledgerkeymr;
        this.entryCreditRate = fb.exchrate;
        this.directoryBlockHeight = fb.dbheight;
        this.transactions = fb.transactions.map(
            t =>
                new Transaction(t, {
                    factoidBlockKeyMR: this.keyMR,
                    directoryBlockHeight: this.directoryBlockHeight
                    // directoryBlockKeyMR is not available
                })
        );
    }

    /**
     * Get coinbase transaction of the block.
     * @returns {Transaction} - Coinbase transaction of the block.
     */
    getCoinbaseTransaction() {
        return this.transactions[0];
    }
}

/**
 * Class representing an Entry Credit block.
 * @property {string} headerHash - Hash of the header.
 * @property {string} fullHash - Full hash.
 * @property {string} headerExpansionArea - Header expansion area.
 * @property {string} bodyHash - Hash of the body.
 * @property {string} previousHeaderHash - Hash of the previous Entry Credit block header.
 * @property {string} previousFullHash - Full hash of the previous Entry Credit block.
 * @property {number} directoryBlockHeight - Directory block height.
 * @property {number} bodySize - Size of the body.
 * @property {number} objectCount - Object count.
 * @property {number[]} minuteIndexes - Delimitation of the commits for each minute. Use method getCommitsForMinute rather than using this attribute directly.
 * @property {{version: number, millis: number, entryHash: string, credits: number, ecPublicKey: string, signature: string}[]} commits - Array of commits.
 */
class EntryCreditBlock {
    /**
     * @hideconstructor
     */
    constructor(block) {
        const ecb = block.ecblock;

        this.headerHash = ecb.headerhash;
        this.fullHash = ecb.fullhash;

        const header = ecb.header;
        this.headerExpansionArea = header.headerexpansionarea;
        this.bodyHash = header.bodyhash;
        this.previousHeaderHash = header.prevheaderhash;
        this.previousFullHash = header.prevfullhash;
        this.directoryBlockHeight = header.dbheight;
        this.bodySize = header.bodysize;
        this.objectCount = header.objectcount;

        this.minuteIndexes = [0];
        this.commits = [];

        for (const entry of ecb.body.entries) {
            if (entry.hasOwnProperty('number')) {
                this.minuteIndexes.push(this.commits.length);
            } else if (entry.hasOwnProperty('serverindexnumber')) {
                // serverindexnumber is a legacy field in old blocks
                continue;
            } else if (entry.hasOwnProperty('numec')) {
                // M1 blocks used to contain EC purchases
                // But those should be found in Factoid blocks anyway ()
                continue;
            } else {
                this.commits.push({
                    version: entry.version,
                    millis: parseInt(entry.millitime, 16),
                    entryHash: entry.entryhash,
                    credits: entry.credits,
                    ecPublicKey: keyToPublicEcAddress(entry.ecpubkey),
                    signature: entry.sig
                });
            }
        }

        Object.freeze(this);
    }

    /**
     * Get all the commits for a given minute.
     * @param {number} minute - Minute (between 1 and 10 included)
     * @returns {{version: number, millis: number, entryHash: string, credits: number, ecPublicKey: string, signature: string}[]} - Commits.
     */
    getCommitsForMinute(minute) {
        if (minute < 1 || minute >= this.minuteIndexes.length) {
            throw new RangeError(`Minute out of range [1, ${this.minuteIndexes.length - 1}]`);
        }
        return this.commits.slice(this.minuteIndexes[minute - 1], this.minuteIndexes[minute]);
    }
}

module.exports = {
    DirectoryBlock,
    EntryBlock,
    AdminBlock,
    FactoidBlock,
    EntryCreditBlock
};
