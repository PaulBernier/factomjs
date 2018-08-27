const { Transaction } = require('./transaction'), { keyToPublicEcAddress, rcdHashToPublicFctAddress } = require('./addresses'), {
    ADMIN_ID_TO_CODE,
    ADMIN_BLOCKS_CHAIN_ID,
    ENTRY_CREDIT_BLOCKS_CHAIN_ID,
    FACTOID_BLOCKS_CHAIN_ID
} = require('./constant');

class DirectoryBlock {
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
            this.timestamp = block.header.timestamp;
            this.previousBlockKeyMR = block.header.prevblockkeymr;
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

class AdminBlock {
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
            data.previousDirectoryBlockSignature = { publicKey: entry.prevdbsig.pub, signature: entry.prevdbsig.sig };
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
            data.outputs = entry.Outputs.map(o => ({ address: o.useraddress, rcdHash: o.address, amount: o.amount }));
            break;
        case 12:
            data.descriptorHeight = entry.descriptor_height;
            data.descriptorIndex = entry.descriptor_index;
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

class EntryBlock {
    constructor(block, keyMR) {
        this.keyMR = keyMR;
        const header = block.header;
        this.directoryBlockHeight = header.dbheight;
        this.timestamp = header.timestamp;
        this.previousBlockKeyMR = header.prevkeymr;
        this.chainId = header.chainid;
        this.sequenceNumber = header.blocksequencenumber;
        this.entryRefs = block.entrylist.map(e => ({ entryHash: e.entryhash, timestamp: e.timestamp }));
        Object.freeze(this);
    }
}

class FactoidBlock {
    constructor(block) {
        const fb = block.fblock;
        this.keyMR = fb.keymr;
        this.bodyMR = fb.bodymr;
        this.previousBlockKeyMR = fb.prevkeymr;
        this.ledgerKeyMR = fb.ledgerkeymr;
        this.previousLedgerKeyMR = fb.prevledgerkeymr;
        this.entryCreditRate = fb.exchrate;
        this.directoryBlockHeight = fb.dbheight;
        this.transactions = fb.transactions.map(t => new Transaction(t));
    }

    getCoinbaseTransaction() {
        return this.transactions[0];
    }
}

class EntryCreditBlock {
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
                    entryHash: Buffer.from(entry.entryhash, 'hex'),
                    credits: entry.credits,
                    ecPublicKey: keyToPublicEcAddress(entry.ecpubkey),
                    signature: Buffer.from(entry.sig, 'hex')
                });
            }
        }

        Object.freeze(this);
    }

    getCommitsForMinute(m) {
        if (m < 1 || m >= this.minuteIndexes.length) {
            throw new RangeError(`Minute out of range [1, ${this.minuteIndexes.length - 1}]`);
        }
        return this.commits.slice(this.minuteIndexes[m - 1], this.minuteIndexes[m]);
    }
}

module.exports = {
    DirectoryBlock,
    EntryBlock,
    AdminBlock,
    FactoidBlock,
    EntryCreditBlock
};