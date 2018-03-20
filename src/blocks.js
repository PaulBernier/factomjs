const { Transaction } = require('./transaction'), { publicECKeyToHumanAddress } = require('factomjs-util'), {
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
        // TODO: transform
        this.entries = ab.abentries.slice();
        Object.freeze(this);
    }
}

class EntryBlock {
    constructor(block, keyMR) {
        // TODO: fullhash and previousfullhash missing? ADD TEST
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
            if (entry.number) {
                this.minuteIndexes.push(this.commits.length);
            } else {
                this.commits.push({
                    version: entry.version,
                    millis: parseInt(entry.millitime, 16),
                    entryHash: Buffer.from(entry.entryhash, 'hex'),
                    credits: entry.credits,
                    ecPublicKey: publicECKeyToHumanAddress(Buffer.from(entry.ecpubkey, 'hex')),
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