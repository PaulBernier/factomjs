const { FactomdCli, WalletdCli } = require('./apis-cli');

const add = require('./add'),
    send = require('./send'),
    get = require('./get'),
    ack = require('./ack'),
    wallet = require('./wallet');

class FactomCli {
    constructor(opts) {
        const options = opts || {};
        const factomdConf = options.factomd || options;
        const walletdConf = options.walletd;

        this.factomd = new FactomdCli(factomdConf);
        this.walletd = new WalletdCli(walletdConf);
    }

    //////////////////
    // Primary API //
    ////////////////

    // Commit, reveal, add

    async commit(obj, ecAddress, commitAckTimeout) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.commit(this.factomd, obj, ecPrivate, commitAckTimeout);
    }

    async commitChain(chain, ecAddress, commitAckTimeout) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.commitChain(this.factomd, chain, ecPrivate, commitAckTimeout);
    }

    async commitEntry(entry, ecAddress, commitAckTimeout) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.commitEntry(this.factomd, entry, ecPrivate, commitAckTimeout);
    }

    async reveal(obj, revealAckTimeout) {
        return add.reveal(this.factomd, obj, revealAckTimeout);
    }

    async revealChain(chain, revealAckTimeout) {
        return add.revealChain(this.factomd, chain, revealAckTimeout);
    }

    async revealEntry(entry, revealAckTimeout) {
        return add.revealEntry(this.factomd, entry, revealAckTimeout);
    }

    async add(obj, ecAddress, options) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.add(this.factomd, obj, ecPrivate, options);
    }

    async addChain(chain, ecAddress, options) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.addChain(this.factomd, chain, ecPrivate, options);
    }

    async addChains(chains, ecAddress, options) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.addChains(this.factomd, chains, ecPrivate, options);
    }

    async addEntry(entry, ecAddress, options) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.addEntry(this.factomd, entry, ecPrivate, options);
    }

    async addEntries(entries, ecAddress, options) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.addEntries(this.factomd, entries, ecPrivate, options);
    }

    // Get

    getAllEntriesOfChain(chainId) {
        return get.getAllEntriesOfChain(this.factomd, chainId);
    }

    getChainHead(chainId) {
        return get.getChainHead(this.factomd, chainId);
    }

    getEntry(entryHash) {
        return get.getEntry(this.factomd, entryHash);
    }

    getEntryWithBlockContext(entryHash) {
        return get.getEntryWithBlockContext(this.factomd, entryHash);
    }

    getFirstEntry(chainId) {
        return get.getFirstEntry(this.factomd, chainId);
    }

    getBalance(address) {
        return get.getBalance(this.factomd, address);
    }

    getNodeProperties() {
        return get.getProperties(this.factomd);
    }

    getWalletProperties() {
        return get.getProperties(this.walletd);
    }

    chainExists(chainId) {
        return get.chainExists(this.factomd, chainId);
    }

    getEntryCreditRate() {
        return get.getEntryCreditRate(this.factomd);
    }

    getTransaction(txId) {
        return get.getTransaction(this.factomd, txId);
    }

    // Send transactions

    sendTransaction(transaction, options) {
        return send.sendTransaction(this.factomd, transaction, options);
    }

    async createFactoidTransaction(originAddress, recipientAddress, amount, fees) {
        const originPrivateAddress = await wallet.getPrivateAddress(this.walletd, originAddress);
        return send.createFactoidTransaction(this.factomd, originPrivateAddress, recipientAddress, amount, fees);
    }

    async createEntryCreditPurchaseTransaction(originAddress, recipientAddress, ecAmount, fees) {
        const originPrivateAddress = await wallet.getPrivateAddress(this.walletd, originAddress);
        return send.createEntryCreditPurchaseTransaction(this.factomd, originPrivateAddress, recipientAddress, ecAmount, fees);
    }

    // Ack
    waitOnCommitAck(txId, timeout) {
        return ack.waitOnCommitAck(this.factomd, txId, timeout);
    }

    waitOnRevealAck(hash, chainId, timeout) {
        return ack.waitOnRevealAck(this.factomd, hash, chainId, timeout);
    }

    waitOnFactoidTransactionAck(txId, timeout) {
        return ack.waitOnFactoidTransactionAck(this.factomd, txId, timeout);
    }

    ////////////////////
    // Secondary API //
    //////////////////

    factomdApi(method, params) {
        return this.factomd.call(method, params);
    }

    walletdApi(method, params) {
        return this.walletd.call(method, params);
    }

    getHeights() {
        return get.getHeights(this.factomd);
    }

    getDirectoryBlockHead() {
        return get.getDirectoryBlockHead(this.factomd);
    }

    getDirectoryBlock(arg) {
        return get.getDirectoryBlock(this.factomd, arg);
    }

    getAdminBlock(arg) {
        return get.getAdminBlock(this.factomd, arg);
    }

    getEntryBlock(keyMR) {
        return get.getEntryBlock(this.factomd, keyMR);
    }

    getFactoidBlock(arg) {
        return get.getFactoidBlock(this.factomd, arg);
    }

    getEntryCreditBlock(arg) {
        return get.getEntryCreditBlock(this.factomd, arg);
    }
}

module.exports = {
    FactomCli
};