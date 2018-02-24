const factomdjs = require('../factomdjs/src/factomd'),
    walletd = require('../factom-walletdjs/src/factom-walletd'),
    log = require('winston'),
    EdDSA = require('elliptic').eddsa,
    fctUtils = require('factomjs-util'),
    Promise = require('bluebird'),
    crypto = require('crypto');

const ec = new EdDSA('ed25519');

const CHAIN_CREATION_COST = 10;
const NULL_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

function setFactomNode(url) {
    factomdjs.setFactomNode(url);
}

function setFactomWallet(url) {
    walletd.setFactomNode(url);
}

// MIGRATED
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

// MIGRATED
async function getAllEntriesOfEntryBlock(keymr) {
    const entryBlock = await factomdjs.entryBlock(keymr);

    const entries = await Promise.map(entryBlock.entrylist.map(e => e.entryhash), factomdjs.entry);

    return {
        entries: entries.map(decodeEntry),
        prevkeymr: entryBlock.header.prevkeymr
    };
}

// MIGRATED
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

// Migrated
function getChainHead(chainId) {
    return factomdjs.chainHead(chainId);
}

function decodeEntry(entry) {
    const content = entry.content ? Buffer.from(entry.content, 'hex') : Buffer.from('');
    const extIds = Array.isArray(entry.extids) ? entry.extids.map(extid => Buffer.from(extid, 'hex')) : [];

    return {
        chainId: entry.chainid,
        content: content,
        extIds: extIds
    };
}

// MIGRATED
async function chainExists(chainId) {
    return factomdjs.chainHead(chainId)
        .then(() => true)
        .catch(() => false);
}

// MIGRATED
function getChainId(firstEntry) {
    const extIdsHashes = toBuffers(firstEntry.extIds).map(sha256);
    const hashes = Buffer.concat(extIdsHashes);

    return sha256(hashes);
}

// MIGRATED
// TODO: addEntry and addChain are exactly the same besides composeChain/commitChain
// Handle both cases argument is chain or just firstEntry
// TODO: safe/unsage version
async function addChain(firstEntry, ecAddress) {
    if (!fctUtils.isValidAddress(ecAddress)) {
        throw `${ecAddress} is not a valid address`;
    }

    let composed = {};
    if (ecAddress.substring(0, 2) === 'EC') {
        const {commit, reveal} = await walletd.composeChain(firstEntry.extIds.map(toHex), toHex(firstEntry.content), ecAddress);
        composed.commit = commit.params.message;
        composed.reveal = reveal.params.entry;
    } else if(ecAddress.substring(0, 2) === 'Es') {
        const {commit, reveal} = composeChain(firstEntry, ecAddress);
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

// MIGRATED
// TODO: safe/unsage version
async function addEntry(entry, ecAddress) {
    if (!fctUtils.isValidAddress(ecAddress)) {
        throw `${ecAddress} is not a valid address`;
    }

    let composed = {};
    if (ecAddress.substring(0, 2) === 'EC') {
        const {commit, reveal} = await walletd.composeEntry(entry.chainId, entry.extIds.map(toHex), toHex(entry.content), ecAddress);
        composed.commit = commit.params.message;
        composed.reveal = reveal.params.entry;
    } else if(ecAddress.substring(0, 2) === 'Es') {
        const {commit, reveal} = composeEntry(entry, ecAddress);
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

// MIGRATED
async function addEntries(entries, ecpub) {
    return Promise.map(entries, entry => addEntry(entry, ecpub));
}

function toHex(input) {
    if (!input) {
        return '';
    }
    return Buffer.from(input).toString('hex');
}

// MIGRATED
function entrySize(entry) {
    // 35 = header size
    let size = 35;

    if (Array.isArray(entry.extIds)) {
        const extIdsBuffers = toBuffers(entry.extIds);
        const extIdsLength = Buffer.concat(extIdsBuffers).length;
        size += 2 * entry.extIds.length + extIdsLength;
    }

    if (entry.content) {
        size += entry.content.length;
    }

    return size;
}

// MIGRATED
function chainCost(firstEntry) {
    return 10 + entryCost(firstEntry);
}

// MIGRATED
function entryCost(entry) {
    // Header size (35) is not counted in the cost
    const dataLength = entrySize(entry) - 35;
    if (dataLength > 10240) {
        throw 'Entry cannot be larger than 10Kb';
    }

    return Math.ceil(dataLength / 1024);
}

// MIGRATED
function waitOnCommitAck(txid, timeout) {
    return waitOnAck(txid, 'c', 'commitdata', timeout);
}

// MIGRATED
function waitOnRevealAck(hash, chainId, timeout) {
    return waitOnAck(hash, chainId, 'entrydata', timeout);
}

// MIGRATED
function waitOnAck(hash, chainId, ackResponseField, to) {
    if (!hash || !chainId) {
        return Promise.reject('Invalid argument: hash or chain ID is missing');
    }

    const timeout = to || 60;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const clearId = setInterval(async function () {
            process.stdout.write('.');
            const ackResponse = await factomdjs.ack(hash, chainId).catch(function (e) {
                clearInterval(clearId);
                process.stdout.write('\n');
                reject(e);
            });
            const status = ackResponse[ackResponseField].status;

            if (status !== 'Unknown' && status !== 'NotConfirmed') {
                clearInterval(clearId);
                process.stdout.write('\n');
                resolve(status);
            }

            if ((Date.now() - startTime) > timeout * 1000) {
                clearInterval(clearId);
                process.stdout.write('\n');
                reject('Ack timeout');
            }

        }, 500);
    });
}

// MIGRATED
function properties() {
    return factomdjs.properties();
}

// MIGRATED
function getBalance(x) {
    // TODO: detect type of X and redirect
    // TODO: implement https://github.com/FactomProject/factom/blob/a0a55096f9d2aeb5cb63b8b5a714a285f3a100b3/addresses.go#L43
    return factomdjs.entryCreditBalance(x)
        .then(res => res.balance);
}

// MIGRATED
function composeChainCommit(firstEntry, ecPrivate) {
    const chainId = getChainId(firstEntry);
    const entryHash = getEntryHash(firstEntry);
    const cost = entryCost(firstEntry);
    const buffer = Buffer.alloc(104);

    buffer.writeInt8(0);
    buffer.writeIntBE(Date.now(), 1, 6);
    const chainIdHash = sha256d(chainId);
    chainIdHash.copy(buffer, 7);
    const commitWeld = sha256d(Buffer.concat([entryHash, chainId]));
    commitWeld.copy(buffer, 39);
    entryHash.copy(buffer, 71);
    buffer.writeInt8(cost + CHAIN_CREATION_COST, 103);

    // Signing commit
    const secret = fctUtils.privateHumanAddressStringToPrivate(ecPrivate);
    const key = ec.keyFromSecret(secret);
    const signature = Buffer.from(key.sign(buffer).toBytes());
    const ecPublic = Buffer.from(key.getPublic());

    return Buffer.concat([buffer, ecPublic, signature]);
}

// MIGRATED
function composeChainReveal(firstEntry) {
    return marshalEntryBinary(firstEntry);
}

// MIGRATED
function composeChain(firstEntry, ecPrivate) {
    firstEntry.chainId = getChainId(firstEntry);
    return {
        commit: composeChainCommit(firstEntry, ecPrivate),
        reveal: composeChainReveal(firstEntry)
    };
}

// MIGRATED
function composeEntryCommit(entry, ecPrivate) {
    const entryHash = getEntryHash(entry);
    const cost = entryCost(entry);
    const buffer = Buffer.alloc(40);

    buffer.writeInt8(0);
    buffer.writeIntBE(Date.now(), 1, 6);
    entryHash.copy(buffer, 7);
    buffer.writeInt8(cost, 39);

    // Signing commit
    const secret = fctUtils.privateHumanAddressStringToPrivate(ecPrivate);
    const key = ec.keyFromSecret(secret);
    const signature = Buffer.from(key.sign(buffer).toBytes());
    const ecPublic = Buffer.from(key.getPublic());

    return Buffer.concat([buffer, ecPublic, signature]);
}

// MIGRATED
function composeEntryReveal(entry) {
    return marshalEntryBinary(entry);
}

// MIGRATED
function composeEntry(entry, ecPrivate) {
    return {
        commit: composeEntryCommit(entry, ecPrivate),
        reveal: composeEntryReveal(entry)
    };
}

// MIGRATED
function getEntryHash(entry) {
    const data = marshalEntryBinary(entry);
    return sha256(Buffer.concat([sha512(data), data]));
}

function toBuffers(extIds) {
    if (!extIds) {
        return [];
    }
    return extIds.map(Buffer.from);
}
// MIGRATED
function marshalEntryBinary(entry) {
    const externalIds = marshalExternalIdsBinary(entry.extIds);
    const header = marshalHeaderBinary(entry.chainId, externalIds);
    const content = Buffer.from(entry.content ? entry.content : '');

    return Buffer.concat([header, externalIds, content]);
}
// MIGRATED
function marshalHeaderBinary(chainId, marshalledExtIds) {
    const chainIdBuffer = Buffer.isBuffer(chainId) ? chainId : Buffer.from(chainId, 'hex');
    const header = Buffer.alloc(35);
    chainIdBuffer.copy(header, 1);
    header.writeInt16BE(marshalledExtIds.length, 33);

    return header;
}
// MIGRATED
function marshalExternalIdsBinary(extIds) {
    const buffers = toBuffers(extIds);
    const result = [];

    for (let extId of buffers) {
        const size = Buffer.alloc(2);
        size.writeInt16BE(extId.length);
        result.push(size);
        result.push(extId);
    }

    return Buffer.concat(result);
}
// MIGRATED
function sha256(data) {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest();
}
// MIGRATED
function sha256d(data) {
    return sha256(sha256(data));
}
// MIGRATED
function sha512(data) {
    const hash = crypto.createHash('sha512');
    hash.update(data);
    return hash.digest();
}

//setFactomNode('http://localhost:8088/v2')

// addChain({
//             extIds: ["hello-world8"],
//             content: "content"
//         },
//         "EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD"
//     )
//     .then(console.log)
//     .catch(console.error);

// const l = 1024 - 2 * 2 - 3 - 3;

// const str = new Array(l + 1).join('r');
// console.log(str.length)

// const entry = {
//     chainId: "ac44e52c539065efa3563104248c984ef893f0e3351d7c59c93bf022d2214e63",
//     extIds: ["arf", "arf"],
//     content: str
// };
// console.log(entryCost(entry))
// addEntry(entry, "EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD")
//     .then(entryHash => waitOnRevealAck(entryHash, entry.chainId))
//     .then(console.log)
//     .catch(console.error)

// addEntries([{
//         chainId: "332d06db89e9f4fbf7c7940c21ca7aa01a38f8c332d79dcf234538afa9d6b31a",
//         extIds: ["hello-world4"],
//         content: "my content"
//     }, {
//         chainId: "332d06db89e9f4fbf7c7940c21ca7aa01a38f8c332d79dcf234538afa9d6b31a",
//         extIds: ["hello-world6"],
//         content: "my content"
//     }], "EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD")
//     .then(console.log)
//     .catch(console.error);

// getFirstEntry('43649840f6342be91be137e46f447cffaa6796b7fe6f4fdd8acb80744ab1cd6c').then(console.log)

//waitOnRevealAck('831cc02713ae454045607bbb928644b3fd48ec342a2cc6c93dab8aad206bea8e', 'fbf1bb7ffa4ec0bbb0f7dc18cbeb47514102c2eb38fd1f985be3254156b28677');

module.exports = {
    setFactomNode,
    setFactomWallet,
    getAllEntriesOfChain,
    getAllEntriesOfEntryBlock,
    getFirstEntry,
    getChainHead,
    getChainId,
    properties,
    getBalance,
    chainExists,
    entrySize,
    entryCost,
    chainCost,
    addChain,
    addEntry,
    addEntries,
    waitOnRevealAck,
    waitOnCommitAck
};