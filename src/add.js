const Promise = require('bluebird'),
    {
        isValidEcPrivateAddress
    } = require('./util'),
    {
        validateChainInstance,
        composeChain
    } = require('./chain'),
    {
        validateEntryInstance,
        composeEntry
    } = require('./entry');


// addChains
// commitChain
// revealChain
// commitEntry
// revealEntry


// TODO: addEntry and addChain are exactly the same besides composeChain/commitChain
// TODO: safe/unsafe version ==> NO unsafe version for addChain?
// A prudent user will not broadcast their first Entry until the Federated server acknowledges the Chain Commit. 
// If they do not wait, a peer on the P2P network can put their Entry as the first one in that Chain.
// Options to wait on commit and/or reveal
async function addChain(factomd, chain, ecPrivate) {
    validateChainInstance(chain);
    if (!isValidEcPrivateAddress(ecPrivate)) {
        throw `${ecPrivate} is not a valid EC private address`;
    }

    const composed = composeChain(chain, ecPrivate);
    composed.commit = composed.commit.toString('hex');
    composed.reveal = composed.reveal.toString('hex');

    const commitPromise = factomd.commitChain(composed.commit).catch(function (e) {
        if (e.message === 'Repeated Commit') {
            //log.warn(e);
        } else {
            throw e;
        }
    });

    const [committed, revealed] = await Promise.all([
        commitPromise,
        factomd.revealChain(composed.reveal)
    ]);

    // log.debug(committed);
    // log.debug(revealed);

    return {
        chainId: revealed.chainid,
        entryHash: revealed.entryhash
    };
}

// TODO: safe/unsage version
async function addEntry(factomd, entry, ecPrivate) {
    validateEntryInstance(entry);

    if (!isValidEcPrivateAddress(ecPrivate)) {
        throw `${ecPrivate} is not a valid EC private address`;
    }

    const composed = composeEntry(entry, ecPrivate);
    composed.commit = composed.commit.toString('hex');
    composed.reveal = composed.reveal.toString('hex');

    const commitPromise = factomd.commitEntry(composed.commit).catch(function (e) {
        if (e.message === 'Repeated Commit') {
            //log.warn(e);
        } else {
            throw e;
        }
    });

    const [committed, revealed] = await Promise.all([
        commitPromise,
        factomd.revealEntry(composed.reveal)
    ]);

    // log.debug(committed);
    // log.debug(revealed);

    return Promise.resolve(revealed.entryhash);
}

async function addEntries(factomd, entries, ecAddress) {
    return Promise.map(entries, entry => addEntry(factomd, entry, ecAddress));
}

module.exports = {
    addChain,
    addEntry,
    addEntries
};