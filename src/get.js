const Promise = require('bluebird'),
    { Transaction } = require('./transaction'),
    { NULL_HASH } = require('./constant'),
    { Entry } = require('./entry'),
    {
        DirectoryBlock,
        AdminBlock,
        EntryBlock,
        FactoidBlock,
        EntryCreditBlock
    } = require('./blocks'),
    { getPublicAddress } = require('./addresses'),
    { toHex } = require('./util');

function getChainHead(factomd, chainId) {
    return factomd.call('chain-head', { chainid: toHex(chainId) }).then(ch => ({
        keyMR: ch.chainhead,
        chainInProcessList: ch.chaininprocesslist
    }));
}

async function getEntry(factomd, entryHash, entryBlockContext) {
    return factomd
        .call('entry', { hash: toHex(entryHash) })
        .then(e => toEntry(e, entryBlockContext));
}

async function getEntryWithBlockContext(factomd, entryHash) {
    const entryBlockKeyMr = await factomd
        .call('receipt', { hash: toHex(entryHash) })
        .then(r => r.receipt.entryblockkeymr);
    const entryBlock = await factomd.call('entry-block', {
        keymr: entryBlockKeyMr
    });
    const timestamp = entryBlock.entrylist.find(e => e.entryhash === entryHash).timestamp;
    return getEntry(
        factomd,
        entryHash,
        buildEntryBlockContext(entryBlockKeyMr, entryBlock, timestamp)
    );
}

async function getFirstEntry(factomd, chainId) {
    const chainHead = await getChainHead(factomd, chainId);

    if (chainHead.keyMR === '' && chainHead.chainInProcessList) {
        throw new Error('Chain not yet included in a Directory Block');
    }

    let keyMR = chainHead.keyMR;
    let entryBlock, latestNonNullKeyMR;
    while (keyMR !== NULL_HASH) {
        latestNonNullKeyMR = keyMR;
        entryBlock = await factomd.call('entry-block', { keymr: keyMR });
        keyMR = entryBlock.header.prevkeymr;
    }
    const firstEntry = entryBlock.entrylist[0];
    return getEntry(
        factomd,
        firstEntry.entryhash,
        buildEntryBlockContext(latestNonNullKeyMR, entryBlock, firstEntry.timestamp)
    );
}

async function getAllEntriesOfChain(factomd, chainId) {
    const allEntries = [];
    const chainHead = await getChainHead(factomd, chainId);

    if (chainHead.keyMR === '' && chainHead.chainInProcessList) {
        throw new Error('Chain not yet included in a Directory Block');
    }

    let keyMR = chainHead.keyMR;
    while (keyMR !== NULL_HASH) {
        const { entries, previousKeyMR } = await getAllEntriesOfEntryBlock(factomd, keyMR);
        allEntries.push(...entries.reverse());

        keyMR = previousKeyMR;
    }

    return Promise.resolve(allEntries.reverse());
}

async function rewindChainWhile(factomd, chainId, predicate, func) {
    if (typeof predicate !== 'function') {
        throw new Error(`${predicate} is not a function`);
    }
    if (typeof func !== 'function') {
        throw new Error(`${func} is not a function`);
    }

    const chainHead = await getChainHead(factomd, chainId);

    if (chainHead.keyMR === '' && chainHead.chainInProcessList) {
        throw new Error('Chain not yet included in a Directory Block');
    }

    let keyMR = chainHead.keyMR;
    while (keyMR !== NULL_HASH) {
        const { entries, previousKeyMR } = await getAllEntriesOfEntryBlock(factomd, keyMR);

        let i = entries.length - 1;
        while (i >= 0 && (await predicate(entries[i]))) {
            await func(entries[i]);
            i--;
        }

        // If the loop index is greater or equal to 0 it means the predicate was evaluated to false
        // And we must stop iterating entry blocks
        if (i >= 0) {
            break;
        }

        keyMR = previousKeyMR;
    }
}

async function getAllEntriesOfEntryBlock(factomd, keyMR) {
    const entryBlock = await factomd.call('entry-block', { keymr: keyMR });

    const entries = await Promise.map(entryBlock.entrylist, e =>
        getEntry(factomd, e.entryhash, buildEntryBlockContext(keyMR, entryBlock, e.timestamp))
    );

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
        .blockContext(entryBlockContext)
        .timestamp(entryBlockContext ? entryBlockContext.entryTimestamp * 1000 : undefined)
        .build();
}

function getBalance(factomd, address) {
    const publicAddress = getPublicAddress(address);

    const balance =
        publicAddress[0] === 'E'
            ? factomd.call.bind(factomd, 'entry-credit-balance')
            : factomd.call.bind(factomd, 'factoid-balance');

    return balance({ address: publicAddress }).then(res => res.balance);
}

function chainExists(factomd, chainId) {
    return factomd
        .call('chain-head', { chainid: toHex(chainId) })
        .then(() => true)
        .catch(function(err) {
            if (err.code === -32009) {
                return false;
            }
            throw err;
        });
}

async function getTransaction(factomd, txId) {
    if (typeof txId !== 'string') {
        throw new Error(`Argument is not a transaction ID: ${txId}`);
    }

    const tx = await factomd.call('transaction', { hash: txId });

    if (tx.factoidtransaction) {
        return new Transaction(tx.factoidtransaction, {
            factoidBlockKeyMR: tx.includedintransactionblock,
            directoryBlockKeyMR: tx.includedindirectoryblock,
            directoryBlockHeight: tx.includedindirectoryblockheight
        });
    } else {
        throw new Error(`No Transaction with ID [${txId}] found.`);
    }
}

function getEntryCreditRate(factomd) {
    return factomd.call('entry-credit-rate').then(r => r.rate);
}

async function getHeights(factomd) {
    const heights = await factomd.call('heights');

    return {
        directoryBlockHeight: heights.directoryblockheight,
        leaderHeight: heights.leaderheight,
        entryBlockHeight: heights.entryblockheight,
        entryHeight: heights.entryheight
    };
}

function getDirectoryBlockHead(factomd) {
    return factomd.call('directory-block-head').then(r => getDirectoryBlock(factomd, r.keymr));
}

function getDirectoryBlock(factomd, arg) {
    let dbPromise;

    switch (typeof arg) {
        case 'number':
            if (arg < 0) {
                throw new RangeError('Directory Block height out of range');
            }
            dbPromise = factomd.call('dblock-by-height', { height: arg });
            break;
        case 'string':
            dbPromise = factomd.call('directory-block', { keymr: arg });
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
    return factomd.call('entry-block', { keymr: keyMR }).then(r => new EntryBlock(r, keyMR));
}

function getFactoidBlock(factomd, arg) {
    let fbPromise;

    switch (typeof arg) {
        case 'number':
            if (arg < 0) {
                throw new RangeError('Factoid Block height out of range');
            }
            fbPromise = factomd.call('fblock-by-height', { height: arg });
            break;
        case 'string':
            fbPromise = factomd.call('factoid-block', { keymr: arg });
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
            ecbPromise = factomd.call('ecblock-by-height', { height: arg });
            break;
        case 'string':
            ecbPromise = factomd.call('entrycredit-block', { keymr: arg });
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
            abPromise = factomd.call('ablock-by-height', { height: arg });
            break;
        case 'string':
            abPromise = factomd.call('admin-block', { keymr: arg });
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
    getBalance,
    getHeights,
    getDirectoryBlockHead,
    getDirectoryBlock,
    getEntryBlock,
    getAdminBlock,
    getFactoidBlock,
    getEntryCreditBlock,
    rewindChainWhile
};
