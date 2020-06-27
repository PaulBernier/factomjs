const Promise = require('bluebird'),
    { isIterable } = require('./util'),
    { chainExists } = require('./get'),
    { waitOnCommitAck, waitOnRevealAck } = require('./ack'),
    { getPublicAddress } = require('./addresses'),
    {
        Chain,
        composeChainCommit,
        composeChainCommitDelegateSig,
        composeChainReveal,
    } = require('./chain'),
    {
        Entry,
        composeEntryCommit,
        composeEntryCommitDelegateSig,
        composeEntryReveal,
    } = require('./entry');

//////////// Commit /////////////

function commit(factomd, obj, ecAddress, options) {
    switch (obj.constructor) {
        case Entry:
            return commitEntry(factomd, obj, ecAddress, options);
        case Chain:
            return commitChain(factomd, obj, ecAddress, options);
        default:
            throw new Error('Argument of `commit` is not an instance of Chain or Entry');
    }
}

async function commitChain(factomd, chain, ecAddress, options) {
    if (await chainExists(factomd, chain.id)) {
        throw new Error(`Chain ${chain.idHex} already exists.`);
    }

    let commit;
    if (typeof options === 'object' && typeof options.sign === 'function') {
        commit = await composeChainCommitDelegateSig(chain, ecAddress, options.sign).then((c) =>
            c.toString('hex')
        );
    } else {
        commit = composeChainCommit(chain, ecAddress).toString('hex');
    }

    return sendCommit({
        factomd,
        commitApiCall: 'commit-chain',
        commit,
        ackTimeout: getAckTimeout(options),
    });
}

async function commitEntry(factomd, entry, ecAddress, options) {
    if (!entry.chainId.length) {
        throw new Error('Entry should contain a chain id to be committed');
    }

    let commit;
    if (typeof options === 'object' && typeof options.sign === 'function') {
        commit = await composeEntryCommitDelegateSig(entry, ecAddress, options.sign).then((c) =>
            c.toString('hex')
        );
    } else {
        commit = composeEntryCommit(entry, ecAddress).toString('hex');
    }

    return sendCommit({
        factomd,
        commitApiCall: 'commit-entry',
        commit,
        ackTimeout: getAckTimeout(options),
    });
}

// Backward compatibility:
// arg used to be directly the ackTimeout before being changed for an options object
function getAckTimeout(arg) {
    if (typeof arg === 'object') {
        return arg.ackTimeout;
    } else if (typeof arg === 'number') {
        return arg;
    }
}

async function sendCommit({ factomd, commit, commitApiCall, ackTimeout = 60 }) {
    let repeatedCommit = false;
    const committed = await factomd.call(commitApiCall, { message: commit }).catch(function (e) {
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
        repeatedCommit: repeatedCommit,
    };
}

//////////// Reveal /////////////

function reveal(factomd, obj, ackTimeout) {
    switch (obj.constructor) {
        case Entry:
            return revealEntry(factomd, obj, ackTimeout);
        case Chain:
            return revealChain(factomd, obj, ackTimeout);
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

async function revealInternal(factomd, obj, composeReveal, revealApiCall, ackTimeout = 60) {
    const reveal = composeReveal(obj).toString('hex');

    const revealed = await factomd.call(revealApiCall, { entry: reveal });
    if (ackTimeout >= 0) {
        await waitOnRevealAck(factomd, revealed.entryhash, revealed.chainid, ackTimeout);
    }

    return {
        chainId: revealed.chainid,
        entryHash: revealed.entryhash,
    };
}

//////////// Add /////////////

function add(factomd, obj, ecAddress, options) {
    if (isIterable(obj)) {
        return addIterableInternal(factomd, obj, ecAddress, options);
    } else {
        return addDispatch(factomd, obj, ecAddress, options);
    }
}

function addDispatch(factomd, obj, ecAddress, options) {
    switch (obj.constructor) {
        case Entry:
            return addEntry(factomd, obj, ecAddress, options);
        case Chain:
            return addChain(factomd, obj, ecAddress, options);
        default:
            throw new Error('Argument of `add` is not an instance of Chain or Entry');
    }
}

function addChain(factomd, chain, ecAddress, options) {
    return addInternal(factomd, chain, commitChain, revealChain, ecAddress, options);
}

async function addEntry(factomd, entry, ecAddress, options) {
    if (!entry.chainId.length) {
        throw new Error('Entry should contain a chain id to be added to the blockchain');
    }
    return addInternal(factomd, entry, commitEntry, revealEntry, ecAddress, options);
}

async function addInternal(factomd, obj, commitFn, revealFn, ecAddress, options = {}) {
    if (!options.skipFundValidation) {
        await validateFunds(factomd, ecAddress, obj.ecCost());
    }

    const commitAckTimeout = options.commitTimeout || 60;
    const revealAckTimeout = options.revealTimeout || 60;

    let committed, revealed;
    if (commitAckTimeout < 0) {
        const result = await Promise.all([
            commitFn(factomd, obj, ecAddress, {
                ackTimeout: commitAckTimeout,
                sign: options.sign,
            }),
            revealFn(factomd, obj, revealAckTimeout),
        ]);
        committed = result[0];
        revealed = result[1];
    } else {
        committed = await commitFn(factomd, obj, ecAddress, {
            ackTimeout: commitAckTimeout,
            sign: options.sign,
        });
        revealed = await revealFn(factomd, obj, revealAckTimeout);
    }

    return Object.assign({}, committed, revealed);
}

async function addIterableInternal(factomd, iterable, ecAddress, options = {}) {
    if (!options.skipFundValidation) {
        // Skip individual objects fund validation
        options.skipFundValidation = true;

        const totalCost = iterable.reduce((cost, el) => cost + el.ecCost(), 0);
        await validateFunds(factomd, ecAddress, totalCost);
    }

    // chunkSize is a legacy name kept for backward compatibility
    const concurrency = options.chunkSize || options.concurrency || 200;
    return Promise.map(iterable, (entry) => addDispatch(factomd, entry, ecAddress, options), {
        concurrency,
    });
}

async function validateFunds(factomd, ecAddress, cost) {
    const ecPublic = getPublicAddress(ecAddress);
    const { balance } = await factomd.call('entry-credit-balance', {
        address: ecPublic,
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
    revealChain,
};
