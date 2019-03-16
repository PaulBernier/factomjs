const { EventEmitter } = require('events'),
    { isValidPublicFctAddress } = require('./addresses');

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
    }

    startPolling(interval = 15000) {
        if (this.interval) {
            throw new Error('Polling already started');
        }

        const checkForNewDirectoryBlock = async () => {
            const block = await this.cli.getDirectoryBlockHead();

            if (block.height > this.height) {
                this.height = block.height;
                this.emit('directoryBlock', block);
            }
        };

        checkForNewDirectoryBlock();
        this.interval = setInterval(() => checkForNewDirectoryBlock(), interval);
        return this;
    }

    stopPolling() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        return this;
    }

    setFactoidTransactionListener(address, transactionListener, opts = {}) {
        if (!isValidPublicFctAddress(address)) {
            throw new Error('Must provide valid public FCT address');
        }

        if (typeof transactionListener !== 'function') {
            throw new Error('Listener must be a function');
        }

        if (typeof opts !== 'object') {
            throw new Error('options must be an object');
        }

        const { receiveFactoids, sendFactoids } = { receiveFactoids: true, sendFactoids: true, ...opts };

        const newDirectoryBlockListener = async block => {
            const factoidBlock = await this.cli.getFactoidBlock(block.factoidBlockRef);
            const factoidTransactions = factoidBlock.transactions.filter(transaction => {
                const inputs = transaction.inputs.filter(input => input.address === address);
                if (receiveFactoids && inputs[0]) {
                    return true;
                }

                const outputs = transaction.outputs.filter(output => output.address === address);
                if (sendFactoids && outputs[0]) {
                    return true;
                }
            });

            if (factoidTransaction[0]) {
                this.emit(address, factoidTransactions);
            }
        };

        this.on(address, transactionListener);
        return this.on('directoryBlock', newDirectoryBlockListener);
    }

    removeFactoidTransactionListener(address, listener) {
        // should this throw an error if there is no listener that matches this address/listener?
        return this.removeListener(address, listener);
    }

    removeAllFactoidTransactionListeners(address) {
        const listeners = this.listeners(address);
        listeners.forEach(listener => this.removeListener(address, listener));
        return this;
    }
}

module.exports = { FactomEvent };
