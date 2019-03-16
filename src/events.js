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

    _pollNewDirectoryBlock = async () => {
        const block = await this.cli.getDirectoryBlockHead();

        if (block.height > this.height) {
            this.height = block.height;
            this.emit(this.directoryBlock, block);
        }
    };

    startPolling(interval = 15000) {
        if (this.interval) {
            throw new Error('Polling already started');
        }

        _pollNewDirectoryBlock();
        this.interval = setInterval(() => _pollNewDirectoryBlock(), interval);
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

    _createFactoidBlockEmitter = () => {
        if (this.eventNames().includes(this.factoidBlock)) {
            return this;
        }

        return this.on(this.directoryBlock, async directoryBlock => {
            const factoidBlock = await this.cli.getFactoidBlock(block.factoidBlockRef);
            this.emit(this.factoidBlock, { factoidBlock, directoryBlock });
        });
    };

    setFactoidAddressListener(address, listener, { onReceive, onSend } = { onReceive: true, onSend: true }) {
        if (!isValidPublicFctAddress(address)) {
            throw new Error('Must provide valid public FCT address');
        }

        if (typeof listener !== 'function') {
            throw new Error('Listener must be a function');
        }

        this.on(address, listener);

        this.on('factoidBlock', async ({ factoidBlock, directoryBlock }) => {
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

    removeFactoidAddressListener(address, listener) {
        return this.removeListener(address, listener);
    }

    removeAllFactoidAddressListeners(address) {
        const listeners = this.listeners(address);
        listeners.forEach(listener => this.removeListener(address, listener));
        return this;
    }
}

module.exports = { FactomEvent };
