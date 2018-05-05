const Promise = require('bluebird'),
    { Transaction } = require('./transaction'),
    { NULL_HASH } = require('./constant'),
    { Entry } = require('./entry'),
    { DirectoryBlock, AdminBlock, EntryBlock, FactoidBlock, EntryCreditBlock } = require('./blocks'),
    { getPublicAddress } = require('./addresses'),
    { toHex } = require('./util');

function getChainHead(factomd, chainId) {
    return factomd.chainHead(toHex(chainId))
        .then(ch => ({
            keyMR: ch.chainhead,
            chainInProcessList: ch.chaininprocesslist
        }));
}

async function getEntry(factomd, entryHash, entryBlockContext) {
    return factomd.entry(toHex(entryHash))
        .then(e => toEntry(e, entryBlockContext));
}

async function getEntryWithBlockContext(factomd, entryHash) {
    const chainId = await factomd.entry(toHex(entryHash)).then(e => e.chainid);
    let keyMR = await factomd.chainHead(chainId).then(ch => ch.chainhead);

    while (keyMR !== NULL_HASH) {

        const entryBlock = await factomd.entryBlock(keyMR);
        const entryFound = entryBlock.entrylist.find(e => e.entryhash === entryHash);

        if (entryFound) {
            return getEntry(factomd, entryHash, buildEntryBlockContext(keyMR, entryBlock, entryFound.timestamp));
        } else {
            keyMR = entryBlock.header.prevkeymr;
        }
    }
}

async function getFirstEntry(factomd, chainId) {
    const chainHead = await getChainHead(factomd, chainId);
    let keyMR = chainHead.keyMR;
    let entryBlock, latestNonNullKeyMR;
    while (keyMR !== NULL_HASH) {
        latestNonNullKeyMR = keyMR;
        entryBlock = await factomd.entryBlock(keyMR);
        keyMR = entryBlock.header.prevkeymr;
    }
    const firstEntry = entryBlock.entrylist[0];
    return getEntry(factomd, firstEntry.entryhash, buildEntryBlockContext(latestNonNullKeyMR, entryBlock, firstEntry.timestamp));
}

async function getAllEntriesOfChain(factomd, chainId) {
    const allEntries = [];
    const chainHead = await getChainHead(factomd, chainId);

    if (chainHead.keyMR === '' && chainHead.chainInProcessList) {
        throw new Error('Chain not yet included in a Directory Block');
    }

    let keyMR = chainHead.keyMR;
    while (keyMR !== NULL_HASH) {
        const {
            entries,
            previousKeyMR
        } = await getAllEntriesOfEntryBlock(factomd, keyMR);
        allEntries.push(...entries.reverse());

        keyMR = previousKeyMR;
    }

    return Promise.resolve(allEntries.reverse());
}

async function getAllEntriesOfEntryBlock(factomd, keyMR) {
    const entryBlock = await factomd.entryBlock(keyMR);

    const entries = await Promise.map(
        entryBlock.entrylist,
        e => getEntry(factomd, e.entryhash, buildEntryBlockContext(keyMR, entryBlock, e.timestamp)));

    return {
        entries: entries,
        previousKeyMR: entryBlock.header.prevkeymr
    };
}

function buildEntryBlockContext(entryBlockKeyMR, entryBlock, entryTimestamp) {
    return {
        entryTimestamp: entryTimestamp,
        directoryBlockHeight: entryBlock.header.dbheight,
        entryBlockTimestamp: entryBlock.header.timestamp,
        entryBlockSequenceNumber: entryBlock.header.blocksequencenumber,
        entryBlockKeyMR: entryBlockKeyMR
    };
}

function toEntry(entry, entryBlockContext) {
    return Entry.builder()
        .chainId(entry.chainid, 'hex')
        .extIds(entry.extids, 'hex')
        .content(entry.content, 'hex')
        .entryBlockContext(entryBlockContext)
        .timestamp(entryBlockContext ? entryBlockContext.entryTimestamp * 1000 : undefined)
        .build();
}

function getBalance(factomd, address) {
    const publicAddress = getPublicAddress(address);

    const balance = publicAddress[0] === 'E' ? factomd.entryCreditBalance : factomd.factoidBalance;
    return balance.call(factomd, publicAddress)
        .then(res => res.balance);
}

function getProperties(cli) {
    return cli.properties();
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

async function getTransactionWithBlockContext(factomd, txId) {
    if (typeof txId !== 'string') {
        throw new Error(`Argument is not a transaction ID: ${txId}`);
    }

    return factomd.transaction(txId)
        .then(function(result) {
            const transaction = result.factoidtransaction ? new Transaction(result.factoidtransaction) : undefined;
            return {
                transaction: transaction,
                includedInTransactionBlock: result.includedintransactionblock,
                includedInDirectoryBlock: result.includedindirectoryblock,
                includedInDirectoryBlockHeight: result.includedindirectoryblockheight
            };
        });
}

async function getTransaction(factomd, txId) {
    const txWithContext = await getTransactionWithBlockContext(factomd, txId);
    return txWithContext.transaction;
}

function getEntryCreditRate(factomd) {
    return factomd.entryCreditRate()
        .then(r => r.rate);
}

function getHeights(factomd) {
    return factomd.heights()
        .then(h => ({
            directoryBlockHeight: h.directoryblockheight,
            leaderHeight: h.leaderheight,
            entryBlockHeight: h.entryblockheight,
            entryHeight: h.entryheight
        }));
}

function getDirectoryBlockHead(factomd) {
    return factomd.directoryBlockHead()
        .then(r => getDirectoryBlock(factomd, r.keymr));
}

function getDirectoryBlock(factomd, arg) {
    let dbPromise;

    switch (typeof arg) {
        case 'number':
            if (arg < 0) {
                throw new RangeError('Directory Block height out of range');
            }
            dbPromise = factomd.dblockByHeight(arg);
            break;
        case 'string':
            dbPromise = factomd.directoryBlock(arg);
            break;
        default:
            throw Error(`Invalid argument: ${arg}`);
    }

    return dbPromise.then(r => new DirectoryBlock(r, arg));
}

function getEntryBlock(factomd, keyMR) {
    if (typeof keyMR !== 'string') {
        throw new Error('Argument should be the KeyMR of the Entry Block');
    }
    return factomd.entryBlock(keyMR)
        .then(r => new EntryBlock(r, keyMR));
}

function getFactoidBlock(factomd, arg) {
    let fbPromise;

    switch (typeof arg) {
        case 'number':
            if (arg < 0) {
                throw new RangeError('Factoid Block height out of range');
            }
            fbPromise = factomd.fblockByHeight(arg);
            break;
        case 'string':
            fbPromise = factomd.factoidBlock(arg);
            break;
        default:
            throw Error(`Invalid argument: ${arg}`);
    }

    return fbPromise.then(r => new FactoidBlock(r));
}

function getEntryCreditBlock(factomd, arg) {
    let ecbPromise;

    switch (typeof arg) {
        case 'number':
            if (arg < 0) {
                throw new RangeError('Entry Credit Block height out of range');
            }
            ecbPromise = factomd.ecblockByHeight(arg);
            break;
        case 'string':
            ecbPromise = factomd.entrycreditBlock(arg);
            break;
        default:
            throw Error(`Invalid argument: ${arg}`);
    }

    return ecbPromise.then(r => new EntryCreditBlock(r));
}

function getAdminBlock(factomd, arg) {
    let abPromise;

    switch (typeof arg) {
        case 'number':
            if (arg < 0) {
                throw new RangeError('Admin Block height out of range');
            }
            abPromise = factomd.ablockByHeight(arg);
            break;
        case 'string':
            abPromise = factomd.adminBlock(arg);
            break;
        default:
            throw Error(`Invalid argument: ${arg}`);
    }

    return abPromise.then(r => new AdminBlock(r));
}
module.exports = {
    getEntry,
    getEntryWithBlockContext,
    getAllEntriesOfChain,
    getFirstEntry,
    getChainHead,
    chainExists,
    getEntryCreditRate,
    getTransaction,
    getTransactionWithBlockContext,
    getBalance,
    getProperties,
    getHeights,
    getDirectoryBlockHead,
    getDirectoryBlock,
    getEntryBlock,
    getAdminBlock,
    getFactoidBlock,
    getEntryCreditBlock
};