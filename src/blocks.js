const { Transaction } = require('./transaction'), {
    ADMIN_BLOCKS_CHAIN_ID,
    ENTRY_CREDIT_BLOCKS_CHAIN_ID,
    FACTOID_BLOCKS_CHAIN_ID,
    RESERVED_CHAIN_IDS
} = require('./constant');

class DirectoryBlock {
    // TODO: why I have to pass it extra keymr?
    constructor(block, keymr) {
        this.keymr = keymr;
        this.height = block.header.sequencenumber;
        this.timestamp = block.header.timestamp;
        this.previousBlockKeymr = block.header.prevblockkeymr;
        this.entryBlockRefs = block.entryblocklist.map(eb => ({
            chainId: eb.chainid,
            keymr: eb.keymr
        }));
        Object.freeze(this);
    }

    getAdminBlockKeymr() {
        return this.entryBlockRefs.find(eb => eb.chainId === ADMIN_BLOCKS_CHAIN_ID).keymr;
    }

    getEntryCreditBlockKeymr() {
        return this.entryBlockRefs.find(eb => eb.chainId === ENTRY_CREDIT_BLOCKS_CHAIN_ID).keymr;
    }

    getFactoidBlockKeymr() {
        return this.entryBlockRefs.find(eb => eb.chainId === FACTOID_BLOCKS_CHAIN_ID).keymr;
    }

    getRegularEntryBlockRefs() {
        return this.entryBlockRefs.filter(eb => !RESERVED_CHAIN_IDS.includes(eb.chainId));
    }

}

class EntryBlock {
    constructor(block) {
        // TODO: keymr missing??
        this.entryRefs = block.entrylist.map(e => ({ entryHash: e.entryhash, timestamp: e.timestamp }));
        const header = block.header;
        this.directoryBlockHeight = header.dbheight;
        this.timestamp = header.timestamp;
        this.previousBlockKeymr = header.prevkeymr;
        this.chainId = header.chainid;
        this.height = header.blocksequencenumber;
        Object.freeze(this);
    }
}

class FactoidBlock {
    constructor(block) {
        const fb = block.fblock;
        this.keymr = fb.keymr;
        this.previousBlockKeymr = fb.prevkeymr;
        this.ledgerKeymr = fb.ledgerkeymr;
        this.previousLedgerKeymr = fb.prevledgerkeymr;
        this.entryCreditRate = fb.exchrate;
        this.height = fb.dbheight;
        this.transactions = fb.transactions.map(t => new Transaction(t));
    }

    getCoinbaseTransaction() {
        // TODO: correct?
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
        this.height = header.dbheight;
        this.bodySize = header.bodysize;
        // TODO transform/deep dive the different kinds / minutes etc
        this.entries = ecb.body.entries;
    }
}

module.exports = {
    DirectoryBlock,
    EntryBlock,
    FactoidBlock,
    EntryCreditBlock
};