const { EventEmitter } = require('events'),
    Promise = require('bluebird'),
    { isValidPublicFctAddress } = require('./addresses'),
    { isValidChainId } = require('./chain'),
    { Transaction } = require('./transaction');

const BLOCK_EVENT = {
    newDirectoryBlock: 'newDirectoryBlock',
    newFactoidBlock: 'newFactoidBlock',
    newAdminBlock: 'newAdminBlock',
    newEntryCreditBlock: 'newEntryCreditBlock',
    newChain: 'newChain',
};

const PENDING_EVENT = {
    newPendingTransaction: 'newPendingTransaction',
};

const FACTOM_EVENT = { ...BLOCK_EVENT, ...PENDING_EVENT };
Object.freeze(FACTOM_EVENT);
/**
 * Listen for new Factom Events:
 *
 * <ul>
 * <li>newDirectoryBlock - Triggers when blockchain adds a new directory block. Listener receives new directory block.</li>
 * <li>newFactoidBlock - Triggers when blockchain adds a new factoid block. Listener receives new factoid block.</li>
 * <li>newAdminBlock - Triggers when blockchain adds a new admin block. Listener receives new admin block.</li>
 * <li>newEntryCreditBlock - Triggers when blockchain adds a new entry credit block. Listener receives new entry credit block.</li>
 * <li>newChain - Triggers when blockchain adds a new chain. Listener receives first entry block of new chain.</li>
 * <li>FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC - Triggers when factoid address sends or receives a transaction. Listener receives transaction.</li>
 * <li>4060c0192a421ca121ffff935889ef55a64574a6ef0e69b2b4f8a0ab919b2ca4 - Triggers when entry chain adds new entry block. Listener receives entry block.</li>
 * <li>newPendingTransaction:FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC - Triggers when factoid address receives a new pending transaction.</li>
 * </ul>
 *
 * @class
 * @param {FactomCli} cli - FactomCli instance to be used by the FactomEventEmitter instance to fetch blockchain data.
 * @param {object} [opts] - Options to set on the FactomEventEmitter instance
 * @param {number} [opts.interval=7500] - Interval (ms) at which the FactomEventEmtitter instance should poll the blockchain to check for a new block.
 * @example
 * const { FactomCli, FactomEventEmitter } = require('factom');
 * const cli = new FactomCli();
 * // Poll the blockchain every 10s
 * const emitter = new FactomEventEmitter(cli, { interval: 10000 });
 * emitter.on('newDirectoryBlock', (directoryBlock) => ...);
 * emitter.on('newFactoidBlock', (factoidBlock) => ...);
 * emitter.on('newAdminBlock', (adminBlock) => ...);
 * emitter.on('newEntryCreditBlock', (entryCreditBlock) => ...);
 * emitter.on('newChain', (entryBlock) => ...);
 * // Listen to any transaction involving a given Factoid address
 * emitter.on('FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC', (transaction) => ...);
 * // Listen to any new entries in a given chain
 * emitter.on('4060c0192a421ca121ffff935889ef55a64574a6ef0e69b2b4f8a0ab919b2ca4', (entryBlock) => ...);
 * // Listen to any pending transactions involving a given Factoid address
 * emitter.on(FactomEventEmitter.getSubscriptionToken({
 *  eventType: 'newPendingTransaction', topic: 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC'
 * }), (pendingTransaction) => ...);
 */
class FactomEventEmitter extends EventEmitter {
    /**
     * Given an event configuration object returns a tokenized string
     * @param {Object} event - The event configuration object
     * @param {string} event.eventType - The type of event e.g. newPendingTransaction
     * @param {string} event.topic - The topic e.g. A Factoid address
     * @returns {string}
     */
    static getSubscriptionToken({ eventType, topic }) {
        return `${eventType}:${topic}`;
    }

    constructor(cli, opts = {}) {
        super();

        this._cli = cli;
        this._lastBlockHeightProcessed = 0;
        this._isPolling = false;

        this.opts = {
            interval: 7500,
            ...opts,
        };

        // FCT addresses and chain ids still need to be tracked manually for efficiency
        this._chainSubscriptions = new Set();
        this._factoidAddressSubscriptions = new Set();

        // Map of FCT addresses and pending transactions
        this._factoidAddressPendingTransactionSubscriptions = new Map();

        this.on('removeListener', (event) => this._removeListener(event));
        this.on('newListener', (event) => this._newListener(event));
    }

    /**
     * Get active chain id subscriptions
     * @returns {Set<string>}
     */
    get chainSubscriptions() {
        return this._chainSubscriptions;
    }

    /**
     * Get active factoid address subscriptions
     * @returns {Set<string>}
     */
    get factoidAddressSubscriptions() {
        return this._factoidAddressSubscriptions;
    }

    /**
     * Get active factoid pending transactions subscriptions
     * @returns {Map<string, Set<string>>}
     */
    get factoidAddressPendingTransactionSubscriptions() {
        return this._factoidAddressPendingTransactionSubscriptions;
    }

    /**
     * Determine whether or not polling is currently active.
     * @returns {boolean}
     */
    get isPolling() {
        return this._isPolling;
    }

    ///////////////////////////////////////////////////////////////
    //                    MANAGE LISTENERS                      //
    /////////////////////////////////////////////////////////////

    // This method only starts polling and keeps track of "custom" events such as FCT addresses and chain ids
    async _newListener(event) {
        // Should not start polling when listening to non-blockchain events such as 'error'
        if (this._isBlockchainEvent(event)) {
            this._startPolling();
        } else return;

        // Block events are directly handled by the base EventEmitter
        if (this._isValidBlockEvent(event)) {
            return;
        }

        if (isValidPublicFctAddress(event)) {
            this._factoidAddressSubscriptions.add(event);
        } else if (isValidChainId(event)) {
            this._chainSubscriptions.add(event);
        } else if (this._isValidPendingTransactionEvent(event)) {
            const address = event.split(':')[1];
            if (!this._factoidAddressPendingTransactionSubscriptions.has(address)) {
                const pendingTransactions = await this.getPendingTransactions(address);
                const pendingTransactionIds = new Set(
                    pendingTransactions.map((tx) => tx.transactionid)
                );
                this._factoidAddressPendingTransactionSubscriptions.set(
                    address,
                    pendingTransactionIds
                );
            }
        }
    }

    // Counterpart only responsible to stop polling and keep track of custom events
    _removeListener(event) {
        if (!this._isBlockchainEvent(event)) {
            return;
        }

        if (
            isValidChainId(event) &&
            this._chainSubscriptions.has(event) &&
            this.listenerCount(event) === 0
        ) {
            this._chainSubscriptions.delete(event);
        } else if (
            isValidPublicFctAddress(event) &&
            this._factoidAddressSubscriptions.has(event) &&
            this.listenerCount(event) === 0
        ) {
            this._factoidAddressSubscriptions.delete(event);
        } else if (this._isValidPendingTransactionEvent(event)) {
            const address = event.split(':')[1];
            if (
                this._factoidAddressPendingTransactionSubscriptions.has(address) &&
                this.listenerCount(event) === 0
            ) {
                this._factoidAddressPendingTransactionSubscriptions.delete(address);
            }
        }

        // Should only stop polling where there are no blockchain listeners active
        if (!this.eventNames().some((event) => this._isBlockchainEvent(event))) {
            this._stopPolling();
        }
    }

    /**
     * Determine if a given event is a valid block event
     * @param {event} event
     * @returns {boolean}
     */
    _isValidBlockEvent(event) {
        return Object.values(BLOCK_EVENT).includes(event);
    }

    /**
     * Determine if a given event is a valid pending transaction event
     * @param {string} - event
     * @returns {boolean}
     */
    _isValidPendingTransactionEvent(event) {
        const [eventType, address] = event.split(':');
        return (
            eventType === PENDING_EVENT.newPendingTransaction &&
            address !== undefined &&
            isValidPublicFctAddress(address)
        );
    }

    /**
     * Determine if a given event is a valid blockchain event
     * @param {string} event
     * @returns {boolean}
     */
    _isBlockchainEvent(event) {
        return (
            typeof event === 'string' &&
            (this._isValidBlockEvent(event) ||
                isValidPublicFctAddress(event) ||
                isValidChainId(event) ||
                this._isValidPendingTransactionEvent(event))
        );
    }

    ///////////////////////////////////////////////////////////////
    //              POLL DIRECTORY BLOCKS                       //
    /////////////////////////////////////////////////////////////

    // Start polling the blockchain for new directory blocks
    async _startPolling() {
        try {
            // Guard should prevent more than one interval from starting
            if (!this.isPolling) {
                this._isPolling = true;

                // Prevents the head of the blockchain from emitting as a new block.
                const heights = await this._cli.getHeights();
                this._lastBlockHeightProcessed = heights.directoryBlockHeight;

                // Start polling the blockchain for the next height.
                this._pollingInterval = setInterval(() => this._poll(), this.opts.interval);
            }
        } catch (err) {
            this.emit('error', err);
        }
    }

    // Stop polling for new directory blocks
    _stopPolling() {
        if (this.isPolling) {
            this._isPolling = false;
            clearInterval(this._pollingInterval);
        }
    }

    // Handle the polling logic
    async _poll() {
        try {
            const block = await this._cli.getDirectoryBlockHead();
            if (block.height > this._lastBlockHeightProcessed) {
                this._lastBlockHeightProcessed = block.height;
                this._handleDirectoryBlock(block);
            }
            if (this._factoidAddressPendingTransactionSubscriptions.size > 0) {
                this._checkPendingTransactions();
            }
        } catch (err) {
            this.emit('error', err);
        }
    }

    // Check pending address subscriptions for any pending transactions
    async _checkPendingTransactions() {
        for (const fctAddress of this._factoidAddressPendingTransactionSubscriptions.keys()) {
            const pendingTransactions = await this.getPendingTransactions(fctAddress);

            if (pendingTransactions.length > 0) {
                this._handlePendingTransactions(fctAddress, pendingTransactions);
            }
        }
    }

    /* Trigger pending transaction emitter if there are new pending transactions
     * and update subscribed transactions
     */
    _handlePendingTransactions(fctAddress, pendingTransactions) {
        const subscribedTransactionIds =
            this._factoidAddressPendingTransactionSubscriptions.get(fctAddress);

        for (const pendingTransaction of pendingTransactions) {
            if (!subscribedTransactionIds.has(pendingTransaction.transactionid)) {
                this._emitPendingFactoidTransaction(fctAddress, pendingTransaction);
            }
        }

        this._factoidAddressPendingTransactionSubscriptions.set(
            fctAddress,
            new Set(pendingTransactions.map((tx) => tx.transactionid))
        );
    }

    // Emit new directory blocks then trigger other emitter functions as appropriate
    _handleDirectoryBlock(block) {
        this.emit(BLOCK_EVENT.newDirectoryBlock, block);

        if (this.listenerCount(BLOCK_EVENT.newAdminBlock) > 0) {
            this._emitAdminBlock(block);
        }

        if (this.listenerCount(BLOCK_EVENT.newEntryCreditBlock) > 0) {
            this._emitEntryCreditBlock(block);
        }

        if (
            this.listenerCount(BLOCK_EVENT.newFactoidBlock) > 0 ||
            this._factoidAddressSubscriptions.size > 0
        ) {
            this._emitFactoidBlock(block);
        }

        if (this.listenerCount(BLOCK_EVENT.newChain) > 0) {
            this._emitNewChains(block);
        }

        const entryBlockRefs = block.entryBlockRefs.filter((ref) =>
            this._chainSubscriptions.has(ref.chainId)
        );
        if (entryBlockRefs.length > 0) {
            this._emitEntryBlock(entryBlockRefs);
        }
    }

    ///////////////////////////////////////////////////////////////
    //                      EVENT EMITTERS                      //
    /////////////////////////////////////////////////////////////

    // Emit factoid block and/or trigger factoid transaction emitter function
    async _emitFactoidBlock(directoryBlock) {
        try {
            const factoidBlock = await this._cli.getFactoidBlock(directoryBlock.factoidBlockRef);

            if (this.listenerCount(BLOCK_EVENT.newFactoidBlock) > 0) {
                this.emit(BLOCK_EVENT.newFactoidBlock, factoidBlock);
            }

            if (this._factoidAddressSubscriptions.size > 0) {
                // Must pass directoryBlock through to access block context
                this._emitFactoidTransaction(factoidBlock, directoryBlock);
            }
        } catch (err) {
            this.emit('error', err);
        }
    }

    async _emitAdminBlock(directoryBlock) {
        try {
            const adminBlock = await this._cli.getAdminBlock(directoryBlock.adminBlockRef);
            this.emit(BLOCK_EVENT.newAdminBlock, adminBlock);
        } catch (err) {
            this.emit('error', err);
        }
    }

    async _emitEntryCreditBlock(directoryBlock) {
        try {
            const entryCreditBlock = await this._cli.getEntryCreditBlock(
                directoryBlock.entryCreditBlockRef
            );
            this.emit(BLOCK_EVENT.newEntryCreditBlock, entryCreditBlock);
        } catch (err) {
            this.emit('error', err);
        }
    }

    // Emit the first entry block of any newly created entry chain.
    async _emitNewChains(directoryBlock) {
        try {
            const checkIfNewChainAndEmit = async (ref) => {
                const entryBlock = await this._cli.getEntryBlock(ref.keyMR);
                if (entryBlock.sequenceNumber === 0) {
                    this.emit(BLOCK_EVENT.newChain, entryBlock);
                }
            };

            // Fetch entry chains contained in directory block concurrently
            await Promise.map(directoryBlock.entryBlockRefs, checkIfNewChainAndEmit, {
                concurrency: 10,
            });
        } catch (err) {
            this.emit('error', err);
        }
    }

    // Emit the latest entry block of any entry chain the user is listening to.
    async _emitEntryBlock(entryBlockRefs) {
        const fetchAndEmitNewBlock = async (ref) => {
            try {
                const entryBlock = await this._cli.getEntryBlock(ref.keyMR);
                this.emit(ref.chainId, entryBlock);
            } catch (err) {
                this.emit('error', err);
            }
        };

        // Fetch new entry blocks concurrently
        await Promise.map(entryBlockRefs, fetchAndEmitNewBlock, { concurrency: 10 });
    }

    // Emit new factoid transactions for user-defined addresses
    _emitFactoidTransaction(factoidBlock, directoryBlock) {
        const addrs = this._factoidAddressSubscriptions;
        factoidBlock.transactions.forEach((tx) => {
            // Search transaction inputs and outputs for user-defined addresses
            const activeAddresses = new Set(
                [...tx.inputs, ...tx.factoidOutputs]
                    .filter((io) => addrs.has(io.address))
                    .map((io) => io.address)
            );

            if (activeAddresses.size > 0) {
                // Add the block context to the transaction prior to emitting
                const transaction = new Transaction(Transaction.builder(tx), {
                    factoidBlockKeyMR: directoryBlock.factoidBlockRef,
                    directoryBlockHeight: directoryBlock.height,
                    directoryBlockKeyMR: directoryBlock.keyMR,
                });

                activeAddresses.forEach((address) => this.emit(address, transaction));
            }
        });
    }

    // Emit new pending factoid transaction for user-defined FCT address
    _emitPendingFactoidTransaction(fctAddress, transaction) {
        this.emit(`${PENDING_EVENT.newPendingTransaction}:${fctAddress}`, transaction);
    }

    /**
     * Get pending FCT transactions for a given FCT address
     * @param {string} - address
     * @returns {array} - Array of pending FCT transactions
     */
    getPendingTransactions(address) {
        try {
            return this._cli.factomdApi('pending-transactions', {
                address: address,
            });
        } catch (err) {
            this.emit('error', err);
        }
    }
}

module.exports = { FactomEventEmitter, FACTOM_EVENT };
