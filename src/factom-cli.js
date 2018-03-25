const factomdjs = require('factomdjs'),
    camelCase = require('camelcase'),
    walletd = require('factom-walletdjs');

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

        this.factomd = getFactomd(factomdConf);
        this.walletd = getWalletd(walletdConf);
    }

    //////////////////
    // Primary API //
    ////////////////

    // Add

    async addChain(chain, ecAddress, options) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.addChain(this.factomd, chain, ecPrivate, options);
    }

    async addChains(chains, ecAddress, options) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.addChains(this.factomd, chains, ecPrivate, options);
    }

    async commitChain(chain, ecAddress, commitAckTimeout) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.commitChain(this.factomd, chain, ecPrivate, commitAckTimeout);
    }

    async revealChain(chain, revealAckTimeout) {
        return add.revealChain(this.factomd, chain, revealAckTimeout);
    }

    async addEntry(entry, ecAddress, options) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.addEntry(this.factomd, entry, ecPrivate, options);
    }

    async addEntries(entries, ecAddress, options) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.addEntries(this.factomd, entries, ecPrivate, options);
    }

    async commitEntry(entry, ecAddress, commitAckTimeout) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.commitEntry(this.factomd, entry, ecPrivate, commitAckTimeout);
    }

    async revealEntry(entry, revealAckTimeout) {
        return add.revealEntry(this.factomd, entry, revealAckTimeout);
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

    getFactoidTransaction(originAddress, recipientAddress, amount, fees) {
        return send.getFactoidTransaction(this.factomd, this.walletd, originAddress, recipientAddress, amount, fees);
    }

    getEntryCreditPurchaseTransaction(originAddress, recipientAddress, ecAmount, fees) {
        return send.getEntryCreditPurchaseTransaction(this.factomd, this.walletd, originAddress, recipientAddress, ecAmount, fees);
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

    factomdApi(api, ...args) {
        return this.factomd[camelCase(api)](...args);
    }

    walletdApi(api, args) {
        return this.walletd(camelCase[api])(...args);
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

function getFactomd(conf) {
    const factomd = new factomdjs.Factomd();

    const configuration = conf || {};
    const host = configuration.host || 'localhost';
    const port = configuration.port || 8088;
    factomd.setFactomNode(`http://${host}:${port}/v2`);

    return factomd;
}

function getWalletd(conf) {
    const configuration = conf || {};
    const host = configuration.host || 'localhost';
    const port = configuration.port || 8089;
    walletd.setFactomNode(`http://${host}:${port}/v2`);

    return walletd;
}

module.exports = {
    FactomCli
};