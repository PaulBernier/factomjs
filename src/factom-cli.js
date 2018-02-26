const factomd = require('factomdjs'),
    walletd = require('factom-walletdjs');

const add = require('./add'),
    get = require('./get'),
    ack = require('./ack'),
    wallet = require('./wallet');

class FactomCli {
    constructor(opt) {
        factomd.setFactomNode(`http://${opt.host}:${opt.port}/v2`)
        this.factomd = factomd;
        this.walletd = walletd;
    }

    // Add

    async addChain(chain, ecAddress) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.addChain(this.factomd, chain, ecPrivate);
    }

    async addEntry(entry, ecAddress) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.addEntry(this.factomd, entry, ecPrivate);
    }

    async addEntries(entries, ecAddress) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.addEntries(this.factomd, entries, ecPrivate);
    }

    // Get

    // TODO: handle input string?
    getAllEntriesOfChain(chainId) {
        return get.getAllEntriesOfChain(this.factomd, chainId);
    }

    // TODO: handle input string?
    getChainHead(chainId) {
        return get.getChainHead(this.factomd, chainId);
    }

    getAllEntriesOfEntryBlock(keymr) {
        return get.getAllEntriesOfEntryBlock(this.factomd, keymr);
    }

    // TODO: handle input string?
    getFirstEntry(chainId) {
        return get.getFirstEntry(this.factomd, chainId);
    }

    getBalance(address) {
        return get.getBalance(this.factomd, address);
    }

    getProperties() {
        return get.getProperties(this.factomd);
    }

    // Ack
    waitOnCommitAck(txid, timeout) {
        return ack.waitOnCommitAck(this.factomd, txid, timeout);
    }

    // TODO: handle input string?
    waitOnRevealAck(hash, chainId, timeout) {
        return ack.waitOnRevealAck(factomd, hash, chainId, timeout);
    }
}

module.exports = {
    FactomCli
};