const { EventEmitter } = require('events'),
    Promise = require('bluebird'),
    { isValidPublicFctAddress } = require('./addresses'),
    { Transaction } = require('./transaction');

const FACTOM_EVENT = {
    newDirectoryBlock: 'newDirectoryBlock',
    newFactoidBlock: 'newFactoidBlock',
    newAdminBlock: 'newAdminBlock',
    newEntryCreditBlock: 'newEntryCreditBlock',
    newChain: 'newChain'
};
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
 */
class FactomEventEmitter extends EventEmitter {
    constructor(cli, opts) {
        super();

        this._cli = cli;
        this._lastBlockHeightProcessed = 0;
        this._isPolling = false;

        this.opts = {
            interval: 7500,
            ...opts
        };

        // FCT addresses and chain ids still need to be tracked manually for efficiency
        this._chainSubscriptions = new Set();
        this._factoidAddressSubscriptions = new Set();

        this.on('removeListener', event => this._removeListener(event));
        this.on('newListener', event => this._newListener(event));
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
    _newListener(event) {
        // function uses string method
        if (typeof event !== 'string') {
            return;
        }

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
        } else if (event.match(/\b[A-Fa-f0-9]{64}\b/)) {
            this._chainSubscriptions.add(event);
        }
    }

    // Counterpart only responsible to stop polling and keep track of custom events
    _removeListener(event) {
        // function uses string method
        if (typeof event !== 'string') {
            return;
        }

        if (this._chainSubscriptions.has(event) && this.listenerCount(event) === 0) {
            this._chainSubscriptions.delete(event);
        } else if (
            this._factoidAddressSubscriptions.has(event) &&
            this.listenerCount(event) === 0
        ) {
            this._factoidAddressSubscriptions.delete(event);
        }

        // Should only stop polling where there are no blockchain listeners active
        if (!this.eventNames().some(this._isBlockchainEvent)) {
            this._stopPolling();
        }
    }

    _isBlockchainEvent(event) {
        return (
            Object.values(FACTOM_EVENT).includes(event) ||
            isValidPublicFctAddress(event) ||
            event.match(/\b[A-Fa-f0-9]{64}\b/)
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
        } catch (err) {
            this.emit('error', err);
        }
    }

    // Emit new directory blocks then trigger other emitter functions as appropriate
    _handleDirectoryBlock(block) {
        this.emit(FACTOM_EVENT.newDirectoryBlock, block);

        if (this.listenerCount(FACTOM_EVENT.newAdminBlock) > 0) {
            this._emitAdminBlock(block);
        }

        if (this.listenerCount(FACTOM_EVENT.newEntryCreditBlock) > 0) {
            this._emitEntryCreditBlock(block);
        }

        if (
            this.listenerCount(FACTOM_EVENT.newFactoidBlock) > 0 ||
            this._factoidAddressSubscriptions.size > 0
        ) {
            this._emitFactoidBlock(block);
        }

        if (this.listenerCount(FACTOM_EVENT.newChain) > 0) {
            this._emitNewChains(block);
        }

        const entryBlockRefs = block.entryBlockRefs.filter(ref =>
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

            if (this.listenerCount(FACTOM_EVENT.newFactoidBlock) > 0) {
                this.emit(FACTOM_EVENT.newFactoidBlock, factoidBlock);
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
            this.emit(FACTOM_EVENT.newAdminBlock, adminBlock);
        } catch (err) {
            this.emit('error', err);
        }
    }

    async _emitEntryCreditBlock(directoryBlock) {
        try {
            const entryCreditBlock = await this._cli.getEntryCreditBlock(
                directoryBlock.entryCreditBlockRef
            );
            this.emit(FACTOM_EVENT.newEntryCreditBlock, entryCreditBlock);
        } catch (err) {
            this.emit('error', err);
        }
    }

    // Emit the first entry block of any newly created entry chain.
    async _emitNewChains(directoryBlock) {
        try {
            const checkIfNewChainAndEmit = async ref => {
                const entryBlock = await this._cli.getEntryBlock(ref.keyMR);
                if (entryBlock.sequenceNumber === 0) {
                    this.emit(FACTOM_EVENT.newChain, entryBlock);
                }
            };

            // Fetch entry chains contained in directory block concurrently
            await Promise.map(directoryBlock.entryBlockRefs, checkIfNewChainAndEmit, {
                concurrency: 10
            });
        } catch (err) {
            this.emit('error', err);
        }
    }

    // Emit the latest entry block of any entry chain the user is listening to.
    async _emitEntryBlock(entryBlockRefs) {
        const fetchAndEmitNewBlock = async ref => {
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
        factoidBlock.transactions.forEach(tx => {
            // Search transaction inputs and outputs for user-defined addresses
            const activeAddresses = new Set(
                [...tx.inputs, ...tx.factoidOutputs]
                    .filter(io => addrs.has(io.address))
                    .map(io => io.address)
            );

            if (activeAddresses.size > 0) {
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
