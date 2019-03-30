const { FactomdCli, WalletdCli } = require('./apis-cli');

const add = require('./add'),
    send = require('./send'),
    get = require('./get'),
    ack = require('./ack'),
    wallet = require('./wallet');

/**
 * Main class to read and write data from Factom blockchain.
 * @param {Object} [opts] - Options of connection to factomd and factom-walletd.
 * @param {ConnectionOptions} [opts.factomd] - Options of connection to factomd.
 * @param {ConnectionOptions} [opts.walletd] - Options of connection to factom-walletd.
 * @example
 * const cli = new FactomCli({
 *      factomd: {
 *          host: 'api.factomd.net',
 *          port: 443,
 *          protocol: 'https'
 *      },
 *      walletd: {
 *          host: 'localhost',
 *          user: 'paul',
 *          password: 'pass'
 *      }
 * });
 */
class FactomCli {
    constructor(opts) {
        const options = opts || {};
        const factomdConf = options.factomd || options;
        const walletdConf = options.walletd;

        this.factomd = new FactomdCli(factomdConf);
        this.walletd = new WalletdCli(walletdConf);
    }

    // Commit, reveal, add

    /**
     * Commit an Entry or a Chain.
     * @async
     * @param {Entry|Chain} obj - Entry or Chain to commit.
     * @param {string} ecAddress - Entry Credit address that pays for the commit, either private (Es) or public (EC). If public address, the private key must be stored in factom-walletd.
     * @param {number} [commitAckTimeout=60] - Time to wait in seconds for the commit ack. If negative value, doesn't wait for ack.
     * @returns {Promise<{ txId: string, repeatedCommit: boolean }>} - Transaction ID and if this is a repeated commit ({@link https://docs.factom.com/api#repeated-commit}). If repeatedCommit is true, txId is undefined.

     */
    async commit(obj, ecAddress, commitAckTimeout) {
        const ecPrivate = await this.getPrivateAddress(ecAddress);
        return add.commit(this.factomd, obj, ecPrivate, commitAckTimeout);
    }

    /**
     * Commit a Chain.
     * @async
     * @param {Chain} chain - Chain to commit.
     * @param {string} ecAddress - Entry Credit address that pays for the commit, either private (Es) or public (EC). If public address, the private key must be stored in factom-walletd.
     * @param {number} [commitAckTimeout=60] - Time to wait in seconds for the commit ack. If negative value, doesn't wait for ack.
     * @returns {Promise<{ txId: string, repeatedCommit: boolean }>} - Transaction ID and if this is a repeated commit ({@link https://docs.factom.com/api#repeated-commit}). If repeatedCommit is true, txId is undefined.
     */
    async commitChain(chain, ecAddress, commitAckTimeout) {
        const ecPrivate = await this.getPrivateAddress(ecAddress);
        return add.commitChain(this.factomd, chain, ecPrivate, commitAckTimeout);
    }

    /**
     * Commit an Entry.
     * @async
     * @param {Entry} entry - Entry to commit.
     * @param {string} ecAddress - Entry Credit address that pays for the commit, either private (Es) or public (EC). If public address, the private key must be stored in factom-walletd.
     * @param {number} [commitAckTimeout=60] - Time to wait for the commit ack. If negative value, doesn't wait for ack.
     * @returns {Promise<{ txId: string, repeatedCommit: boolean }>} - Transaction ID and if this is a repeated commit ({@link https://docs.factom.com/api#repeated-commit}). If repeatedCommit is true, txId is undefined.
     */
    async commitEntry(entry, ecAddress, commitAckTimeout) {
        const ecPrivate = await this.getPrivateAddress(ecAddress);
        return add.commitEntry(this.factomd, entry, ecPrivate, commitAckTimeout);
    }

    /**
     * Reveal an Entry or Chain.
     * @async
     * @param {Entry|Chain} obj - Entry or Chain to reveal.
     * @param {number} [revealAckTimeout=60] - Time to wait in seconds for the reveal ack. If negative value, doesn't wait for ack.
     * @returns {Promise<{ chainId: string, entryHash: string }>}
     */
    async reveal(obj, revealAckTimeout) {
        return add.reveal(this.factomd, obj, revealAckTimeout);
    }

    /**
     * Reveal a Chain.
     * @async
     * @param {Chain} chain - Chain to reveal.
     * @param {number} [revealAckTimeout=60] - Time to wait in seconds for the reveal ack. If negative value, doesn't wait for ack.
     * @returns {Promise<{ chainId: string, entryHash: string }>}
     */
    async revealChain(chain, revealAckTimeout) {
        return add.revealChain(this.factomd, chain, revealAckTimeout);
    }

    /**
     * Reveal a Entry.
     * @async
     * @param {Entry} entry - Entry to reveal.
     * @param {number} [revealAckTimeout=60] - Time to wait in seconds for the reveal ack. If negative value, doesn't wait for ack.
     * @returns {Promise<{ chainId: string, entryHash: string }>}
     */
    async revealEntry(entry, revealAckTimeout) {
        return add.revealEntry(this.factomd, entry, revealAckTimeout);
    }

    /**
     * Add an Entry/Chain or a collection of either of those to the Factom blockchain. Performs both commits and reveals.
     * @async
     * @param {Chain|Chain[]|Entry|Entry[]} obj - Entry/Chain or array of Entry/Chain to add.
     * @param {string} ecAddress - Entry Credit address that pays for the commit, either private (Es) or public (EC). If public address, the private key must be stored in factom-walletd.
     * @param {Object} [options]
     * @param {number} [options.commitTimeout=60] - Time to wait in seconds for the commit ack. If negative value, doesn't wait for ack.
     * @param {number} [options.revealTimeout=60] - Time to wait in seconds for the reveal ack. If negative value, doesn't wait for ack.
     * @param {number} [options.concurrency=200] - Only if the obj argument is an iterable. Limits the number of concurrent Promises adding entries/chains.
     * @param {boolean} [options.skipFundValidation = false] - Skip the validation that the EC address holds enough Entry Credits to pay the commits.
     * @returns {Promise<{ txId: string, repeatedCommit: boolean, chainId: string, entryHash: string }>|Promise<{ txId: string, repeatedCommit: boolean, chainId: string, entryHash: string }[]>} -
     * Transaction ID (commit), if it is a repeated commit ({@link https://docs.factom.com/api#repeated-commit}), chain id and entry hash.
     * It is an array of such object if the input was an iterable of Entry or Chain.
     */
    async add(obj, ecAddress, options) {
        const ecPrivate = await this.getPrivateAddress(ecAddress);
        return add.add(this.factomd, obj, ecPrivate, options);
    }

    /**
     * Add a Chain to the Factom blockchain. Performs both commit and reveal.
     * @async
     * @param {Chain} chain - Chain to add.
     * @param {string} ecAddress - Entry Credit address that pays for the commit, either private (Es) or public (EC). If public address, the private key must be stored in factom-walletd.
     * @param {Object} [options]
     * @param {number} [options.commitTimeout=60] - Time to wait in seconds for the commit ack. If negative value, doesn't wait for ack.
     * @param {number} [options.revealTimeout=60] - Time to wait in seconds for the reveal ack. If negative value, doesn't wait for ack.
     * @param {boolean} [options.skipFundValidation = false] - Skip the validation that the EC address holds enough Entry Credits to pay the commit.
     * @returns {Promise<{ txId: string, repeatedCommit: boolean, chainId: string, entryHash: string }>} - Transaction ID (commit), if it is a repeated commit ({@link https://docs.factom.com/api#repeated-commit}), chain id and entry hash.
     */
    async addChain(chain, ecAddress, options) {
        const ecPrivate = await this.getPrivateAddress(ecAddress);
        return add.addChain(this.factomd, chain, ecPrivate, options);
    }

    /**
     * Add a collection of Chains to the Factom blockchain. Performs both commits and reveals.
     * @async
     * @param {Chain[]} chains - Iterable of Chains to add.
     * @param {string} ecAddress - Entry Credit address that pays for the commit, either private (Es) or public (EC). If public address, the private key must be stored in factom-walletd.
     * @param {Object} [options]
     * @param {number} [options.commitTimeout=60] - Time to wait in seconds for the commit ack. If negative value, doesn't wait for ack.
     * @param {number} [options.revealTimeout=60] - Time to wait in seconds for the reveal ack. If negative value, doesn't wait for ack.
     * @param {number} [options.concurrency=200] - Only if the obj argument is an iterable. Limits the number of concurrent Promises adding entries/chains.
     * @param {boolean} [options.skipFundValidation = false] - Skip the validation that the EC address holds enough Entry Credits to pay the commits.
     * @returns {Promise<{ txId: string, repeatedCommit: boolean, chainId: string, entryHash: string }[]>} - Transaction ID (commit), if it is a repeated commit ({@link https://docs.factom.com/api#repeated-commit}), chain id and entry hash.
     */
    async addChains(chains, ecAddress, options) {
        const ecPrivate = await this.getPrivateAddress(ecAddress);
        return add.addChains(this.factomd, chains, ecPrivate, options);
    }

    /**
     * Add an Entry to the Factom blockchain. Performs both commit and reveal.
     * @async
     * @param {Entry} entry - Entry to add.
     * @param {string} ecAddress - Entry Credit address that pays for the commit, either private (Es) or public (EC). If public address, the private key must be stored in factom-walletd.
     * @param {Object} [options]
     * @param {number} [options.commitTimeout=60] - Time to wait in seconds for the commit ack. If negative value, doesn't wait for ack.
     * @param {number} [options.revealTimeout=60] - Time to wait in seconds for the reveal ack. If negative value, doesn't wait for ack.
     * @param {boolean} [options.skipFundValidation = false] - Skip the validation that the EC address holds enough Entry Credits to pay the commit.
     * @returns {Promise<{ txId: string, repeatedCommit: boolean, chainId: string, entryHash: string }>} - Transaction ID (commit), if it is a repeated commit ({@link https://docs.factom.com/api#repeated-commit}), chain id and entry hash.
     */
    async addEntry(entry, ecAddress, options) {
        const ecPrivate = await this.getPrivateAddress(ecAddress);
        return add.addEntry(this.factomd, entry, ecPrivate, options);
    }

    /**
     * Add a collection of Entries to the Factom blockchain. Performs both commits and reveals.
     * @async
     * @param {Entry[]} entries - Iterable of Entries to add.
     * @param {string} ecAddress - Entry Credit address that pays for the commit, either private (Es) or public (EC). If public address, the private key must be stored in factom-walletd.
     * @param {Object} [options]
     * @param {number} [options.commitTimeout=60] - Time to wait in seconds for the commit ack. If negative value, doesn't wait for ack.
     * @param {number} [options.revealTimeout=60] - Time to wait in seconds for the reveal ack. If negative value, doesn't wait for ack.
     * @param {number} [options.concurrency=200] - Only if the obj argument is an iterable. Limits the number of concurrent Promises adding entries/chains.
     * @param {boolean} [options.skipFundValidation = false] - Skip the validation that the EC address holds enough Entry Credits to pay the commits.
     * @returns {Promise<{ txId: string, repeatedCommit: boolean, chainId: string, entryHash: string }[]>} - Transaction ID (commit), if it is a repeated commit ({@link https://docs.factom.com/api#repeated-commit}), chain id and entry hash.
     */
    async addEntries(entries, ecAddress, options) {
        const ecPrivate = await this.getPrivateAddress(ecAddress);
        return add.addEntries(this.factomd, entries, ecPrivate, options);
    }

    // Wallet

    /**
     * Retrieve the corresponding private address of any type of address from factom-walletd if necessary.
     * @async
     * @param {string} address - Any address (EC or FCT, public or private).
     * @returns {Promise<string>} - Corresponding private address.
     */
    async getPrivateAddress(address) {
        return await wallet.getPrivateAddress(this.walletd, address);
    }

    // Get

    /**
     * Get all the entries of a given chain.
     * @async
     * @param {string} chainId - Chain ID of the chain to retrieve all the entries from.
     * @returns {Promise<Entry[]>} - Array of entries ordered from the oldest to the newest.
     */
    getAllEntriesOfChain(chainId) {
        return get.getAllEntriesOfChain(this.factomd, chainId);
    }

    /**
     * Get the head of a given chain.
     * @async
     * @param {string} chainId - Chain ID.
     * @returns {Promise<{keyMR:string, chainInProcessList:boolean}>} result - keymr of the head of the chain.
     * chainInProcessList indicates if there is an Entry Block for that chain currently in the process list.
     * If this is the case that would indicate that the head of that chain will change at the next block.
     */
    getChainHead(chainId) {
        return get.getChainHead(this.factomd, chainId);
    }

    /**
     * Get entry by hash (returned Entry does not contain an {@link EntryBlockContext} and a timestamp). See {@link FactomCli#getEntryWithBlockContext}.
     * @async
     * @param {string} entryHash - Hash of the entry to query.
     * @returns {Promise<Entry>} - Entry that does not contain an {@link EntryBlockContext} and a timestamp).
     */
    getEntry(entryHash) {
        return get.getEntry(this.factomd, entryHash);
    }

    /**
     * Get entry by hash with its {@link EntryBlockContext} and timestamp.
     * Note that this method is more expensive than {@link FactomCli#getEntry} as it also has to retrieve the Entry Block data.
     * @async
     * @param {string} entryHash - Hash of the entry to query.
     * @returns {Promise<Entry>} - Entry with its blockContext and timestamp populated.
     */
    getEntryWithBlockContext(entryHash) {
        return get.getEntryWithBlockContext(this.factomd, entryHash);
    }

    /**
     * Get the first entry of a chain. This methods has to rewind the entire chain which can be an expensive operation.
     * @async
     * @param {string} chainId - Chain ID to retrieve the first entry from.
     * @returns {Promise<Entry>} - Entry with its blockContext and timestamp populated.
     */
    getFirstEntry(chainId) {
        return get.getFirstEntry(this.factomd, chainId);
    }

    /**
     * Get the balance of an Entry Credit or Factoid address.
     * @async
     * @param {string} address - Any type of address, FCT or EC, public or private.
     * @returns {Promise<number>} - Balance of EC or FCT. In the case of FCT the balance is in factoshis (10^-8 factoids).
     */
    getBalance(address) {
        return get.getBalance(this.factomd, address);
    }

    /**
     * Check if a chain exists.
     * @async
     * @param {string} chainId - Chain ID to check.
     * @returns {Promise<boolean>}
     */
    chainExists(chainId) {
        return get.chainExists(this.factomd, chainId);
    }

    /**
     * Get the current entry credit rate. The rate is the number of factoshis (10^-8 Factoids) necessary to purchase 1 EC.
     * @async
     * @returns {Promise<number>} - Entry credit rate.
     */
    getEntryCreditRate() {
        return get.getEntryCreditRate(this.factomd);
    }

    /**
     * Get Factoid transaction by id.
     * @async
     * @param {string} txId - Transaction id.
     * @returns {Transaction}
     */
    getTransaction(txId) {
        return get.getTransaction(this.factomd, txId);
    }

    /**
     * Rewind a chain entry by entry (newest to oldest) while a predicate is true.
     * @async
     * @param {string} chainId - Chain to rewind.
     * @param {Function<Entry>} predicate - Predicate of the while loop. Iteration stop if either the predicate is false or the end of the chain has been reached.
     * @param {Function<Entry>} func - Function to apply at each iteration.
     * @example
     * cli.rewindChainWhile('dab6c095c22ec6db1b0961fdb82d504a95f0a31467bb7df73cc793532b0e9ae3', (entry) => true, function(entry) {
     *      // Do stuff with the entry
     * })
     */
    rewindChainWhile(chainId, predicate, func) {
        return get.rewindChainWhile(this.factomd, chainId, predicate, func);
    }

    // Send transactions

    /**
     * Send a Factoid transaction.
     * This method will throw if the transaction fees are too low given the current EC rate.
     * Note that by default this method also rejects a transaction over paying the minimum required fees by a factor 10 as it is most likely a user input error. This can be overriden with the force option.
     * @async
     * @param {Transaction} transaction
     * @param {Object} [options]
     * @param {number} [options.timeout=60] - Time to wait in seconds for transaction acknowledgment before timing out. If negative value, doesn't wait for ack.
     * @param {boolean} [options.force=false] - Set to true to bypass the checks of the transaction fee overpay and the minimum EC output amount.
     * @returns {Promise<string>} - Transaction ID.
     */
    sendTransaction(transaction, options) {
        return send.sendTransaction(this.factomd, transaction, options);
    }

    /**
     * Create a single input single output (SISO) Factoid transaction.
     * @async
     * @param {string} originAddress - Private or public Factoid address origin of the funds. If a public address is provided (FA) the corresponding private address must be stored in factom-walletd.
     * @param {string} recipientAddress - Public Factoid address receiving the funds.
     * @param {number} amount - Amount to transfer in factoshis (10^-8 Factoids).
     * @param {number} [fees] - Value to override fees of the transaction (if not specified the library computes the lowest acceptable fee).
     * @returns {Promise<Transaction>}
     */
    async createFactoidTransaction(originAddress, recipientAddress, amount, fees) {
        const originPrivateAddress = await this.getPrivateAddress(originAddress);
        return send.createFactoidTransaction(
            this.factomd,
            originPrivateAddress,
            recipientAddress,
            amount,
            fees
        );
    }

    /**
     * Create a transaction to convert Factoids to Entry Credit.
     * @async
     * @param {string} originAddress - Private or public Factoid address origin of the funds. If a public address is provided (FA) the corresponding private address must be stored in factom-walletd.
     * @param {string} recipientAddress - Public Entry Credit address to receive the ECs.
     * @param {number} ecAmount - Amount of Entry Credit (EC) to purchase.
     * @param {number} [fees] - Value to override fees of the transaction (if not specified the library computes the lowest acceptable fee).
     * @returns {Promise<Transaction>}
     */
    async createEntryCreditPurchaseTransaction(originAddress, recipientAddress, ecAmount, fees) {
        const originPrivateAddress = await this.getPrivateAddress(originAddress);
        return send.createEntryCreditPurchaseTransaction(
            this.factomd,
            originPrivateAddress,
            recipientAddress,
            ecAmount,
            fees
        );
    }

    // Ack
    /**
     * Wait until an acknowlegment is received from the network for a commit.
     * @async
     * @param {string} txId - Commit transaction ID.
     * @param {number} [timeout=60] - Wait time in seconds.
     * @returns {Promise<string>} - Status of the commit. See {@link https://docs.factom.com/api#ack}.
     */
    waitOnCommitAck(txId, timeout) {
        return ack.waitOnCommitAck(this.factomd, txId, timeout);
    }

    /**
     * Wait until an acknowlegment is received from the network for a reveal.
     * @async
     * @param {string} hash - Hash of the revealed entry.
     * @param {string} chainId - Chain ID of the revealed entry.
     * @param {number} [timeout=60] - Wait time in seconds.
     * @returns {Promise<string>} - Status of the reveal. See {@link https://docs.factom.com/api#ack}.
     */
    waitOnRevealAck(hash, chainId, timeout) {
        return ack.waitOnRevealAck(this.factomd, hash, chainId, timeout);
    }

    /**
     * Wait until an acknowlegment is received from the network for a Factoid transaction.
     * @async
     * @param {string} txId - Transaction ID.
     * @param {number} [timeout=60] - Wait time in seconds.
     * @returns {Promise<string>} - Status of the transaction. See {@link https://docs.factom.com/api#ack}.
     */
    waitOnFactoidTransactionAck(txId, timeout) {
        return ack.waitOnFactoidTransactionAck(this.factomd, txId, timeout);
    }

    // Raw APIs

    /**
     * Make a direct call to factomd API. See {@link https://docs.factom.com/api#factomd-api}.
     * @async
     * @param {string} method - Factomd API method name.
     * @param {Object} [params] - The object that the factomd API is expecting.
     * @returns {Promise<Object>} - Factomd API response.
     */
    factomdApi(method, params) {
        return this.factomd.call(method, params);
    }

    /**
     * Make a direct call to factom-walletd API. See {@link https://docs.factom.com/api#factom-walletd-api}.
     * @async
     * @param {string} method - Walletd API method name.
     * @param {Object} [params] - The object that the walletd API is expecting.
     * @returns {Promise<Object>} - Walletd API response.
     */
    walletdApi(method, params) {
        return this.walletd.call(method, params);
    }

    // Blocks

    /**
     * Return blockchain heights. For the explanation of the different heights see {@link https://docs.factom.com/api#heights}.
     * @async
     * @returns {Promise<{ directoryBlockHeight: number, leaderHeight: number, entryBlockHeight: number,  entryHeight: number}>}
     */
    getHeights() {
        return get.getHeights(this.factomd);
    }

    /**
     * Return latest directory block saved.
     * @async
     * @returns {Promise<DirectoryBlock>}
     */
    getDirectoryBlockHead() {
        return get.getDirectoryBlockHead(this.factomd);
    }

    /**
     * Get a directory block by keyMR or height.
     * @async
     * @param {string|number} arg - Either KeyMR (string) or height (number) of the directory block.
     * @returns {Promise<DirectoryBlock>}
     */
    getDirectoryBlock(arg) {
        return get.getDirectoryBlock(this.factomd, arg);
    }

    /**
     * Get an admin block by keyMR or height.
     * @async
     * @param {string|number} arg - Either KeyMR (string) or height (number) of the admin block.
     * @returns {Promise<AdminBlock>}
     */
    getAdminBlock(arg) {
        return get.getAdminBlock(this.factomd, arg);
    }

    /**
     * Get an entry credit block by keyMR or height.
     * @async
     * @param {string|number} arg - Either KeyMR (string) or height (number) of the entry credit block.
     * @returns {Promise<EntryCreditBlock>}
     */
    getEntryCreditBlock(arg) {
        return get.getEntryCreditBlock(this.factomd, arg);
    }

    /**
     * Get a Factoid block by keyMR or height.
     * @async
     * @param {string|number} arg - Either KeyMR (string) or height (number) of the factoid block.
     * @returns {Promise<FactoidBlock>}
     */
    getFactoidBlock(arg) {
        return get.getFactoidBlock(this.factomd, arg);
    }

    /**
     * Get an entry block.
     * @async
     * @param {string} keyMR - KeyMR of the entry block.
     * @returns {Promise<EntryBlock>}
     */
    getEntryBlock(keyMR) {
        return get.getEntryBlock(this.factomd, keyMR);
    }
}

module.exports = {
    FactomCli
};
