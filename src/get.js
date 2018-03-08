const Promise = require('bluebird'),
    { NULL_HASH } = require('./constant'),
    { Entry } = require('./entry'),
    { getPublicAddress } = require('./addresses'),
    { toHex } = require('./util');

function getChainHead(factomd, chainId) {
    return factomd.chainHead(toHex(chainId));
}

async function getEntry(factomd, entryHash) {
    return factomd.entry(toHex(entryHash))
        .then(toEntry);
}

async function getFirstEntry(factomd, chainId) {
    const chainHead = await getChainHead(factomd, chainId);
    let keymr = chainHead.chainhead;
    let entryBlock;
    while (keymr !== NULL_HASH) {
        entryBlock = await factomd.entryBlock(keymr);
        keymr = entryBlock.header.prevkeymr;
    }

    return getEntry(factomd, entryBlock.entrylist[0].entryhash);
}

async function getAllEntriesOfChain(factomd, chainId) {
    const allEntries = [];
    const chainHead = await getChainHead(factomd, chainId);

    if (chainHead.chainhead === '' && chainHead.chaininprocesslist) {
        throw 'Chain not yet included in a Directory Block';
    }

    let keymr = chainHead.chainhead;
    while (keymr !== NULL_HASH) {
        const {
            entries,
            prevkeymr
        } = await getAllEntriesOfEntryBlock(factomd, keymr);
        allEntries.push(...entries.reverse());

        keymr = prevkeymr;
    }

    return Promise.resolve(allEntries.reverse());
}

async function getAllEntriesOfEntryBlock(factomd, keymr) {
    const entryBlock = await factomd.entryBlock(keymr);

    const entries = await Promise.map(entryBlock.entrylist.map(e => e.entryhash), getEntry.bind(null, factomd));

    return {
        entries: entries,
        prevkeymr: entryBlock.header.prevkeymr
    };
}

function toEntry(entry) {
    return Entry.Builder()
        .chainId(entry.chainid, 'hex')
        .extIds(entry.extids, 'hex')
        .content(entry.content, 'hex')
        .build();
}

function getBalance(factomd, address) {
    const publicAddress = getPublicAddress(address);

    const balance = publicAddress[0] === 'E' ? factomd.entryCreditBalance : factomd.factoidBalance;
    return balance.call(factomd, publicAddress)
        .then(res => res.balance);
}

function getProperties(factomd) {
    return factomd.properties();
}


async function chainExists(factomd, chainId) {
    return factomd.chainHead(toHex(chainId))
        .then(() => true)
        .catch(function(err) {
            if (err.code === -32009) {
                return false;
            }
            throw err;
        });
}

function getEntryCreditRate(factomd) {
    return factomd.entryCreditRate()
        .then(r => r.rate);
}

module.exports = {
    getEntry,
    getAllEntriesOfChain,
    getAllEntriesOfEntryBlock,
    getFirstEntry,
    getChainHead,
    chainExists,
    getEntryCreditRate,
    getBalance,
    getProperties
};