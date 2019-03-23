const { EventEmitter } = require('events'),
    Promise = require('bluebird'),
    { isValidPublicFctAddress } = require('./addresses'),
    { Transaction } = require('./transaction');

/**
 * Listen for new Factom Events. 
 * @param {FactomCli} cli - FactomCli instance to be used by the FactomEventEmitter instance to poll the blockchain for new blocks.
 * @param {Object} opts - Options to set on the FactomEventEmitter instance
 * @param {number} [opts.interval=7500] - The interval (ms) at which the FactomEventEmtitter instance should poll the blockchain to check for a new block. Defaults to 7500.
 * @class
 */
class FactomEventEmitter extends EventEmitter {
    constructor(cli, opts) {
        super();

        this._cli = cli;
        this._dBlock = {};

        this.opts = {
            interval: 7500,
            ...opts
        };

        // events
        this.event = {
            directoryBlock: 'directoryBlock',
            factoidBlock: 'factoidBlock',
            adminBlock: 'adminBlock',
            entryCreditBlock: 'entryCreditBlock',
            entryChain: 'entryChain',
            factoidTransaction: 'factoidTransaction'
        };

        //bind to this
        this._startPolling = this._startPolling.bind(this);
        this._stopPolling = this._stopPolling.bind(this);
        this._addDirectoryBlockListener = this._addDirectoryBlockListener.bind(this);
        this._removeDirectoryBlockListener = this._removeDirectoryBlockListener.bind(this);
        this._subscribeToIdentity = this._subscribeToIdentity.bind(this);
        this._unsubscribeFromIdentity = this._unsubscribeFromIdentity.bind(this);

        // user identifier subscriptions
        this._entryChainSubscriptions = new Set();
        this._factoidAddressSubscriptions = new Set();

        // listen for user-generated events
        this._listenForListenerStateChange();
    }

    _listenForListenerStateChange() {
        this.on('removeListener', event => this._handleListenerStateChange(event, this._stopPolling, this._removeDirectoryBlockListener, this._unsubscribeFromIdentity));
        this.on('newListener', event => this._handleListenerStateChange(event, this._startPolling, this._addDirectoryBlockListener, this._subscribeToIdentity));
    }

    /**
     * This listener function is triggered when any event listener is created or removed. Adding or removing any non-directoryBlock
     * event listener may trigger this function more than once: first when the initial listener is added or removed, and again as
     * the internal listeners used to fetch data from the blockchain are also updated. It will stop being triggered either when one
     * of the functions it calls decides not to add or remove a listener, or when event is equal to 'directoryBlock'.
     * @private
     */
    _handleListenerStateChange(event, setPolling, setDirectoryBlockListener, setIdentityListener) {
        if (event == this.event.directoryBlock) {
            setPolling();
        } else if (event === this.event.factoidBlock) {
            setDirectoryBlockListener(this._fetchFactoidBlock, event);
        } else if (event === this.event.entryCreditBlock) {
            setDirectoryBlockListener(this._fetchEntryCreditBlock, event);
        } else if (event === this.event.adminBlock) {
            setDirectoryBlockListener(this._fetchAdminBlock, event);
        } else if (typeof event === 'string' && event.match(/\b[A-Fa-f0-9]{64}\b/)) {
            // this event matches a sha256 string which is assumed to be a chain ID
            const id = event;
            const set = this._entryChainSubscriptions;
            const e = this.event.directoryBlock;
            const listener = this._fetchEntryChains;
            setIdentityListener(id, set, e, listener);
        } else if (isValidPublicFctAddress(event)) {
            const id = event;
            const set = this._factoidAddressSubscriptions;
            const e = this.event.factoidBlock;
            const listener = this._emitFactoidAddressEvents;
            setIdentityListener(id, set, e, listener);
        } else if (event !== 'error') {
            // do not need to handle directoryBlock or error events in this if/else, anything left over emits an error
            return this.emit('error', new Error(`${event} is not a recognised event`));
        }
    }

    ///////////////////////////////////////////////////////////////
    //              DIRECTORY BLOCK METHODS                     //
    /////////////////////////////////////////////////////////////

    /**
     * Determine whether or not polling is currently active.
     * @returns {boolean} 
     */
    get isPolling() {
        return !!this._isPolling;
    }

    /**
     * subscribe to and emit new directory blocks using the 'directoryBlock' or FactomEvent.directoryBlock event.
     * This function drives all other subscriptions and must be called at least once during the lifecycle of a FactomEvent instance.
     * It will throw an error if called when polling is already in process.
     * @param {number} [interval=15000] - time interval (ms) at which to check for new blocks. Defaults to 15000.
     * @throws - if polling has already been started
     * @returns {FactomEvent} - reference to the class instance
     * @private
     */
    _startPolling() {
        if (!this.isPolling) {
            this._poll();
            this._isPolling = setInterval(() => this._poll(), this.opts.interval);
        }
    }

    /**
     * stop polling the blockchain. Must be called when cleaning-up.
     * @returns {FactomEvent} - reference to the class instance.
     * @private
     */
    _stopPolling() {
        if (this.listenerCount(this.event.directoryBlock) === 0 && this.isPolling) {
            clearInterval(this._isPolling);
            this._isPolling = false;
        }
    }

    /**
     * _poll is a private function used to check the state of the blockchain
     * and compare it to the appliation state. It emits if there is a new directory block
     * @private
     * @async
     */
    async _poll() {
        try {
            const block = await this._cli.getDirectoryBlockHead();
            if (this._dBlock.height === undefined || block.height > this._dBlock.height) {
                this._dBlock = block;
                this.emit(this.event.directoryBlock, block);
            }
        } catch (err) {
            this.emit('error', err);
        }
    }

    ///////////////////////////////////////////////////////////////
    //                  PROTOCOL CHAIN EVENTS                   //
    /////////////////////////////////////////////////////////////

    /**
     * The listeners passed to this function are all listed below and begin with _fetch. Each of those
     * listeners gets data from the blockchain in response to a new directBlock event, then emit a unique
     * event relative to that listener. In order to prevent over-fetching, this function will not add duplicate
     * listeners to the directoryBlock event.
     * @private
     */
    _addDirectoryBlockListener(listener) {
        if (!this.listeners(this.event.directoryBlock).includes(listener)) {
            return this.on(this.event.directoryBlock, listener);
        }
    }

    /**
     * The listeners passed to this function are all listed below and begin with _fetch. Those listeners
     * emit their own events, and those events may have their own listeners. Therefore, this function also
     * accepts an event argument, which is used to check whether there are any listeners still dependent on
     * those emitted events. If there are, it does not remove the _fetch listener from the directoryBlock event.
     * @private
     */
    _removeDirectoryBlockListener(listener, event) {
        const hasListeners = this.listenerCount(event);
        if (!hasListeners) {
            return this.removeListener(this.event.directoryBlock, listener);
        }
    }

    /**
     * Listener that triggers on a 'directoryBlock' event. It fetches then emits the factoid block referenced
     * in the emitted directory block.
     * @param {DirectoryBlock} directoryBlock
     * @private
     */
    async _fetchFactoidBlock(directoryBlock) {
        try {
            const factoidBlock = await this._cli.getFactoidBlock(directoryBlock.factoidBlockRef);
            this.emit(this.event.factoidBlock, factoidBlock);
        } catch (err) {
            this.emit('error', err);
        }
    }

    /**
     * Listener that triggers on a 'directoryBlock' event. It fetches then emits the admin block referenced
     * in the emitted directory block.
     * @param {DirectoryBlock} directoryBlock
     * @private
     */
    async _fetchAdminBlock(directoryBlock) {
        try {
            const adminBlock = await this._cli.getAdminBlock(directoryBlock.adminBlockRef);
            this.emit(this.event.adminBlock, adminBlock);
        } catch (err) {
            this.emit('error', err);
        }
    }

    /**
     * Listener that triggers on a 'directoryBlock' event. It fetches then emits the entry credit block referenced
     * in the emitted directory block.
     * @param {DirectoryBlock} directoryBlock
     * @private
     * @async
     */
    async _fetchEntryCreditBlock(directoryBlock) {
        try {
            const entryCreditBlock = await this._cli.getEntryCreditBlock(directoryBlock.entryCreditBlockRef);
            this.emit(this.event.entryCreditBlock, entryCreditBlock);
        } catch (err) {
            this.emit('error', err);
        }
    }

    ///////////////////////////////////////////////////////////////
    //        ENTRY CHAIN AND FACTOID ADDRESS EVENTS            //
    /////////////////////////////////////////////////////////////

    /**
     * get active entry chain subscriptions
     * @returns {Set<string>}
     */
    get entryChainSubscriptions() {
        return this._entryChainSubscriptions;
    }

    /**
     * get active factoid address subscriptions
     * @returns {Set<string>}
     */
    get factoidAddressSubscriptions() {
        return this._factoidAddressSubscriptions;
    }

    /**
     * @param {string} id - Any unique string used to reference some specific location in the blockchain, such as a chain ID or factoid address.
     * @param {Set<string>} set - A reference to the set that holds the identities of a particular type, such as a factoid address set or a chain ID set.
     * @param {string} event - The event that needs to be listened for in order to emit updates for a given identity. Factoid addresses listen for a factoid block event,
     * chain IDs listen for a directory block event.
     * @param {Function} listener - A listener that handles how and when to emit a new event for each identity in the set.
     * @private
     */
    _subscribeToIdentity(id, set, event, listener) {
        if (set.has(id)) {
            return this.emit('error', new Error(`already listening to ${id}`));
        }
        set.add(id);

        // if listener not already attached to event, create new listener.
        if (!this.listeners(event).includes(listener)) {
            return this.on(event, listener);
        }
    }

    _unsubscribeFromIdentity(id, set, event, listener) {
        set.delete(id);

        // if the set is now empty, remove the event listener
        if (set.size === 0) {
            if (this.listeners(event).includes(listener)) {
                return this.removeListener(event, listener);
            }
        }
    }

    /**
     * Listener that triggers on a 'directoryBlock' event. It matches chain IDs contained in the directory block
     * to the _entryChainSubscriptions set then fetches the referenced entry block for each matched chain ID.
     * @private
     * @async
     */
    async _fetchEntryChains(directoryBlock) {
        // callback to pass into the map function. Check if chainId is present in directory block.
        // If it is, fetch then emit the entry block ID referenced by the directory block.
        const emitNewBlock = async chainId => {
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

        // fetch up to 5 chain IDs concurrently.
        Promise.map(this._entryChainSubscriptions, emitNewBlock, { concurrency: 5 });
    }

    /**
     * Match transactions in factoid block to addresses in _factoidAddressSubscriptions object.
     * Note: this listener is attached to a factoidBlock event rather than directoryBlock event.
     * @private
     */
    _emitFactoidAddressEvents(factoidBlock) {
        const addrs = this._factoidAddressSubscriptions;
        factoidBlock.transactions.forEach(tx => {
            const activeAddresses = new Set();
            const findActiveAddresses = io => addrs.has(io.address) && activeAddresses.add(io.address);
            tx.inputs.forEach(findActiveAddresses);
            tx.factoidOutputs.forEach(findActiveAddresses);

            if (!activeAddresses.size) {
                return;
            }

            const transaction = new Transaction(Transaction.builder(tx), {
                factoidBlockKeyMR: this._dBlock.factoidBlockRef,
                directoryBlockHeight: this._dBlock.height,
                directoryBlockKeyMR: this._dBlock.keyMR
            });

            activeAddresses.forEach(address => this.emit(address, transaction));
        });
    }
}

module.exports = { FactomEventEmitter };
