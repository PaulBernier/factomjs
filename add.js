const Promise = require('bluebird'),
    {
        validateChainInstance,
        composeChain
    } = require('./chain'),
    {
        validateEntryInstance,
        composeEntry
    } = require('./entry');

// addChain
// addChains
// commitChain
// revealChain
// addEntry
// addEntries
// commitEntry
// revealEntry


// TODO: addEntry and addChain are exactly the same besides composeChain/commitChain
// Handle both cases argument is chain or just firstEntry
// TODO: safe/unsafe version ==> NO unsafe version for addChain?
// A prudent user will not broadcast their first Entry until the Federated server acknowledges the Chain Commit. 
// If they do not wait, a peer on the P2P network can put their Entry as the first one in that Chain.
async function addChain(chain, ecAddress) {
    validateChainInstance(chain);
    if (!fctUtils.isValidAddress(ecAddress)) {
        throw `${ecAddress} is not a valid address`;
    }

    let composed = {};
    if (ecAddress.substring(0, 2) === 'EC') {
        const {
            commit,
            reveal
        } = await walletd.composeChain(chain.firstEntry.extIdsHex, chain.firstEntry.contentHex, ecAddress);
        composed.commit = commit.params.message;
        composed.reveal = reveal.params.entry;
    } else if (ecAddress.substring(0, 2) === 'Es') {
        const {
            commit,
            reveal
        } = composeChain(chain, ecAddress);
        composed.commit = commit.toString('hex');
        composed.reveal = reveal.toString('hex');
    } else {
        throw `${ecAddress} is not an EC address`;
    }

    const commitPromise = factomdjs.commitChain(composed.commit).catch(function (e) {
        if (e.message === 'Repeated Commit') {
            log.warn(e);
        } else {
            throw e;
        }
    });

    const [committed, revealed] = await Promise.all([
        commitPromise,
        factomdjs.revealChain(composed.reveal)
    ]);

    log.debug(committed);
    log.debug(revealed);

    return {
        chainId: revealed.chainid,
        entryHash: revealed.entryhash
    };
}

// TODO: safe/unsage version
async function addEntry(entry, ecAddress) {
    validateEntryInstance(entry);

    if (!fctUtils.isValidAddress(ecAddress)) {
        throw `${ecAddress} is not a valid address`;
    }

    let composed = {};
    if (ecAddress.substring(0, 2) === 'EC') {
        const {
            commit,
            reveal
        } = await walletd.composeEntry(entry.chainIdHex, entry.extIdsHex, entry.contentHex, ecAddress);
        composed.commit = commit.params.message;
        composed.reveal = reveal.params.entry;
    } else if (ecAddress.substring(0, 2) === 'Es') {
        const {
            commit,
            reveal
        } = composeEntry(entry, ecAddress);
        composed.commit = commit.toString('hex');
        composed.reveal = reveal.toString('hex');
    } else {
        throw `${ecAddress} is not an EC address`;
    }

    const commitPromise = factomdjs.commitEntry(composed.commit).catch(function (e) {
        if (e.message === 'Repeated Commit') {
            log.warn(e);
        } else {
            throw e;
        }
    });

    const [committed, revealed] = await Promise.all([
        commitPromise,
        factomdjs.revealEntry(composed.reveal)
    ]);

    log.debug(committed);
    log.debug(revealed);

    return Promise.resolve(revealed.entryhash);
}

async function addEntries(entries, ecpub) {
    return Promise.map(entries, entry => addEntry(entry, ecpub));
}

module.exports = {
    addChain,
    addEntry,
    addEntries
};