// Type definitions for factomjs
// Project: https://github.com/PaulBernier/factomjs
// Definitions by: Schalk Bower <https://github.com/schalk-b>, Paul Bernier <https://github.com/PaulBernier>

import { EventEmitter } from 'events';

export = factom;

declare namespace factom {
    /**
     * Describe the options of connection to factomd or factom-walletd.
     *
     * @example
     * const cli = new FactomdCli({
     *      host: '52.202.51.228',
     *      port: 8088,
     *      path: '/',
     *      debugPath: '/debug',
     *      user: 'paul',
     *      password: 'pwd',
     *      protocol: 'https',
     *      rejectUnauthorized: false,
     *      timeout: 5000,
     *      retry: {
     *          retries: 3,
     *          factor: 2,
     *          minTimeout: 500,
     *          maxTimeout: 2000
     *      }
     * });
     */
    interface ConnectionOptions {
        /**
         * IP or hostname. Default to localhost
         */
        host?: string;

        /**
         * Port. Default to 8088 for factomd and 8089 for walletd.
         */
        port?: number;

        /**
         * Path to V2 API. Default to /v2.
         */
        path?: string;

        /**
         * Path to debug API. Default to /debug.
         */
        debugPath?: string;

        /**
         * User for basic authentication.
         */
        user?: string;

        /**
         * Password for basic authentication.
         */
        password?: string;

        /**
         * http or https. Default to http.
         */
        protocol?: string;

        /**
         * Set to false to allow connection to a node with a self-signed certificate. Default to true.
         */
        rejectUnauthorized?: boolean;

        /**
         * Specifies the number of milliseconds before any API request times out.
         * If a request takes longer than `timeout`, the request will be aborted. Default is `0` (no timeout).
         */
        timeout?: number;

        /**
         * Retry strategy. For the detail of the options see https://github.com/tim-kos/node-retry#retrytimeoutsoptions. Default to {retries: 3, factor: 2, minTimeout: 500, maxTimeout: 2000}
         */
        retry?: {
            retries?: number;
            factor?: number;
            minTimeout?: number;
            maxTimeout?: number;
        };
    }

    interface AddOptions {
        /**
         * Time to wait in seconds for the commit ack. If negative value, doesn't wait for ack.
         */
        commitTimeout?: number;

        /**
         * Time to wait in seconds for the reveal ack. If negative value, doesn't wait for ack.
         */
        revealTimeout?: number;

        /**
         * Only if the obj argument is an iterable. Limits the number of concurrent Promises adding entries/chains.
         */
        concurrency?: number;

        /**
         * Skip the validation that the EC address holds enough Entry Credits to pay for the commit.
         */
        skipFundValidation?: boolean;

        /**
         * Signing function.
         * Takes as input the data to sign with the EC public key paying for the commmit
         * and should return its signature as a Buffer or a hex encoded string (or a Promise of those).
         * The returned signature must have been made by the private key corresponding to the ecAddress argument.
         */
        sign?: (data: Buffer) => Buffer | string | Promise<Buffer | string>;
    }

    interface AddResponse {
        /**
         * Transaction ID (commit)
         */
        txId: string;

        /**
         * If it is a repeated commit (https://docs.factom.com/api#repeated-commit)
         */
        repeatedCommit: boolean;

        /**
         * Chain id
         */
        chainId: string;

        /**
         * Entry hash
         */
        entryHash: string;
    }

    interface CommitOptions {
        /**
         * Time to wait in seconds for the commit ack. If negative value, doesn't wait for ack.
         */
        ackTimeout?: number;

        /**
         * Signing function.
         * Takes as input the data to sign with the EC public key paying for the commmit
         * and should return its signature as a Buffer or a hex encoded string (or a Promise of those).
         * The returned signature must have been made by the private key corresponding to the ecAddress argument.
         */
        sign?: (data: Buffer) => Buffer | string | Promise<Buffer | string>;
    }

    /**
     * Main class to read and write data from Factom blockchain.
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
    export class FactomCli {
        /**
         * @param opts Options of connection to factomd and factom-walletd.
         */
        constructor(
            opts?:
                | ConnectionOptions
                | {
                      factomd?: ConnectionOptions;
                      walletd?: ConnectionOptions;
                  }
        );

        /**
         *
         * @param obj Entry or Chain to commit.
         * @param ecAddress Entry Credit address that pays for the commit, either private (Es) or public (EC).
         * If a public address is passed, the private key must either be stored in factom-walletd or
         * a sign function must be provided as part of the options.
         * @param options
         */
        commit(
            obj: Chain | Entry,
            ecAddress: string,
            options?: CommitOptions
        ): Promise<{
            /**
             * Transaction ID. This is undefined if this is a repeat commit.
             */
            txId?: string;

            /**
             * If this is a repeated commit (https://docs.factom.com/api#repeated-commit). If repeatedCommit is true, txId is undefined.
             */
            repeatedCommit: boolean;
        }>;

        /**
         * Commit a Chain.
         *
         * @param chain Chain to commit.
         * @param ecAddress Entry Credit address that pays for the commit, either private (Es) or public (EC).
         * If a public address is passed, the private key must either be stored in factom-walletd or
         * a sign function must be provided as part of the options.
         * @param options
         */
        commitChain(
            chain: Chain,
            ecAddress: string,
            options?: CommitOptions
        ): Promise<{
            /**
             * Transaction ID. This is undefined if this is a repeat commit.
             */
            txId?: string;

            /**
             * If this is a repeated commit (https://docs.factom.com/api#repeated-commit). If repeatedCommit is true, txId is undefined.
             */
            repeatedCommit: boolean;
        }>;

        /**
         * Commit an Entry.
         *
         * @param entry Entry to commit.
         * @param ecAddress Entry Credit address that pays for the commit, either private (Es) or public (EC).
         * If a public address is passed, the private key must either be stored in factom-walletd or
         * a sign function must be provided as part of the options.
         * @param options
         */
        commitEntry(
            entry: Entry,
            ecAddress: string,
            options?: CommitOptions
        ): Promise<{
            /**
             * Transaction ID. This is undefined if this is a repeat commit.
             */
            txId?: string;

            /**
             * If this is a repeated commit (https://docs.factom.com/api#repeated-commit). If repeatedCommit is true, txId is undefined.
             */
            repeatedCommit: boolean;
        }>;

        /**
         * Reveal an Entry or Chain.
         *
         * @param obj Entry or Chain to reveal.
         * @param revealAckTimeout Time to wait in seconds for the reveal ack. If negative value, doesn't wait for ack. Defaults to 60.
         */
        reveal(
            obj: Entry | Chain,
            revealAckTimeout?: number
        ): Promise<{ chainId: string; entryHash: string }>;

        /**
         * Reveal a Chain.
         *
         * @param chain Chain to reveal.
         * @param revealAckTimeout Time to wait in seconds for the reveal ack. If negative value, doesn't wait for ack. Defaults to 60.
         */
        revealChain(
            chain: Chain,
            revealAckTimeout?: number
        ): Promise<{ chainId: string; entryHash: string }>;

        /**
         * Reveal a Entry.
         *
         * @param entry Entry to reveal.
         * @param revealAckTimeout Time to wait in seconds for the reveal ack. If negative value, doesn't wait for ack. Defaults to 60.
         */
        revealEntry(
            entry: Entry,
            revealAckTimeout?: number
        ): Promise<{ chainId: string; entryHash: string }>;

        /**
         * Add an Entry/Chain or a collection of either of those to the Factom blockchain. Performs both commits and reveals.
         *
         * @param obj Entry/Chain or array of Entry/Chain to add.
         * @param ecAddress Entry Credit address that pays for the commit, either private (Es) or public (EC).
         * If a public address is passed, the private key must either be stored in factom-walletd or
         * a sign function must be provided as part of the options.
         * @param options
         */

        add(
            obj: Chain | Chain[] | Entry | Entry[],
            ecAddress: string,
            options?: AddOptions
        ): Promise<AddResponse | AddResponse[]>;

        /**
         * Add a Chain to the Factom blockchain. Performs both commit and reveal.
         *
         * @param chain Chain to add.
         * @param ecAddress Entry Credit address that pays for the commit, either private (Es) or public (EC).
         * If a public address is passed, the private key must either be stored in factom-walletd or
         * a sign function must be provided as part of the options.
         * @param options
         */
        addChain(chain: Chain, ecAddress: string, options?: AddOptions): Promise<AddResponse>;

        /**
         * Add a collection of Chains to the Factom blockchain. Performs both commits and reveals.
         *
         * @param chains Iterable of Chains to add.
         * @param ecAddress Entry Credit address that pays for the commit, either private (Es) or public (EC).
         * If a public address is passed, the private key must either be stored in factom-walletd or
         * a sign function must be provided as part of the options.
         * @param options
         */
        addChains(chains: Chain[], ecAddress: string, options?: AddOptions): Promise<AddResponse[]>;

        /**
         * Add an Entry to the Factom blockchain. Performs both commit and reveal.
         *
         * @param entry Entry to add.
         * @param ecAddress Entry Credit address that pays for the commit, either private (Es) or public (EC).
         * If a public address is passed, the private key must either be stored in factom-walletd or
         * a sign function must be provided as part of the options.
         * @param options
         */
        addEntry(entry: Entry, ecAddress: string, options?: AddOptions): Promise<AddResponse>;

        /**
         * Add a collection of Entries to the Factom blockchain. Performs both commits and reveals.
         *
         * @param entries Iterable of Entries to add.
         * @param ecAddress Entry Credit address that pays for the commit, either private (Es) or public (EC).
         * If a public address is passed, the private key must either be stored in factom-walletd or
         * a sign function must be provided as part of the options.
         * @param options
         */
        addEntries(
            entries: Entry[],
            ecAddress: string,
            options?: AddOptions
        ): Promise<AddResponse[]>;

        // Wallet

        /**
         * Retrieve the corresponding private address of any type of address from factom-walletd if necessary.
         *
         * Returns corresponding private address.
         *
         * @param address Any address (EC or FCT, public or private).
         */
        getPrivateAddress(address: string): Promise<string>;

        // Get

        /**
         * Get all the entries of a given chain.
         *
         * Returns array of entries ordered from the oldest to the newest.
         *
         * @param chainId Chain ID of the chain to retrieve all the entries from.
         */
        getAllEntriesOfChain(chainId: string): Promise<Entry[]>;

        /**
         * Get the head of a given chain.
         *
         * @param chainId Chain ID.
         */
        getChainHead(
            chainId: string
        ): Promise<{
            /**
             * keymr of the head of the chain
             */
            keyMR: string;

            /**
             * Indicates if there is an Entry Block for that chain currently in the process list.
             * If this is the case that would indicate that the head of that chain will change at the next block.
             */
            chainInProcessList: boolean;
        }>;

        /**
         * Get entry by hash (returned Entry does not contain an EntryBlockContext and a timestamp).
         *
         * @param entryHash Hash of the entry to query.
         */
        getEntry(entryHash: string): Promise<Entry>;

        /**
         * Get entry by hash with its EntryBlockContext and timestamp.
         * Note that this method is more expensive than getEntry as it also has to retrieve the Entry Block data.
         *
         * @param entryHash Hash of the entry to query.
         */
        getEntryWithBlockContext(entryHash: string): Promise<Entry>;

        /**
         * Get the first entry of a chain. This methods has to rewind the entire chain which can be an expensive operation.
         *
         * Returns entry with its blockContext and timestamp populated.
         *
         * @param chainId Chain ID to retrieve the first entry from.
         */
        getFirstEntry(chainId: string): Promise<Entry>;

        /**
         * Get the balance of an Entry Credit or Factoid address.
         *
         * Returns balance of EC or FCT. In the case of FCT the balance is in factoshis (10^-8 factoids).
         *
         * @param address Any type of address, FCT or EC, public or private.
         */
        getBalance(address: string): Promise<number>;

        /**
         * Check if a chain exists.
         *
         * @param chainId Chain ID to check.
         */
        chainExists(chainId: string): Promise<boolean>;

        /**
         * Get the current entry credit rate. The rate is the number of factoshis (10^-8 Factoids) necessary to purchase 1 EC.
         *
         * Returns entry credit rate.
         */
        getEntryCreditRate(): Promise<number>;

        /**
         * Get Factoid transaction by id.
         *
         * @param txId Transaction id.
         */
        getTransaction(txId: string): Promise<Transaction>;

        /**
         * Rewind a chain entry by entry (newest to oldest) while a predicate is true.
         *
         * @param chainId Chain to rewind.
         * @param predicate Predicate of the while loop. Iteration stop if either the predicate is false or the end of the chain has been reached.
         * @param func Function to apply at each iteration.
         * @example
         * cli.rewindChainWhile('dab6c095c22ec6db1b0961fdb82d504a95f0a31467bb7df73cc793532b0e9ae3', (entry) => true, function(entry) {
         *      // Do stuff with the entry
         * })
         */
        rewindChainWhile(
            chainId: string,
            predicate: (entry: Entry) => boolean,
            func: (entry: Entry) => void
        ): void;

        // Send transactions

        /**
         * Send a Factoid transaction.
         * This method will throw if the transaction fees are too low given the current EC rate.
         * Note that by default this method also rejects a transaction over paying the minimum required fees by a factor 10 as it is most likely a user input error. This can be overriden with the force option.
         *
         * Returns transaction id
         *
         * @param transaction
         * @param options
         */
        sendTransaction(
            transaction: Transaction,
            options?: {
                /**
                 * Time to wait in seconds for transaction acknowledgment before timing out. If negative value, doesn't wait for ack. Defaults to 60.
                 */
                timeout?: number;

                /**
                 * Set to true to bypass the checks of the transaction fee overpay and the minimum EC output amount.
                 */
                force?: boolean;
            }
        ): Promise<string>;

        /**
         * Create a single input single output (SISO) Factoid transaction.
         *
         * @param originAddress Private or public Factoid address origin of the funds. If a public address is provided (FA) the corresponding private address must be stored in factom-walletd.
         * @param recipientAddress Public Factoid address receiving the funds.
         * @param amount Amount to transfer in factoshis (10^-8 Factoids).
         * @param fees Value to override fees of the transaction (if not specified the library computes the lowest acceptable fee).
         */
        createFactoidTransaction(
            originAddress: string,
            recipientAddress: string,
            amount: number,
            fees?: number
        ): Promise<Transaction>;

        /**
         * Create a transaction to convert Factoids to Entry Credit.
         *
         * @param originAddress Private or public Factoid address origin of the funds. If a public address is provided (FA) the corresponding private address must be stored in factom-walletd.
         * @param recipientAddress Public Entry Credit address to receive the ECs.
         * @param ecAmount Amount of Entry Credit (EC) to purchase.
         * @param fees Value to override fees of the transaction (if not specified the library computes the lowest acceptable fee).
         */
        createEntryCreditPurchaseTransaction(
            originAddress: string,
            recipientAddress: string,
            ecAmount: number,
            fees?: number
        ): Promise<Transaction>;

        // Ack
        /**
         * Wait until an acknowlegment is received from the network for a commit.
         *
         * Returns status of the commit. See https://docs.factom.com/api#ack
         *
         * @param txId Commit transaction ID.
         * @param timeout Wait time in seconds.
         */
        waitOnCommitAck(txId: string, timeout: number): Promise<string>;

        /**
         * Wait until an acknowlegment is received from the network for a reveal.
         *
         * Returns status of the reveal. See https://docs.factom.com/api#ack
         *
         * @param hash Hash of the revealed entry.
         * @param chainId Chain ID of the revealed entry.
         * @param timeout Wait time in seconds. Defaults to 60.
         */
        waitOnRevealAck(hash: string, chainId: string, timeout?: number): Promise<string>;

        /**
         * Wait until an acknowlegment is received from the network for a Factoid transaction.
         *
         * Returns status of the transaction. See https://docs.factom.com/api#ack
         *
         * @param txId Transaction ID.
         * @param timeout Wait time in seconds.
         */
        waitOnFactoidTransactionAck(txId: string, timeout?: number): Promise<string>;

        // Raw APIs

        /**
         * Make a direct call to factomd API. See https://docs.factom.com/api#factomd-api.
         *
         * Returns Factomd API response.
         *
         * @param method Factomd API method name.
         * @param params The object that the factomd API is expecting.
         * @param requestConfig Request configuration.
         */
        factomdApi(
            method: string,
            params?: any,
            requestConfig?: {
                timeout?: number;
                retry?: {
                    retries?: number;
                    factor?: number;
                    minTimeout?: number;
                    maxTimeout?: number;
                };
            }
        ): Promise<any>;

        /**
         * Make a call to factom-walletd API. See https://docs.factom.com/api#factom-walletd-api.
         *
         * Returns Object Walletd API response.
         *
         * @param method Walletd API method name.
         * @param params The object that the walletd API is expecting.
         * @param requestConfig Request configuration.
         */
        walletdApi(
            method: string,
            params?: any,
            requestConfig?: {
                timeout?: number;
                retry?: {
                    retries?: number;
                    factor?: number;
                    minTimeout?: number;
                    maxTimeout?: number;
                };
            }
        ): Promise<any>;

        // Blocks

        /**
         * Return blockchain heights. For the explanation of the different heights see https://docs.factom.com/api#heights.
         */
        getHeights(): Promise<{
            directoryBlockHeight: number;
            leaderHeight: number;
            entryBlockHeight: number;
            entryHeight: number;
        }>;

        /**
         * Return latest directory block saved.
         */
        getDirectoryBlockHead(): Promise<DirectoryBlock>;

        /**
         * Get a directory block by keyMR or height.
         *
         * @param arg Either KeyMR (string) or height (number) of the directory block.
         */
        getDirectoryBlock(arg: string | number): Promise<DirectoryBlock>;

        /**
         * Get an admin block by keyMR or height.
         *
         * @param arg Either KeyMR (string) or height (number) of the admin block.
         */
        getAdminBlock(arg: string | number): Promise<AdminBlock>;

        /**
         * Get an entry credit block by keyMR or height.
         *
         * @param arg Either KeyMR (string) or height (number) of the entry credit block.
         */
        getEntryCreditBlock(arg: string | number): Promise<EntryCreditBlock>;

        /**
         * Get a Factoid block by keyMR or height.
         *
         * @param arg Either KeyMR (string) or height (number) of the factoid block.
         */
        getFactoidBlock(arg: string | number): Promise<FactoidBlock>;

        /**
         * Get an entry block.
         *
         * @param keyMR KeyMR of the entry block.
         */
        getEntryBlock(keyMR: string): Promise<EntryBlock>;
    }

    /**
     * Factomd API client.
     */
    export class FactomdCli {
        /**
         * @param conf Factomd connection options.
         */
        constructor(conf: ConnectionOptions);

        /**
         * Make a call to factomd API. See https://docs.factom.com/api#factomd-api.
         *
         * Returns Object Factomd API response.
         *
         * @param method Factomd API method name.
         * @param params The object that the factomd API is expecting.
         * @param requestConfig Request configuration.
         */
        call(
            method: string,
            params?: any,
            requestConfig?: {
                timeout?: number;
                retry?: {
                    retries?: number;
                    factor?: number;
                    minTimeout?: number;
                    maxTimeout?: number;
                };
            }
        ): Promise<any>;
    }

    /**
     * Walletd API client.
     */
    export class WalletdCli {
        /**
         * @param opts Walletd connection options.
         */
        constructor(opts: ConnectionOptions);

        /**
         * Make a call to factom-walletd API. See https://docs.factom.com/api#factom-walletd-api.
         *
         * Returns Object Walletd API response.
         *
         * @param method Walletd API method name.
         * @param params The object that the walletd API is expecting.
         * @param requestConfig Request configuration.
         */
        call(
            method: string,
            params?: any,
            requestConfig?: {
                timeout?: number;
                retry?: {
                    retries?: number;
                    factor?: number;
                    minTimeout?: number;
                    maxTimeout?: number;
                };
            }
        ): Promise<any>;
    }

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
    export class FactomEventEmitter extends EventEmitter {
        /**
         * @param cli - FactomCli instance to be used by the FactomEventEmitter instance to fetch blockchain data.
         * @param opts - Options to set on the FactomEventEmitter instance
         */
        constructor(cli: FactomCli, opts?: { interval?: number });

        /**
         * Get active chain id subscriptions
         */
        chainSubscriptions: Set<string>;

        /**
         * Get active factoid address subscriptions
         */
        factoidAddressSubscriptions: Set<string>;

        /**
         * Determine whether or not polling is currently active.
         */
        isPolling: boolean;
    }

    /**
     * Block context of an Entry.
     */

    interface EntryBlockContext {
        /**
         * Epoch timestamp (in seconds) of the entry.
         */
        entryTimestamp: number;

        /**
         * Directory Block height.
         */
        directoryBlockHeight: number;

        /**
         * Epoch timestamp (in seconds) of the Entry Block.
         */
        entryBlockTimestamp: number;

        /**
         * Entry Block sequence number.
         */
        entryBlockSequenceNumber: number;

        /**
         * Entry Block KeyMR.
         */
        entryBlockKeyMR: string;
    }

    /**
     * Class representing an Entry.
     *
     * @example
     * const myEntry = Entry.builder()
     *     .chainId('9107a308f91fd7962fecb321fdadeb37e2ca7d456f1d99d24280136c0afd55f2')
     *     .extId('6d79206578742069642031') // If no encoding parameter is passed as 2nd argument, 'hex' is used as default
     *     .extId('Some external ID', 'utf8')
     *     .content('My new content',  'utf8')
     *     .build();
     */
    export class Entry {
        /**
         * @param builder builder
         */
        constructor(builder: EntryBuilder);

        /**
         * Chain ID.
         */
        chainId: Buffer;

        /**
         * External IDs.
         */
        extIds: Buffer[];

        /**
         * Content.
         */
        content: Buffer;

        /**
         * Timestamp in milliseconds for the commit.
         */
        timestamp: number;

        /**
         * Block context. This property is *not* populated when using the method getEntry.
         */
        blockContext: EntryBlockContext;

        /**
         * Entry content as hex encoded string.
         */
        chainIdHex: string;

        /**
         * Entry content as hex encoded string.
         */
        contentHex: string;

        /**
         * External ids as hex encoded strings.
         */
        extIdsHex: string[];

        /**
         * Gets the entry size in bytes.
         */
        size(): number;

        /**
         * Gets the entry payload size in bytes (excluding the header).
         */
        payloadSize(): number;

        /**
         * Gets the entry raw data size in bytes (payload size excluding the 2 byte overhead per extID).
         */
        rawDataSize(): number;

        /**
         * Gets the remaining number of free bytes that can be added to the entry for the same EC cost.
         */
        remainingFreeBytes(): number;

        /**
         * Gets the maximum number of bytes  that can be added to the entry before hitting the maximum (10kb).
         */
        remainingMaxBytes(): number;

        /**
         * Gets the hash of the entry.
         */
        hash(): Buffer;

        /**
         * Gets the hash of the entry as hex encoded string.
         */
        hashHex(): string;

        /**
         * Result of marshaling the entry.
         */
        marshalBinary(): Buffer;

        /**
         * Result of marshaling the entry as hex encoded string.
         */
        marshalBinaryHex(): string;

        /**
         * Get Entry Credit cost of the entry.
         */
        ecCost(): number;

        /**
         * Convert to a JavaScript Object representation of the entry. Can be used as argument of EntryBuilder.
         */
        toObject(): object;

        /**
         * Entry builder static factory.
         *
         * Returns a new EntryBuilder.
         *
         * @param entry Optional entry to use to initialize the attributes of the builder.
         */
        static builder(entry?: Entry): EntryBuilder;
    }

    /**
     * Class to build an Entry
     */
    export class EntryBuilder {
        /**
         * Class to build an entry.
         *
         * @param entry Optional entry to use to initialize the attributes of the builder.
         */
        constructor(entry?: Entry);

        /**
         * Set content.
         *
         * @param content Content.
         * @param enc Encoding of the content if it is a string. Defaults to hex.
         */
        content(content: string | Buffer, enc?: string): EntryBuilder;

        /**
         * Set chain ID.
         * @param chainId Chain ID
         * @param enc Encoding of the chainId if it is a string. Defaults to hex.
         */
        chainId(chainId: string | Buffer, enc?: string): EntryBuilder;

        /**
         * Set external IDs.
         *
         * @param extIds External IDs.
         * @param enc Encoding of the external ids if they are strings.
         */
        extIds(extIds: string[] | Buffer[], enc?: string): EntryBuilder;

        /**
         *
         * @param extId External ID.
         * @param enc Encoding of the external id if it is a string. Defaults to hex.
         */
        extId(extId: string | Buffer, enc?: string): EntryBuilder;

        /**
         * Set the timestamp for the entry commit.
         * If not set the library will use Date.now() as the commit timestamp.
         *
         * @param timestamp Timestamp in milliseconds.
         */
        timestamp(timestamp: number): EntryBuilder;

        /**
         * Build the Entry.
         *
         * Returns the built entry.
         */
        build(): Entry;
    }

    /**
     * Class representing a Chain.
     */
    export class Chain {
        /**
         * @param firstEntry First entry of the chain
         */
        constructor(firstEntry: Entry);

        /**
         * @param chain Chain to copy
         */
        constructor(chain: Chain);

        /**
         * Chain ID.
         */
        id: Buffer;

        /**
         * First entry of the chain.
         */
        firstEntry: Entry;

        /**
         * Chain ID as a hex encoded string.
         */
        idHex: string;

        /**
         * Get Entry Credit cost of the chain.
         */
        ecCost(): number;

        /**
         * Convert to a JavaScript Object representation of the chain.
         */
        toObject(): object;
    }

    /**
     * Class to build a Transaction
     */
    class TransactionBuilder {
        /**
         * @param transaction Optional transaction to use to initialize the attributes of the builder.
         */
        constructor(transaction: Transaction);

        /**
         * Add an input to the transaction.
         *
         * @param fctAddress Factoid address.
         * User should provide a private address (Fs) to allow the signature of the transaction.
         * If a public address is provided the user will need to provide the RCD and signature using the method rcdSignature.
         * @param amount Amount in factoshis (10^-8 Factoids).
         */
        input(fctAddress: string, amount: number): TransactionBuilder;

        /**
         * Add an output to the transaction. Both FCT and EC outputs are supported.
         * Please note that in case of an EC output, the amount is still in factoshis, it is not the number of Entry Credits.
         *
         * @param publicAddress Factoid or Entry Credit public address.
         * @param amount Amount in factoshis (10^-8 Factoids).
         */
        output(publicAddress: string, amount: number): TransactionBuilder;

        /**
         * Add a RCD and signature to the transaction. This is used only in the case of unsigned transactions (usefull for hardware wallets).
         * RCDs/signatures need to be added in the same order as their corresponding inputs.
         *
         * @param rcd RCD.
         * @param signature Signature.
         */
        rcdSignature(rcd: string, signature: string): TransactionBuilder;

        /**
         * Set the transaction timestamp.
         * If not set the library will use Date.now() as the transaction timestamp.
         *
         * @param timestamp Timestamp in milliseconds.
         */
        timestamp(timestamp: number): TransactionBuilder;

        /**
         * Build the Transaction.
         */
        build(): Transaction;
    }

    /**
     * Block context of a Transaction.
     */
    interface TransactionBlockContext {
        /**
         * Factoid Block KeyMR the transaction is part of.
         */
        factoidBlockKeyMR: string;

        /**
         * Directory Block KeyMR the transaction was secured in.
         */
        directoryBlockKeyMR: string;

        /**
         * Directory Block height the transaction was secured in.
         */
        directoryBlockHeight: number;
    }

    /**
     * Class to hold address and amount of an input/output of a Transaction.
     */
    class TransactionAddress {
        /**
         * @param address Factoid or Entry Credit public address.
         * @param amount
         */
        constructor(address: string, amount: number);

        /**
         * Factoid or Entry Credit public address.
         */
        address: string;

        /**
         * Amount in factoshis (10^-8 Factoids).
         */
        amount: number;
    }

    /**
     * Class representing a Factoid transaction.
     *
     * @example
     * const transaction = Transaction.builder()
     *   .input('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X', 14000000)
     *   .input('Fs2E6iXCLAKDiPqVtfxtuQCKsTe7o6DJFDnht1wST53s4ibtdu9f', 1010000 + fees)
     *   .output('FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg5uH', 5000000)
     *   .output('FA24PAtyZWWVAPm95ZCVpwyY6RYHeCMTiZt2v4VQAY8aBXMUZteF', 10000000)
     *    // Note that the line below is to buy Entry Credits (see the address type) and the amount is in Factoshis like other outputs:
     *    // it is *not* the number of Entry Credits you are purchasing.
     *   .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e3QR', 10000)
     *   .build()
     */
    export class Transaction {
        constructor(builder: TransactionBuilder, blockContext?: TransactionBlockContext);

        /**
         * Transaction ID
         */
        id: string;

        /**
         * Timestamp in milliseconds.
         */
        timestamp: number;

        /**
         * Inputs.
         */
        inputs: TransactionAddress[];

        /**
         * Factoid outputs.
         */
        factoidOutputs: TransactionAddress[];

        /**
         * Entry Credit outputs.
         */
        entryCreditOutputs: TransactionAddress[];

        /**
         * Total amount of factoshis as input of this transaction.
         */
        totalInputs: number;

        /**
         * Total amount of factoshis as factoid outputs of this transaction.
         */
        totalFactoidOutputs: number;

        /**
         * Total amount of factoshis as entry credit outputs of this transaction.
         */
        totalEntryCreditOutputs: number;

        /**
         * Fees paid in this transaction.
         */
        feesPaid: number;

        /**
         * Block context.
         */
        blockContext: TransactionBlockContext;

        /**
         * RCDs
         */
        rcds: Buffer[];

        /**
         * Signatures
         */
        signatures: Buffer[];

        /**
         * Check if the transaction is signed or not.
         *
         * Returns true if the transaction is signed.
         */
        isSigned(): boolean;

        /**
         * Compute if the fees of the transaction are enough (for a given EC rate).
         *
         * Returns true if the fees are sufficient.
         *
         * @param ecRate Entry Credit rate.
         */
        validateFees(ecRate: number): boolean;

        /**
         * Compute the required fees (minimum difference between inputs and outputs amounts) for the transaction (for a given EC rate).
         *
         * Returns number of factoshis (10^-8 Factoids) required as fees for this transaction.
         *
         * @param ecRate Entry Credit rate.
         * @param opts Extra options necessary to compute fees of an unsigned transaction.
         */

        computeRequiredFees(ecRate: number, opts?: any): number;
        /**
         * Compute and returns required Entry Credit fees.
         * @param opts Extra options necessary to compute fees of an unsigned transaction.
         */
        computeEcRequiredFees(opts?: any): number;

        /**
         * Returns result of marshaling the transaction.
         */
        marshalBinary(): Buffer;

        /**
         * Transaction builder static factory.
         *
         * Returns a new TransactionBuilder.
         *
         * @param transaction Optional transaction to use to initialize the attributes of the builder.
         */
        static builder(transaction?: Transaction): TransactionBuilder;
    }

    /**
     * Class representing an Entry block.
     */
    export class EntryBlock {
        /**
         * Key Mertle Root.
         */
        keyMR: string;

        /**
         * Key Mertle Root of the previous Entry block.
         */
        previousBlockKeyMR: string;

        /**
         * Directory block height.
         */
        directoryBlockHeight: number;

        /**
         * UNIX timestamp (seconds).
         */
        timestamp: number;

        /**
         * Chain ID.
         */
        chainId: string;

        /**
         * Sequence number of this block relative to that sub chain.
         */
        sequenceNumber: number;

        /**
         * References to entries with their UNIX timestamps.
         */
        entryRefs: { entryHash: string; timestamp: number }[];
    }

    /**
     * Class representing a Factoid block.
     */
    export class FactoidBlock {
        /**
         * Key Mertle Root.
         */
        keyMR: string;

        /**
         * Merkle Root of the body.
         */
        bodyMR: string;

        /**
         * Key Merkle Root of the previous Factoid block.
         */
        previousBlockKeyMR: string;

        /**
         * Ledger Key Merkle Root.
         */
        ledgerKeyMR: string;

        /**
         * Ledger Key Merkle Root of the previous Factoid block.
         */
        previousLedgerKeyMR: string;

        /**
         * Entry credit rate.
         */
        entryCreditRate: number;

        /**
         * Directory block height.
         */
        directoryBlockHeight: number;

        /**
         * Array of Factoid transactions part of this block.
         */
        transactions: Transaction[];

        /**
         * Get coinbase transaction of the block.
         */
        getCoinbaseTransaction(): Transaction;
    }

    /**
     * Class representing an Entry Credit block.
     */
    export class EntryCreditBlock {
        /**
         * Hash of the header.
         */
        headerHash: string;

        /**
         * Full hash.
         */
        fullHash: string;

        /**
         * Header expansion area.
         */
        headerExpansionArea: string;

        /**
         * Hash of the body.
         */
        bodyHash: string;

        /**
         * Hash of the previous Entry Credit block header.
         */
        previousHeaderHash: string;

        /**
         * Full hash of the previous Entry Credit block.
         */
        previousFullHash: string;

        /**
         * Directory block height.
         */
        directoryBlockHeight: number;

        /**
         * Size of the body.
         */
        bodySize: number;

        /**
         * Object count.
         */
        objectCount: number;

        /**
         * Delimitation of the commits for each minute. Use method getCommitsForMinute rather than using this attribute directly.
         */
        minuteIndexes: number[];

        /**
         * Array of commits.
         */
        commits: {
            version: number;
            millis: number;
            entryHash: string;
            credits: number;
            ecPublicKey: string;
            signature: string;
        }[];

        /**
         * Get all the commits for a given minute.
         *
         * @param minute Minute (between 1 and 10 included)
         */
        getCommitsForMinute(
            minute: number
        ): {
            version: number;
            millis: number;
            entryHash: string;
            credits: number;
            ecPublicKey: string;
            signature: string;
        }[];
    }

    /**
     * Class representing an Admin block.
     */
    export class AdminBlock {
        /**
         * Back reference hash.
         */
        backReferenceHash: string;

        /**
         * Lookup hash.
         */
        lookupHash: string;

        /**
         * Directory block height.
         */
        directoryBlockHeight: number;

        /**
         * Back reference hash of previous Admin block.
         */
        previousBackReferenceHash: string;

        /**
         * Header expansion size.
         */
        headerExpansionSize: number;

        /**
         * Header expansion area.
         */
        headerExpansionArea: string;

        /**
         * Size of the body.
         */
        bodySize: number;

        /**
         * Admin entries. Each entry has its own type (can be identified either by its adminId (number) or its adminCode (string)).
         */
        entries: {
            adminId: number;
            adminCode: AdminCode;
            identityChainId?: string;
            previousDirectoryBlockSignature?: { publicKey: string; signature: string };
            matryoshkaHash?: string;
            amount?: number;
            keyPriority?: string;
            keyType?: string;
            ecdsaPublicKey?: string;
            outputs?: {
                address: string;
                rcdHash: string;
                amount: number;
            }[];
            descriptorHeight?: number;
            descriptorIndex?: number;
            rcdHash?: string;
            factoidAddress?: string;
            efficiency?: number;
        }[];

        /**
         * Return all the admin entries for given types.
         *
         * @param types A sequence of either numbers representing an adminId, strings representing an adminCode or AdminCode enums.
         */
        getEntriesOfTypes(...types: number[] | string[] | AdminCode[]): any;
    }

    /**
     * AdminCode enum
     */
    export const enum AdminCode {
        MINUTE_NUMBER = 'MINUTE_NUMBER',
        DIRECTORY_BLOCK_SIGNATURE = 'DIRECTORY_BLOCK_SIGNATURE',
        REVEAL_MATRYOSHKA_HASH = 'REVEAL_MATRYOSHKA_HASH',
        ADD_REPLACE_MATRYOSHKA_HASH = 'ADD_REPLACE_MATRYOSHKA_HASH',
        INCREASE_SERVER_COUNT = 'INCREASE_SERVER_COUNT',
        ADD_FEDERATED_SERVER = 'ADD_FEDERATED_SERVER',
        ADD_AUDIT_SERVER = 'ADD_AUDIT_SERVER',
        REMOVE_FEDERATED_SERVER = 'REMOVE_FEDERATED_SERVER',
        ADD_FEDERATED_SERVER_SIGNING_KEY = 'ADD_FEDERATED_SERVER_SIGNING_KEY',
        ADD_FEDERATED_SERVER_BITCOIN_ANCHOR_KEY = 'ADD_FEDERATED_SERVER_BITCOIN_ANCHOR_KEY',
        SERVER_FAULT_HANDOFF = 'SERVER_FAULT_HANDOFF',
        COINBASE_DESCRIPTOR = 'COINBASE_DESCRIPTOR',
        COINBASE_DESCRIPTOR_CANCEL = 'COINBASE_DESCRIPTOR_CANCEL',
        ADD_AUTHORITY_FACTOID_ADDRESS = 'ADD_AUTHORITY_FACTOID_ADDRESS',
        ADD_AUTHORITY_EFFICIENCY = 'ADD_AUTHORITY_EFFICIENCY'
    }

    /**
     * Class representing a Directory block.
     */
    export class DirectoryBlock {
        /**
         * Key Merkel Root.
         */
        keyMR: string;

        /**
         * Height.
         */
        height: number;

        /**
         * Key Merkel Root of the previous Directory block.
         */
        previousBlockKeyMR: string;

        /**
         * UNIX timestamp (seconds).
         */
        timestamp: number;

        /**
         * Full hash of the block. Only available when the block is queried by height.
         */
        fullHash: string;

        /**
         * Full hash of the previous Directory block. Only available when the block is queried by height.
         */
        previousFullHash: string;

        /**
         * Key Merkle Root of the block body. Only available when the block is queried by height.
         */
        bodyKeyMR: string;

        /**
         * Reference to the admin block.
         */
        adminBlockRef: string;

        /**
         * Reference to the entry credit block.
         */
        entryCreditBlockRef: string;

        /**
         * Reference to the factoid block.
         */
        factoidBlockRef: string;

        /**
         * References to the entry blocks.
         */
        entryBlockRefs: {
            chainId: string;
            keyMR: string;
        }[];
    }

    /**
     * Compose the commit and reveal of a Chain, that can then be used as inputs of the factomd APIs `commit-chain` and `reveal-chain`.
     *
     * @param chain Chain to compose the commit and reveal of.
     * @param ecAddress Private Entry Credit address that pays for and sign the commit.
     */
    function composeChain(
        chain: Chain,
        ecAddress: string
    ): {
        commit: Buffer;
        reveal: Buffer;
    };

    /**
     * Compose the commit and reveal of a Chain using an external signing function for the commit.
     * The result can then be used as inputs of the factomd APIs `commit-chain` and `reveal-chain`.
     * @param chain Chain to compose the commit and reveal of.
     * @param ecPublicAddress Public Entry Credit address that pays for the commit.
     * @param sign Signing function.
     * Takes as input the data to sign with the EC public key paying for the commmit
     * and should return its signature as a Buffer or a hex encoded string (or a Promise of those).
     * The returned signature must have been made by the private key corresponding to the ecPublicAddress argument.
     */
    function composeChainDelegateSig(
        chain: Chain,
        ecPublicAddress: string,
        sign: (data: Buffer) => Buffer | string | Promise<Buffer | string>
    ): Promise<{
        commit: Buffer;
        reveal: Buffer;
    }>;

    /**
     * Compose the commit of a Chain, that can then be used as input of the factomd API `commit-chain`.
     * Note that if the chain first entry doesn't have a timestamp set the library will use Date.now() as the default for the commit timestamp.
     *
     * Returns chain commit.
     *
     * @param chain Chain to compose the commit of.
     * @param ecAddress Private Entry Credit address that pays for and sign the commit.
     */
    function composeChainCommit(chain: Chain, ecAddress: string): Buffer;

    /**
     * Compose the commit of a Chain using an external signing function.
     * The commit can then be sent through factomd API `commit-chain`.
     * @param chain Chain to compose the commit of.
     * @param ecPublicAddress Public Entry Credit address that pays for the commit.
     * @param sign Signing function.
     * Takes as input the data to sign with the EC public key paying for the commmit
     * and should return its signature as a Buffer or a hex encoded string (or a Promise of those).
     * The returned signature must have been made by the private key corresponding to the ecPublicAddress argument.
     */
    function composeChainCommitDelegateSig(
        chain: Chain,
        ecPublicAddress: string,
        sign: (data: Buffer) => Buffer | string | Promise<Buffer | string>
    ): Promise<Buffer>;

    /**
     * Compose the reveal of a Chain, that can then be used as input of the factomd API `reveal-chain`.
     *
     * Returns chain reveal.
     *
     * @param chain Chain to compose the reveal of.
     */
    function composeChainReveal(chain: Chain): Buffer;

    /**
     * Compose the commit and reveal of an Entry, that can then be used as inputs of the factomd APIs `commit-entry` and `reveal-entry`.
     *
     * @param entry Entry to compose the commit and reveal of.
     * @param ecAddress Private Entry Credit address that pays for and sign the commit.
     */
    function composeEntry(
        entry: Entry,
        ecAddress: string
    ): {
        commit: Buffer;
        reveal: Buffer;
    };

    /**
     * Compose the commit and reveal of an Entry using an external signing function.
     * The result can then be used as inputs of the factomd APIs `commit-entry` and `reveal-entry`.
     * @param entry Entry to compose the commit and reveal of.
     * @param ecPublicAddress Public Entry Credit address that pays for the commit.
     * @param sign Signing function.
     * Takes as input the data to sign with the EC public key paying for the commmit
     * and should return its signature as a Buffer or a hex encoded string (or a Promise of those).
     * The returned signature must have been made by the private key corresponding to the ecPublicAddress argument.
     */
    function composeEntryDelegateSig(
        entry: Entry,
        ecPublicAddress: string,
        sign: (data: Buffer) => Buffer | string | Promise<Buffer | string>
    ): Promise<{
        commit: Buffer;
        reveal: Buffer;
    }>;

    /**
     * Compose the commit of an Entry, that can then be used as input of the factomd API `commit-entry`.
     * Note that if the Entry doesn't have a timestamp set the library will use Date.now() as the default for the commit timestamp.
     *
     * Returns entry commit.
     *
     * @param entry Entry to compose the commit of.
     * @param ecAddress Private Entry Credit address that pays for and sign the commit.
     */
    function composeEntryCommit(entry: Entry, ecAddress: string): Buffer;

    /**
     * Compose the commit of an Entry delegating the signature.
     * The commit can then be sent through factomd API `commit-entry`.
     * @param entry Entry to compose the commit of.
     * @param ecPublicAddress Public Entry Credit address that pays for the commit.
     * @param sign - Signing function.
     * Takes as input the data to sign with the EC public key paying for the commmit
     * and should return its signature as a Buffer or a hex encoded string (or a Promise of those).
     * The returned signature must have been made by the private key corresponding to the ecPublicAddress argument.
     */
    function composeEntryCommitDelegateSig(
        entry: Entry,
        ecPublicAddress: string,
        sign: (data: Buffer) => Buffer | string | Promise<Buffer | string>
    ): Promise<Buffer>;

    /**
     * Compose the reveal of an Entry, that can then be used as input of the factomd API `reveal-entry`.
     *
     * Returns entry reveal.
     *
     * @param entry Entry to compose the reveal of.
     */
    function composeEntryReveal(entry: Entry): Buffer;

    /**
     * Compute the ID of a Chain provided its first entry.
     *
     * Returns chain ID.
     *
     * @param firstEntry The first entry of the chain.
     */
    function computeChainId(firstEntry: Entry): Buffer;

    /**
     * Compute the transaction ID of the Chain commit. The transaction ID is dependent on the timestamp set in the chain first entry.
     * Note that if the timestamp is not set the library uses Date.now() as the default, changing the result of this function if called at different times.
     *
     * Returns the transaction id of the Chain commit.
     *
     * @param chain
     */
    function computeChainTxId(chain: Chain): Buffer;

    /**
     * Compute the transaction ID of the Entry commit. The transaction ID is dependent on the timestamp set in the entry.
     * Note that if the timestamp is not set the library uses Date.now() as the default, changing the result of this function if called at different times.
     *
     * Returns the transaction id of the Entry commit.
     *
     * @param entry
     */
    function computeEntryTxId(entry: Entry): Buffer;

    /**
     * Validate that an address is valid (well formed).
     * @param address Address to validate
     */
    function isValidAddress(address: string): boolean;

    /**
     * Validate if an address is a valid public EC or FCT address.
     * @param address Address to validate.
     */
    function isValidPublicAddress(address: string): boolean;

    /**
     * Validate if an address is a valid private EC or FCT address.
     * @param address Address to validate.
     */
    function isValidPrivateAddress(address: string): boolean;

    /**
     * Validate if an address is a valid EC address (public or private).
     * @param address Address to validate.
     */
    function isValidEcAddress(address: string): boolean;

    /**
     * Validate if an address is a valid public EC address.
     * @param address Address to validate.
     */
    function isValidPublicEcAddress(address: string): boolean;

    /**
     * Validate if an address is a valid private EC address.
     * @param address Address to validate.
     */
    function isValidPrivateEcAddress(address: string): boolean;

    /**
     * Validate if an address is a valid FCT address (public or private).
     * @param address Address to validate.
     */
    function isValidFctAddress(address: string): boolean;

    /**
     * Validate if an address is a valid public FCT address.
     * @param address Address to validate.
     */
    function isValidPublicFctAddress(address: string): boolean;

    /**
     * Validate if an address is a valid private FCT address.
     * @param address Address to validate.
     */
    function isValidPrivateFctAddress(address: string): boolean;

    /**
     * Get public address corresponding to an address.
     * @param address Any address.
     */
    function getPublicAddress(address: string): string;

    /**
     * Extract the key contained in an address. Cannot be used with public FCT address as those contain a RCD hash and not a key (See {@link addressToRcdHash}).
     * @param address Any address, except public FCT address.
     */
    function addressToKey(address: string): Buffer;

    /**
     * Extract the RCD hash from a public FCT address.
     * @param address Public FCT address.
     */
    function addressToRcdHash(address: string): Buffer;

    /**
     * Build a human readable public FCT address from a key.
     * @param key
     */
    function keyToPublicFctAddress(key: Buffer | string): string;

    /**
     * Build a human readable public FCT address from a RCD hash.
     * @param rcdHash
     */
    function rcdHashToPublicFctAddress(rcdHash: Buffer | string): string;

    /**
     * Build a human readable private FCT address from a 32-byte seed.
     * @param seed 32-byte seed.
     */
    function seedToPrivateFctAddress(seed: Buffer | string): string;

    /**
     * Build a human readable public EC address from a 32-byte key.
     * @param key 32-byte key.
     */
    function keyToPublicEcAddress(key: Buffer | string): string;

    /**
     * Build a human readable private EC address from a 32-byte seed.
     * @param seed 32-byte seed.
     */
    function seedToPrivateEcAddress(seed: Buffer | string): string;

    /**
     * Generate a new random FCT address pair (private and public).
     */
    function generateRandomFctAddress(): {
        public: string;
        private: string;
    };

    /**
     * Generate a new random EC address pair (private and public).
     */
    function generateRandomEcAddress(): {
        public: string;
        private: string;
    };
}
