const { EventEmitter } = require('events'),
    { isValidPublicFctAddress } = require('./addresses'),
    { Transaction } = require('./transaction');

/**
 * Class to listen for new blockchain events
 * @param {FactomCli} cli - FactomCli instance
 * @param {Object} opts - Options
 */
class FactomEvent extends EventEmitter {
    constructor(cli) {
        super();

        this.cli = cli;
        this.height = 0;

        // event names
        this.directoryBlock = 'directoryBlock';
        this.factoidBlock = 'factoidBlock';
    }

    // directory blocks methods

    /**
     * _checkNewDirectoryBlock is a private function used to check the state of the blockchain
     * and compare it to the appliation state. It emits if there is a new directory block
     * @private
     * @async
     */
    async _checkNewDirectoryBlock() {
        const block = await this.cli.getDirectoryBlockHead();

        if (block.height > this.height) {
            this.height = block.height;
            this.emit(this.directoryBlock, block);
        }
    }

    /**
     * startPolling starts polling the blockchain for new blocks. Will throw an error
     * if called whilst polling is already in progress. Must be called at least once during
     * the lifecycle of a FactomEvent instance.
     * @param {number} [interval=15000] - time interval (ms) at which to check for new blocks. Defaults to 15000.
     * @throws - if polling has already been started
     * @returns {FactomEvent} - reference to the class instance
     */
    startPolling(interval = 15000) {
        if (this.interval) {
            throw new Error('Polling already started');
        }

        this._checkNewDirectoryBlock();
        this.interval = setInterval(() => this._checkNewDirectoryBlock(), interval);
        return this;
    }

    /**
     * stopPolling stops polling the blockchain. Must be called when cleaning-up.
     * @returns {FactomEvent} - reference to the class instance.
     */
    stopPolling() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        return this;
    }

    // factoid block methods

    /**
     * _createFactoidBlockEmitter is called when any new address subscription is started.
     * Its purpose is to listen for new directory blocks, then trigger a listener to fetch and emit
     * the new factoid block. There is a guard in place to ensure that it can only create one listener.
     * @private
     */
    async _createFactoidDirectoryBlockListener() {
        if (this.listeners(this.directoryBlock).includes(this._factoidBlockEmitter)) {
            return this;
        }

        return this.on(this.directoryBlock, this._factoidBlockEmitter);
    }

    /**
     * _factoidBlockEmitter is a private listener function that is called when a new directory
     * block is emitted. Should only be active when the user is subscribed to a factoid address.
     * There should only be one _factoidBlockEmitter active at any given time.
     * @param {DirectoryBlock} directoryBlock
     * @emits Object containing factoid and directory block
     * @private
     * @async
     */
    async _factoidBlockEmitter(directoryBlock) {
        const factoidBlock = await this.cli.getFactoidBlock(directoryBlock.factoidBlockRef);
        this.emit(this.factoidBlock, { factoidBlock, directoryBlock });
    }

    async _addressEmitter({ factoidBlock, directoryBlock }) {
        let transactions = factoidBlock.transactions.filter(transaction => {
            if (onSend) {
                var inputs = transaction.inputs.some(input => input.address === address);
            }

            if (onReceive) {
                var outputs = transaction.factoidOutputs.some(output => output.address === address);
            }

            if (inputs || outputs) {
                return true;
            }
        });

        if (transactions[0]) {
            // ensure each transaction contains the blockContext before emitting
            transactions = transactions.map(transaction => {
                return new Transaction(Transaction.builder(transaction), {
                    factoidBlockKeyMR: directoryBlock.factoidBlockRef,
                    directoryBlockHeight: directoryBlock.height,
                    directoryBlockKeyMR: directoryBlock.keyMR
                });
            });
            this.emit(address, transactions);
        }
    }

    /**
     * subscribeToFactoidAddress watches a factoid address for new transactions. It triggers a callback when new transactions
     * are sent and/or received.
     * @param {string} address - Valid factoid address.
     * @param {function} listener - Callback to perform when new transactions are found. Receives an array of type Transation.
     * @param {object} [options]
     * @param {boolean} [options.onReceive] - Emit when receiving transaction at address.
     * @param {boolean} [options.onSend] - Emit when sending transaction from address.
     */
    subscribeToFactoidAddress(address, listener, { onReceive, onSend } = { onReceive: true, onSend: true }) {
        if (!isValidPublicFctAddress(address)) {
            throw new Error('Must provide valid public FCT address');
        }

        if (typeof listener !== 'function') {
            throw new Error('listener must be a function');
        }

        if (!onReceive && !onSend) {
            throw new Error('Either onReceive or onSend must be true');
        }

        // listen to new events at the given address then trigger the user-defined callback
        this.on(address, listener);

        // listen for new factoidBlocks then trigger the listener that may emit a new address event
        this.on(this.factoidBlock);

        // ensure factoid blocks are being polled
        return this._createFactoidDirectoryBlockListener();
    }

    unsubscribeFromFactoidAddress(address, listener) {
        this.removeListener(address, listener);
        // clean up directoryBlock listener that polls factoid blocks if there
        // are no remaining factoid address subscriptions
        const openAddressListeners = this.eventNames().some(name => isValidPublicFctAddress(name));
        if (!openAddressListeners) {
            return this.removeListener(this.directoryBlock, this._factoidBlockEmitter);
        }
        return this;
    }

    unsubscribeFromAllFactoidAddresses() {
        this.eventNames().forEach(name => {
            if (isValidPublicFctAddress(name)) {
                this.listeners(name).forEach(listener => this.removeListener(name, listener));
            }
        });
        return this.removeListener(this.directoryBlock, this._factoidBlockEmitter);
    }
}

module.exports = { FactomEvent };
