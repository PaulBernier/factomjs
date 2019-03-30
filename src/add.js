const Promise = require('bluebird'),
    { isIterable } = require('./util'),
    { chainExists } = require('./get'),
    { waitOnCommitAck, waitOnRevealAck } = require('./ack'),
    { isValidPrivateEcAddress, getPublicAddress } = require('./addresses'),
    { Chain, composeChainCommit, composeChainReveal } = require('./chain'),
    { Entry, composeEntryCommit, composeEntryReveal } = require('./entry');

//////////// Commit /////////////

function commit(factomd, obj, ecPrivate, ackTimeout) {
    switch (obj.constructor) {
        case Entry:
            return commitEntry(factomd, obj, ecPrivate, ackTimeout);
        case Chain:
            return commitChain(factomd, obj, ecPrivate, ackTimeout);
        default:
            throw new Error('Argument of `commit` is not an instance of Chain or Entry');
    }
}

async function commitChain(factomd, chain, ecPrivate, ackTimeout) {
    if (await chainExists(factomd, chain.id)) {
        throw new Error(`Chain ${chain.idHex} already exists.`);
    }
    return commitInternal(
        factomd,
        chain,
        composeChainCommit,
        'commit-chain',
        ecPrivate,
        ackTimeout
    );
}

function commitEntry(factomd, entry, ecPrivate, ackTimeout) {
    if (!entry.chainId.length) {
        throw new Error('Entry should contain a chain id to be committed');
    }
    return commitInternal(
        factomd,
        entry,
        composeEntryCommit,
        'commit-entry',
        ecPrivate,
        ackTimeout
    );
}

async function commitInternal(factomd, obj, composeCommit, commitApiCall, ecPrivate, to) {
    const ackTimeout = to || 60;
    const commit = composeCommit(obj, ecPrivate).toString('hex');

    let repeatedCommit = false;
    const committed = await factomd.call(commitApiCall, { message: commit }).catch(function(e) {
        if (e.code === -32011) {
            repeatedCommit = true;
        } else {
            throw e;
        }
    });

    if (committed && ackTimeout >= 0) {
        await waitOnCommitAck(factomd, committed.txid, ackTimeout);
    }

    return {
        txId: committed ? committed.txid : undefined,
        repeatedCommit: repeatedCommit
    };
}

//////////// Reveal /////////////

function reveal(factomd, obj, ecPrivate, ackTimeout) {
    switch (obj.constructor) {
        case Entry:
            return revealEntry(factomd, obj, ecPrivate, ackTimeout);
        case Chain:
            return revealChain(factomd, obj, ecPrivate, ackTimeout);
        default:
            throw new Error('Argument of `reveal` is not an instance of Chain or Entry');
    }
}

function revealChain(factomd, chain, ackTimeout) {
    return revealInternal(factomd, chain, composeChainReveal, 'reveal-chain', ackTimeout);
}

function revealEntry(factomd, entry, ackTimeout) {
    if (!entry.chainId.length) {
        throw new Error('Entry should contain a chain id to be revealed');
    }
    return revealInternal(factomd, entry, composeEntryReveal, 'reveal-entry', ackTimeout);
}

async function revealInternal(factomd, obj, composeReveal, revealApiCall, to) {
    const ackTimeout = to || 60;
    const reveal = composeReveal(obj).toString('hex');

    const revealed = await factomd.call(revealApiCall, { entry: reveal });
    if (ackTimeout >= 0) {
        await waitOnRevealAck(factomd, revealed.entryhash, revealed.chainid, ackTimeout);
    }

    return {
        chainId: revealed.chainid,
        entryHash: revealed.entryhash
    };
}

//////////// Add /////////////

function add(factomd, obj, ecPrivate, options) {
    if (isIterable(obj)) {
        return addIterableInternal(factomd, obj, ecPrivate, options);
    } else {
        return addDispatch(factomd, obj, ecPrivate, options);
    }
}

function addDispatch(factomd, obj, ecPrivate, options) {
    switch (obj.constructor) {
        case Entry:
            return addEntry(factomd, obj, ecPrivate, options);
        case Chain:
            return addChain(factomd, obj, ecPrivate, options);
        default:
            throw new Error('Argument of `add` is not an instance of Chain or Entry');
    }
}

function addChain(factomd, chain, ecPrivate, options) {
    return addInternal(factomd, chain, commitChain, revealChain, ecPrivate, options);
}

async function addEntry(factomd, entry, ecPrivate, options) {
    if (!entry.chainId.length) {
        throw new Error('Entry should contain a chain id to be added to the blockchain');
    }
    return addInternal(factomd, entry, commitEntry, revealEntry, ecPrivate, options);
}

async function addInternal(factomd, obj, commitFn, revealFn, ecPrivate, opts) {
    if (!isValidPrivateEcAddress(ecPrivate)) {
        throw new Error(`${ecPrivate} is not a valid EC private address`);
    }
    const options = opts || {};
    if (!options.skipFundValidation) {
        await validateFunds(factomd, ecPrivate, obj.ecCost());
    }

    const commitAckTimeout = options.commitTimeout || 60;
    const revealAckTimeout = options.revealTimeout || 60;

    let committed, revealed;
    if (commitAckTimeout < 0) {
        const result = await Promise.all([
            commitFn(factomd, obj, ecPrivate, commitAckTimeout),
            revealFn(factomd, obj, revealAckTimeout)
        ]);
        committed = result[0];
        revealed = result[1];
    } else {
        committed = await commitFn(factomd, obj, ecPrivate, commitAckTimeout);
        revealed = await revealFn(factomd, obj, revealAckTimeout);
    }

    return Object.assign({}, committed, revealed);
}

async function addIterableInternal(factomd, iterable, ecPrivate, opts) {
    const options = opts || {};

    if (!options.skipFundValidation) {
        const totalCost = iterable.reduce((cost, el) => cost + el.ecCost(), 0);
        await validateFunds(factomd, ecPrivate, totalCost);
        // Skip individual objects fund validation
        options.skipFundValidation = true;
    }

    // chunkSize is a legacy name kept for backward compatibility
    const concurrency = options.chunkSize || options.concurrency || 200;
    return Promise.map(iterable, entry => addDispatch(factomd, entry, ecPrivate, options), {
        concurrency
    });
}

async function validateFunds(factomd, ecPrivate, cost) {
    const ecPublic = getPublicAddress(ecPrivate);
    const { balance } = await factomd.call('entry-credit-balance', {
        address: ecPublic
    });

    if (balance < cost) {
        throw new Error(
            `${ecPublic} current balance (${balance} EC) is not sufficient to pay the total cost of ${cost} EC.`
        );
    }
}

const addEntries = addIterableInternal;
const addChains = addIterableInternal;

module.exports = {
    add,
    addChain,
    addChains,
    addEntry,
    addEntries,
    commit,
    commitEntry,
    commitChain,
    reveal,
    revealEntry,
    revealChain
};
