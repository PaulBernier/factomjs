const { EventEmitter } = require('events'),
    Promise = require('bluebird'),
    { isValidPublicFctAddress } = require('./addresses'),
    { Transaction } = require('./transaction');

/**
 * Subscribe to new factom events
 * @param {FactomCli} cli - FactomCli instance
 * @param {Object} opts - Options
 * @class
 */
class FactomEvent extends EventEmitter {
    constructor(cli) {
        super();

        this._cli = cli;
        this._dBlock = {};

        // event names
        this.directoryBlock = 'directoryBlock';
        this.factoidBlock = 'factoidBlock';
        this.adminBlock = 'adminBlock';
        this.entryCreditBlock = 'entryCreditBlock';
        this.entryChain = 'entryChain';
        this.factoidTransaction = 'factoidTransaction';

        // user subscriptions
        this._entryChainSubscriptions = new Set();
        this._factoidAddressSubscriptions = {};
        this._isSubscribedToFactoidBlocks = false;
        this._isSubscribedToAdminBlocks = false;
        this._isSubscribeToEntryCreditBlocks = false;
    }

    ///////////////////////////////////////////////////////////////
    //              DIRECTORY BLOCK METHODS                     //
    /////////////////////////////////////////////////////////////

    /**
     * check whether polling is currently in process
     * @returns {boolean}
     */
    get isPolling() {
        return this._isPolling ? true : false;
    }

    /**
     * subscribe to and emit new directory blocks using the 'directoryBlock' or FactomEvent.directoryBlock event. 
     * This function drives all other subscriptions and must be called at least once during the lifecycle of a FactomEvent instance.
     * It will throw an error if called when polling is already in process.
     * @param {number} [interval=15000] - time interval (ms) at which to check for new blocks. Defaults to 15000.
     * @throws - if polling has already been started
     * @returns {FactomEvent} - reference to the class instance
     */
    startPolling(interval = 15000) {
        if (this._isPolling) {
            throw new Error('polling already started');
        }

        if (typeof interval !== 'number' || interval < 0) {
            throw new Error('interval must be a positive number');
        }

        this._checkNewDirectoryBlock();
        this._isPolling = setInterval(() => this._checkNewDirectoryBlock(), interval);
        return this;
    }

    /**
     * stop polling the blockchain. Must be called when cleaning-up.
     * @returns {FactomEvent} - reference to the class instance.
     */
    stopPolling() {
        if (this._isPolling) {
            clearInterval(this._isPolling);
            this._isPolling = false;
        }

        return this;
    }

    /**
     * _checkNewDirectoryBlock is a private function used to check the state of the blockchain
     * and compare it to the appliation state. It emits if there is a new directory block
     * @private
     * @async
     */
    async _checkNewDirectoryBlock() {
        const block = await this._cli.getDirectoryBlockHead();

        if (this._dBlock.height === undefined || block.height > this._dBlock.height) {
            this._dBlock = block;
            this.emit(this.directoryBlock, block);
        }
    }

    ///////////////////////////////////////////////////////////////
    //              FACTOID BLOCK SUBSCRIPTION                  //
    /////////////////////////////////////////////////////////////

    /**
     * check whether currently subscribed to factoid blocks
     * @returns {boolean}
     */
    get isSubscribedToFactoidBlocks() {
        return this._isSubscribedToFactoidBlocks;
    }

    /**
     * subscribe to and emit new factoid blocks using the 'factoidBlock' or FactomEvent.factoidBlock event
     * @returns {FactomEvent}
     */
    subscribeToFactoidBlocks() {
        this._isSubscribedToFactoidBlocks = true;
        if (!this.listeners(this.directoryBlock).includes(this._fetchFactoidBlock)) {
            this.on(this.directoryBlock, this._fetchFactoidBlock);
        }
        return this;
    }

    /**
     * unsubscribe from factoid blocks
     * @returns {FactomEvent}
     */
    unsubscribeFromFactoidBlocks() {
        this._isSubscribedToFactoidBlocks = false;
        this._handleRemoveFactoidBlockListener();
        return this;
    }

    /**
     * listener that triggers on a 'directoryBlock' event. It fetches the factoid block referenced
     * in the emitted directory block, then will emit that directly and/or pass it into _handleFactoidAddressSubscription.
     * @param {DirectoryBlock} directoryBlock 
     * @private
     */
    async _fetchFactoidBlock(directoryBlock) {
        const factoidBlock = await this._cli.getFactoidBlock(directoryBlock.factoidBlockRef);

        if (this._isSubscribedToFactoidBlocks) {
            this.emit(this.factoidBlock, factoidBlock);
        }

        const hasAddressSubscriptions = Object.keys(this._factoidAddressSubscriptions).length;
        if (hasAddressSubscriptions) {
            this._handleFactoidAddressSubscriptions(factoidBlock);
        }
    }

    /**
     * remove the factoid block listener that triggers on a 'directoryBlock' event.
     * Will only remove listener when there are no factoid block or factoid address subscriptions active
     * @private
     */
    _handleRemoveFactoidBlockListener() {
        const hasAddressSubscriptions = Object.keys(this._factoidAddressSubscriptions).length;
        if (!hasAddressSubscriptions && !this._isSubscribedToFactoidBlocks) {
            this.removeListener(this.directoryBlock, this._fetchFactoidBlock);
        }
    }

    ///////////////////////////////////////////////////////////////
    //              ADMIN BLOCK SUBSCRIPTION                    //
    /////////////////////////////////////////////////////////////

    /**
     * check whether currently subscribed to admin blocks
     * @returns {boolean}
     */
    get isSubscribedToAdminBlocks() {
        return this._isSubscribedToAdminBlocks;
    }

    /**
     * subscribe to and emit new admin blocks using the 'adminBlock' or FactomEvent.adminBlock event
     * @returns {FactomEvent}
     */
    subscribeToAdminBlocks() {
        this._isSubscribedToAdminBlocks = true;
        if (!this.listeners(this.directoryBlock).includes(this._fetchAdminBlock)) {
            this.on(this.directoryBlock, this._fetchAdminBlock);
        }
        return this;
    }

    /**
     * unsubscribe from admin blocks
     * @returns {FactomEvent}
     */
    unsubscribeFromAdminBlocks() {
        this._isSubscribedToAdminBlocks = false;
        return this.removeListener(this.directoryBlock, this._fetchAdminBlock);
    }

    /**
     * listener that triggers on a 'directoryBlock' event. It fetches the admin block referenced
     * in the emitted directory block, then will emit that directly.
     * @param {DirectoryBlock} directoryBlock 
     * @private
     */
    async _fetchAdminBlock(directoryBlock) {
        const adminBlock = await this._cli.getAdminBlock(directoryBlock.adminBlockRef);
        this.emit(this.adminBlock, adminBlock);
    }

    ///////////////////////////////////////////////////////////////
    //              ENTRY CREDIT BLOCK SUBSCRIPTION             //
    /////////////////////////////////////////////////////////////

    /**
     * check whether currently subscribed to entry credit blocks
     * @returns {boolean}
     */
    get isSubscribeToEntryCreditBlocks() {
        return this._isSubscribeToEntryCreditBlocks;
    }

    /**
     * subscribe to and emit new entry credit blocks using the 'entryCreditBlock' or FactomEvent.entryCreditBlock event
     * @returns {FactomEvent}
     */
    subscribeToEntryCreditBlocks() {
        this._isSubscribeToEntryCreditBlocks = true;
        if (!this.listeners(this.directoryBlock).includes(this._fetchEntryCreditBlock)) {
            this.on(this.directoryBlock, this._fetchEntryCreditBlock);
        }
        return this;
    }

    /**
     * unsubscribe from entry credit blocks
     * @returns {FactomEvent}
     */
    unsubscribeFromEntryCreditBlocks() {
        this._isSubscribeToEntryCreditBlocks = false;
        return this.removeListener(this.directoryBlock, this._fetchEntryCreditBlock);
    }

    /**
     * listener that triggers on a 'directoryBlock' event. It fetches the entry credit block referenced
     * in the emitted directory block, then will emit that directly.
     * @param {DirectoryBlock} directoryBlock 
     * @private
     */
    async _fetchEntryCreditBlock(directoryBlock) {
        const entryCreditBlock = await this._cli.getEntryCreditBlock(directoryBlock.entryCreditBlockRef);
        this.emit(this.entryCreditBlock, entryCreditBlock);
    }

    ///////////////////////////////////////////////////////////////
    //              ENTRY CHAIN SUBSCRIPTION                    //
    /////////////////////////////////////////////////////////////

    /**
     * get active entry chain subscriptions
     * @returns {Set<string>}
     */
    get entryChainSubscriptions() {
        return this._entryChainSubscriptions;
    }

    /**
     * subscribe to and emit new entry chains blocks using the 'entryChain' or FactomEvent.entryCreditBlock event
     * @param {Array<string>} chainIds - an array of chain IDs
     * @returns {FactomEvent}
     */
    subscribeToEntryChains(chainIds) {
        if (!Array.isArray(chainIds)) {
            chainIds = [chainIds];
        }

        chainIds.forEach(chainId => {
            if (typeof chainId !== 'string') {
                throw new Error(`"${chainId}" must be a string`);
            }

            if (!chainId.match(/\b[A-Fa-f0-9]{64}\b/)) {
                throw new Error(`"${chainId}" must be a chainId`);
            }

            if (this._entryChainSubscriptions.has(chainId)) {
                throw new Error(`already subscribed to ${chainId}`);
            }

            this._entryChainSubscriptions.add(chainId);
        });

        if (!this.listeners(this.directoryBlock).includes(this._fetchentryChain)) {
            this.on(this.directoryBlock, this._fetchentryChain);
        }

        return this;
    }

    /**
     * Unsubscribe from specific entry chains
     * @param {Array<string>} chainIds - array of chain IDs to unsubscribe from
     * @returns {FactomEvent}
     */
    unsubscribeFromEntryChains(chainIds) {
        if (!Array.isArray(chainIds)) {
            chainIds = [chainIds];
        }

        chainIds.forEach(chainId => {
            if (!this._entryChainSubscriptions.has(chainId)) {
                throw new Error(`not subscribed to ${chainId}`);
            }

            this._entryChainSubscriptions.delete(chainId);
        });

        // if the chain subscription set is now empty, remove the _fetchentryChain listener
        if (!this._entryChainSubscriptions.size) {
            if (this.listeners(this.directoryBlock).includes(this._fetchentryChain)) {
                this.removeListener(this.directoryBlock, this._fetchentryChain);
            }
        }

        return this;
    }

    /**
     * Unsubscribe from all entry chains
     * @returns {FactomEvent}
     */
    unsubscribeFromAllEntryChains() {
        this._entryChainSubscriptions = new Set();

        if (this.listeners(this.directoryBlock).includes(this._fetchentryChain)) {
            this.removeListener(this.directoryBlock, this._fetchentryChain);
        }

        return this;
    }

    /**
     * Listener that triggers on a 'directoryBlock' event. It matches chain IDs contained in the directory block
     * then fetches the entry block for each matched chain ID.
     * @param directoryBlock 
     * @private
     */
    async _fetchentryChain(directoryBlock) {
        // callback to pass into the map function. Checks if chainId is present in directory block
        // if it is, fetch then emit the chain head.
        const emitNewBlock = async chainId => {
            const entryBlockRef = directoryBlock.entryBlockRefs.find(entryBlockRef => entryBlockRef.chainId === chainId);

            if (entryBlockRef) {
                const entryBlock = await this._cli.getEntryBlock(entryBlockRef.keyMR);
                this.emit(this.entryChain, entryBlock);
            }
        };

        // fetches up to 5 chain IDs concurrently.
        return Promise.map(this._entryChainSubscriptions, emitNewBlock, { concurrency: 5 });
    }

    ///////////////////////////////////////////////////////////////
    //              FACTOID ADDRESS SUBSCRIPTION                //
    /////////////////////////////////////////////////////////////

    /**
     * Get active factoid address subscriptions
     * @returns {object}
     */
    get factoidAddressSubscriptions() {
        return this._factoidAddressSubscriptions;
    }

    /**
     * Subscribe to and emit new transactions using the 'factoidTransaction' or FactomEvent.factoidTransaction event.
     * @param {string[]} addresses - Array of valid factoid address.
     * @param {boolean} [onReceive] - Emit when receiving transaction at address.
     * @param {boolean} [onSend] - Emit when sending transaction from address.
     * @returns {FactomEvent}
     */
    subscribeToFactoidAddresses(addresses, { onReceive, onSend } = { onReceive: true, onSend: true }) {
        if (!Array.isArray(addresses)) {
            addresses = [addresses];
        }

        if (!onReceive && !onSend) {
            throw new Error('onReceive or onSend must be true');
        }

        addresses.forEach(address => {
            if (!isValidPublicFctAddress(address)) {
                throw new Error(`${address} is not a valid public FCT address`);
            }

            this._factoidAddressSubscriptions[address] = { onReceive, onSend };
        });

        if (!this.listeners(this.directoryBlock).includes(this._fetchFactoidBlock)) {
            this.on(this.directoryBlock, this._fetchFactoidBlock);
        }

        return this;
    }

    /**
     * Unsubscribe from specified factoid addresses.
     * @param {Array<string>} addresses 
     * @returns {FactomEvent}
     */
    unsubscribeFromFactoidAddresses(addresses) {
        if (!Array.isArray(addresses)) {
            addresses = [addresses];
        }

        addresses.forEach(address => {
            if (!(address in this._factoidAddressSubscriptions)) {
                throw new Error(`not currently subscribed to ${address}`);
            }

            delete this._factoidAddressSubscriptions[address];
        });

        this._handleRemoveFactoidBlockListener();
        return this;
    }

    /**
     * Unsubscribe from all factoid addresses.
     * @returns {FactomEvent}
     */
    unsubscribeFromAllFactoidAddresses() {
        const hasAddressSubscriptions = Object.keys(this._factoidAddressSubscriptions).length;
        if (!hasAddressSubscriptions) {
            throw new Error('not currently subscribed to any factoid addreses');
        }

        this._factoidAddressSubscriptions = {};
        this._handleRemoveFactoidBlockListener();
        return this;
    }

    /**
     * Match transactions in factoid block to addresses in _factoidAddressSubscriptions object
     * @param factoidBlock 
     * @private
     */
    _handleFactoidAddressSubscriptions(factoidBlock) {
        const addrs = this._factoidAddressSubscriptions;
        const transactions = factoidBlock.transactions
            .filter(transaction => {
                const inputs = transaction.inputs.some(input => addrs[input.address] && addrs[input.address].onSend);
                if (inputs) return inputs;
                return transaction.factoidOutputs.some(output => addrs[output.address] && addrs[output.address].onReceive);
            })
            .map(transaction => {
                return new Transaction(Transaction.builder(transaction), {
                    factoidBlockKeyMR: this._dBlock.factoidBlockRef,
                    directoryBlockHeight: this._dBlock.height,
                    directoryBlockKeyMR: this._dBlock.keyMR
                });
            });

        if (transactions.length > 0) {
            this.emit(this.factoidTransaction, transactions);
        }
    }
}

module.exports = { FactomEvent };
