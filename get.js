const {
    NULL_HASH
} = require('./constant');

function getChainHead(chainId) {
    return factomdjs.chainHead(chainId);
}

async function getFirstEntry(chainId) {
    const chainHead = await factomdjs.chainHead(chainId);
    let keymr = chainHead.chainhead;
    let entryBlock;
    while (keymr !== NULL_HASH) {
        entryBlock = await factomdjs.entryBlock(keymr);
        keymr = entryBlock.header.prevkeymr;
    }

    return factomdjs.entry(entryBlock.entrylist[0].entryhash)
        .then(decodeEntry);
}

// TODO: Paginated version
async function getAllEntriesOfChain(chainId) {
    const allEntries = [];
    const chainHead = await factomdjs.chainHead(chainId);

    let keymr = chainHead.chainhead;
    while (keymr !== NULL_HASH) {
        const {
            entries,
            prevkeymr
        } = await getAllEntriesOfEntryBlock(keymr);
        allEntries.push(...entries.reverse());

        keymr = prevkeymr;
    }

    return Promise.resolve(allEntries.reverse());
}

async function getAllEntriesOfEntryBlock(keymr) {
    const entryBlock = await factomdjs.entryBlock(keymr);

    const entries = await Promise.map(entryBlock.entrylist.map(e => e.entryhash), factomdjs.entry);

    return {
        entries: entries.map(decodeEntry),
        prevkeymr: entryBlock.header.prevkeymr
    };
}

async function chainExists(chainId) {
    return factomdjs.chainHead(chainId)
        .then(() => true)
        .catch(() => false);
}