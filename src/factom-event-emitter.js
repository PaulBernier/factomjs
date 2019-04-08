const { EventEmitter } = require('events'),
    Promise = require('bluebird'),
    { isValidPublicFctAddress } = require('./addresses'),
    { Transaction } = require('./transaction');

const FACTOM_EVENT = {
    directoryBlock: 'directoryBlock',
    factoidBlock: 'factoidBlock',
    adminBlock: 'adminBlock',
    entryCreditBlock: 'entryCreditBlock',
    newEntryChain: 'newEntryChain'
};
Object.freeze(FACTOM_EVENT);

/**
 * Listen for new Factom Events.
 * @class
 * @param {FactomCli} cli - FactomCli instance to be used by the FactomEventEmitter instance to fetch blockchain data.
 * @param {object=} opts - Options to set on the FactomEventEmitter instance
 * @param {number} [opts.interval=7500] - Interval (ms) at which the FactomEventEmtitter instance should poll the blockchain to check for a new block.
 * @event directoryBlock - Triggers when blockchain adds a new directory block. Listener receives new directory block.
 * @event factoidBlock - Triggers when blockchain adds a new factoid block. Listener receives new factoid block.
 * @event adminBlock - Triggers when blockchain adds a new admin block. Listener receives new admin block.
 * @event entryCreditBlock - Triggers when blockchain adds a new entry credit block. Listener receives new entry credit block.
 * @event newEntryChain - Triggers when blockchain adds a new entry chain. Listener receives first entry block of new entry chain.
 * @event FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC - Triggers when factoid address sends or receives a transaction. Listener receives transaction.
 * @event 4060c0192a421ca121ffff935889ef55a64574a6ef0e69b2b4f8a0ab919b2ca4 - Triggers when entry chain adds new entry block. Listener receives entry block.
 * @example
 * // logs all new entry blocks for given chain ID.
 * const cli = new FactomCli();
 * const emitter = new FactomEventEmitter(cli, { concurrency: 15, interval: 10000 })
 * emitter.on('4060c0192a421ca121ffff935889ef55a64574a6ef0e69b2b4f8a0ab919b2ca4', console.log)
 */
class FactomEventEmitter extends EventEmitter {
    constructor(cli, opts) {
        super();

        this._cli = cli;
        this._lastBlockHeightProcessed = 0;

        this.opts = {
            interval: 7500,
            ...opts
        };

        // FCT addresses and chain ids still need to be tracked manually for efficiency
        this._entryChainSubscriptions = new Set();
        this._factoidAddressSubscriptions = new Set();

        this.on('removeListener', event => this._removeListener(event));
        this.on('newListener', event => this._newListener(event));
    }

    /**
     * Get active entry chain subscriptions
     * @returns {Set<string>}
     */
    get entryChainSubscriptions() {
        return this._entryChainSubscriptions;
    }

    /**
     * Get active factoid address subscriptions
     * @returns {Set<string>}
     */
    get factoidAddressSubscriptions() {
        return this._factoidAddressSubscriptions;
    }

    /**
     * Determine whether or not polling is currently active.
     * @returns {boolean}
     */
    get isPolling() {
        return !!this._isPolling;
    }

    ///////////////////////////////////////////////////////////////
    //                    MANAGE LISTENERS                      //
    /////////////////////////////////////////////////////////////

    // This method only starts polling and keeps track of "custom" events such as FCT addresses and chain ids
    async _newListener(event) {
        // Should not start polling when listening to non-blockchain events such as 'error'
        if (this._isBlockchainEvent(event)) {
            this._startPolling();
        }

        // Block events are directly handled by the base EventEmitter
        if (Object.values(FACTOM_EVENT).includes(event)) {
            return;
        }

        if (isValidPublicFctAddress(event)) {
            this._factoidAddressSubscriptions.add(event);
        } else if (typeof event === 'string' && event.match(/\b[A-Fa-f0-9]{64}\b/)) {
            this._entryChainSubscriptions.add(event);
        }
    }

    // Counterpart only responsible to stop polling and keep track of custom events
    async _removeListener(event) {
        if (this._entryChainSubscriptions.has(event) && this.listenerCount(event) === 0) {
            this._entryChainSubscriptions.delete(event);
        } else if (this._factoidAddressSubscriptions.has(event) && this.listenerCount(event) === 0) {
            this._factoidAddressSubscriptions.delete(event);
        }

        // Should only stop polling where there are no blockchain listeners active
        if (!this.eventNames().some(this._isBlockchainEvent)) {
            this._stopPolling();
        }
    }

    _isBlockchainEvent(event) {
        if (
            Object.values(FACTOM_EVENT).includes(event) ||
            isValidPublicFctAddress(event) ||
            event.match(/\b[A-Fa-f0-9]{64}\b/)
        ) {
            return true;
        }
    }

    ///////////////////////////////////////////////////////////////
    //              POLL DIRECTORY BLOCKS                       //
    /////////////////////////////////////////////////////////////

    // Start polling the blockchain for new directory blocks
    _startPolling() {
        // Guard should prevent more than one interval from starting
        if (!this.isPolling) {
            this._poll();
            this._isPolling = setInterval(() => this._poll(), this.opts.interval);
        }
    }

    // Stop polling for new directory blocks
    _stopPolling() {
        if (this.isPolling) {
            clearInterval(this._isPolling);
            this._isPolling = false;
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
        } catch (err) {
            this.emit('error', err);
        }
    }

    // Emit new directory blocks then trigger other emitter functions as appropriate
    _handleDirectoryBlock(block) {
        this.emit(FACTOM_EVENT.directoryBlock, block);

        if (this.listenerCount(FACTOM_EVENT.adminBlock)) {
            this._emitAdminBlock(block);
        }

        if (this.listenerCount(FACTOM_EVENT.entryCreditBlock)) {
            this._emitEntryCreditBlock(block);
        }

        if (this.listenerCount(FACTOM_EVENT.factoidBlock) || this._factoidAddressSubscriptions.size > 0) {
            this._emitFactoidBlock(block);
        }

        if (this.listenerCount(FACTOM_EVENT.newEntryChain)) {
            this._emitNewEntryChains(block);
        }

        const entryBlockRefs = block.entryBlockRefs.filter(ref => this._entryChainSubscriptions.has(ref.chainId));
        if (entryBlockRefs.length > 0) {
            this._emitEntryBlock(block);
        }
    }

    ///////////////////////////////////////////////////////////////
    //                      EVENT EMITTERS                      //
    /////////////////////////////////////////////////////////////

    // Emit factoid block and/or trigger factoid transaction emitter function
    async _emitFactoidBlock(directoryBlock) {
        try {
            const factoidBlock = await this._cli.getFactoidBlock(directoryBlock.factoidBlockRef);

            if (this.listenerCount(FACTOM_EVENT.factoidBlock)) {
                this.emit(FACTOM_EVENT.factoidBlock, factoidBlock);
            }

            if (this._factoidAddressSubscriptions.size) {
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
            this.emit(FACTOM_EVENT.adminBlock, adminBlock);
        } catch (err) {
            this.emit('error', err);
        }
    }

    async _emitEntryCreditBlock(directoryBlock) {
        try {
            const entryCreditBlock = await this._cli.getEntryCreditBlock(directoryBlock.entryCreditBlockRef);
            this.emit(FACTOM_EVENT.entryCreditBlock, entryCreditBlock);
        } catch (err) {
            this.emit('error', err);
        }
    }

    // Emit the first entry block of any newly created entry chain.
    async _emitNewEntryChains(directoryBlock) {
        try {
            const checkIfNewChainAndEmit = async ref => {
                const entryBlock = await this._cli.getEntryBlock(ref.keyMR);
                if (entryBlock.sequenceNumber === 0) {
                    this.emit(FACTOM_EVENT.newEntryChain, entryBlock);
                }
            };

            // Fetch entry chains contained in directory block concurrently
            await Promise.map(directoryBlock.entryBlockRefs, checkIfNewChainAndEmit, { concurrency: 5 });
        } catch (err) {
            this.emit('error', err);
        }
    }

    // Emit the latest entry block of any entry chain the user is listening to.
    async _emitEntryBlock(directoryBlock) {
        const fetchAndEmitNewBlock = async chainId => {
            try {
                const entryBlockRef = directoryBlock.entryBlockRefs.find(ref => ref.chainId === chainId);

                if (entryBlockRef) {
                    const entryBlock = await this._cli.getEntryBlock(entryBlockRef.keyMR);
                    this.emit(chainId, entryBlock);
                }
            } catch (err) {
                this.emit('error', err);
            }
        };

        // Fetch new entry blocks concurrently
        await Promise.map(this._entryChainSubscriptions, fetchAndEmitNewBlock, { concurrency: 5 });
    }

    // Emit new factoid transactions for user-defined addresses
    _emitFactoidTransaction(factoidBlock, directoryBlock) {
        const addrs = this._factoidAddressSubscriptions;
        factoidBlock.transactions.forEach(tx => {
            const activeAddresses = new Set();

            // Search transaction inputs and outputs for user-defined addresses
            const findActiveAddresses = io => addrs.has(io.address) && activeAddresses.add(io.address);
            tx.inputs.forEach(findActiveAddresses);
            tx.factoidOutputs.forEach(findActiveAddresses);

            if (activeAddresses.size) {
                // Add the block context to the transaction prior to emitting
                const transaction = new Transaction(Transaction.builder(tx), {
                    factoidBlockKeyMR: directoryBlock.factoidBlockRef,
                    directoryBlockHeight: directoryBlock.height,
                    directoryBlockKeyMR: directoryBlock.keyMR
                });

                activeAddresses.forEach(address => this.emit(address, transaction));
            }
        });
    }
}

module.exports = { FactomEventEmitter, FACTOM_EVENT };
