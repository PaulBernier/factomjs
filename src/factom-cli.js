const factomdjs = require('factomdjs'),
    camelCase = require('camelcase'),
    walletd = require('factom-walletdjs');

const add = require('./add'),
    send = require('./send'),
    get = require('./get'),
    ack = require('./ack'),
    wallet = require('./wallet');

class FactomCli {
    constructor(opt) {
        const factomd = new factomdjs.Factomd();
        factomd.setFactomNode(`http://${opt.host}:${opt.port}/v2`);
        this.factomd = factomd;
        this.walletd = walletd;
    }

    //////////////////
    // Primary API //
    ////////////////

    // Add

    async addChain(chain, ecAddress) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.addChain(this.factomd, chain, ecPrivate);
    }

    async addChains(chains, ecAddress) {
        const ecPrivate = await wallet.getPrivateAddress(this.walletd, ecAddress);
        return add.addChains(this.factomd, chains, ecPrivate);
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

    getProperties() {
        return get.getProperties(this.factomd);
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

    sendTransaction(transaction) {
        return send.sendTransaction(this.factomd, transaction);
    }

    sendTransactionNoAck(transaction) {
        return send.sendTransactionNoAck(this.factomd, transaction);
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

    getDirectoryBlockHead() {
        return get.getDirectoryBlockHead(this.factomd);
    }

    getDirectoryBlock(keymr) {
        return get.getDirectoryBlock(this.factomd, keymr);
    }

    getEntryBlock(keymr) {
        return get.getEntryBlock(this.factomd, keymr);
    }

    getFactoidBlock(keymr) {
        return get.getFactoidBlock(this.factomd, keymr);
    }

    getEntryCreditBlock(keymr) {
        return get.getEntryCreditBlock(this.factomd, keymr);
    }
}

module.exports = {
    FactomCli
};