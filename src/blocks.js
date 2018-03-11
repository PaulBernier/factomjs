const {
    ADMIN_BLOCKS_CHAIN_ID,
    ENTRY_CREDIT_BLOCKS_CHAIN_ID,
    FACTOID_BLOCKS_CHAIN_ID,
    RESERVED_CHAIN_IDS
} = require('./constant');

class DirectoryBlock {
    constructor(block) {
        this.height = block.header.sequencenumber;
        this.timestamp = block.header.timestamp;
        this.previousBlockKeymr = block.header.prevblockkeymr;
        this.entryBlockRefs = block.entryblocklist.map(eb => ({
            chainId: eb.chainid,
            keymr: eb.keymr
        }));
        Object.freeze(this);
    }

    getAdminBlockRef() {
        return this.entryBlockRefs.find(eb => eb.chainId === ADMIN_BLOCKS_CHAIN_ID);
    }

    getEntryCreditBlockRef() {
        return this.entryBlockRefs.find(eb => eb.chainId === ENTRY_CREDIT_BLOCKS_CHAIN_ID);
    }

    getFactoidBlockRef() {
        return this.entryBlockRefs.find(eb => eb.chainId === FACTOID_BLOCKS_CHAIN_ID);
    }

    getRegularEntryBlockRefs() {
        return this.entryBlockRefs.filter(eb => !RESERVED_CHAIN_IDS.includes(eb.chainId));
    }

}

class EntryBlock {
    constructor(block) {
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

module.exports = {
    DirectoryBlock,
    EntryBlock
};