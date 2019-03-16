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

    async _pollNewDirectoryBlock() {
        const block = await this.cli.getDirectoryBlockHead();

        if (block.height > this.height) {
            this.height = block.height;
            this.emit(this.directoryBlock, block);
        }
    }

    startPolling(interval = 15000) {
        if (this.interval) {
            throw new Error('Polling already started');
        }

        this._pollNewDirectoryBlock();
        this.interval = setInterval(() => this._pollNewDirectoryBlock(), interval);
        return this;
    }

    stopPolling() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        return this;
    }

    // factoid block methods

    async _pollFactoidBlock(directoryBlock) {
        const factoidBlock = await this.cli.getFactoidBlock(directoryBlock.factoidBlockRef);
        this.emit(this.factoidBlock, { factoidBlock, directoryBlock });
    }

    async _createFactoidBlockEmitter() {
        if (this.listeners(this.directoryBlock).includes(this._pollFactoidBlock)) {
            return this;
        }

        return this.on(this.directoryBlock, this._pollFactoidBlock);
    }

    subscribeToFactoidAddress(address, listener, { onReceive, onSend } = { onReceive: true, onSend: true }) {
        if (!isValidPublicFctAddress(address)) {
            throw new Error('Must provide valid public FCT address');
        }

        if (typeof listener !== 'function') {
            throw new Error('Listener must be a function');
        }

        if (!onReceive && !onSend) {
            throw new Error('Either onReceive or onSend must be true');
        }

        this.on(address, listener);

        this.on(this.factoidBlock, async ({ factoidBlock, directoryBlock }) => {
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
        });

        return this._createFactoidBlockEmitter();
    }

    removeFactoidAddressSubscription(address, listener) {
        return this.removeListener(address, listener);
    }

    removeAllSubscriptionsForFactoidAddress(address) {
        const listeners = this.listeners(address);
        listeners.forEach(listener => this.removeListener(address, listener));
        return this.removeListener(this.directoryBlock, this._pollFactoidBlock);
    }
}

module.exports = { FactomEvent };
