const { FactomCli, FactomEvent } = require('../src/factom'),
    { DirectoryBlock, FactoidBlock, AdminBlock, EntryCreditBlock, EntryBlock } = require('../src/blocks'),
    mockDirectoryBlock = require('./data/directory-block.json'),
    assert = require('chai').assert,
    Promise = require('bluebird');

describe('Test FactomEvent', () => {
    const cli = new FactomCli({
        factomd: {
            host: process.env.FACTOMD_HOST,
            port: process.env.FACTOMD_PORT
        }
    });

    /**
     * Test Polling
     */

    it('should start polling and emit a new directoryBlock', async () => {
        const event = new FactomEvent(cli);

        try {
            const block = await new Promise(resolve => {
                event.on('directoryBlock', block => resolve(block)).startPolling();
            });
            assert.instanceOf(block, DirectoryBlock);
            assert.isTrue(event.isPolling);
        } finally {
            event.stopPolling();
        }
    });

    it('should start then stop polling ', async () => {
        const event = new FactomEvent(cli);

        await new Promise(resolve => {
            event
                .on('directoryBlock', resolve)
                .startPolling()
                .stopPolling();
        });

        assert.strictEqual(event.listenerCount('directoryBlock'), 1);
        assert.isFalse(event.isPolling);
    });

    it('should throw an error if startPolling is called twice', () => {
        const event = new FactomEvent(cli);

        try {
            event.startPolling();
            assert.throws(() => event.startPolling(), 'polling already started');
        } finally {
            event.stopPolling();
        }
    });

    it('should throw an error if passing a non-number to startPolling', async () => {
        const event = new FactomEvent(cli);
        assert.throws(() => event.startPolling('foo'), 'interval must be a positive number');
    });

    it('should throw an error if passing a negative number to startPolling', async () => {
        const event = new FactomEvent(cli);
        assert.throws(() => event.startPolling(-50), 'interval must be a positive number');
    });

    /**
     * Test Factoid Block Subscriptions
     */

    it('should subscribe to factoid blocks', async () => {
        const event = new FactomEvent(cli);

        try {
            const factoidBlock = await new Promise(resolve => {
                event
                    .subscribeToFactoidBlocks()
                    .on(event.factoidBlock, resolve)
                    .startPolling();
            });

            assert.isTrue(event.isSubscribedToFactoidBlocks);
            assert.instanceOf(factoidBlock, FactoidBlock);
        } finally {
            event.stopPolling(true);
        }
    });

    it('should unsubscribe from factoid blocks', async () => {
        const event = new FactomEvent(cli);
        const factoidBlockRef = '8fee341e9cec46488aef80f7f3688974a974a603b52cfcfc9337bac5c5894f68';

        await new Promise(resolve => {
            event
                .subscribeToFactoidBlocks()
                .on(event.factoidBlock, resolve)
                .emit(event.directoryBlock, { factoidBlockRef });
        });
        let hasFactoidBlockListener = event.listeners(event.directoryBlock).includes(event._fetchFactoidBlock);
        assert.isTrue(hasFactoidBlockListener);
        assert.isTrue(event.isSubscribedToFactoidBlocks);

        await new Promise((resolve, reject) => {
            event
                .unsubscribeFromFactoidBlocks()
                .on(event.factoidBlock, () => reject(new Error('failed to unsubscribe')))
                .emit(event.directoryBlock, { factoidBlockRef });

            setTimeout(resolve, 600);
        });
        hasFactoidBlockListener = event.listeners(event.directoryBlock).includes(event._fetchFactoidBlock);
        assert.isFalse(hasFactoidBlockListener);
        assert.isFalse(event.isSubscribedToFactoidBlocks);
    });

    /**
     * Test Admin Block Subscriptions
     */

    it('should subscribe to admin blocks', async () => {
        const event = new FactomEvent(cli);

        try {
            const adminBlock = await new Promise(resolve => {
                event
                    .subscribeToAdminBlocks()
                    .on(event.adminBlock, resolve)
                    .startPolling();
            });

            assert.isTrue(event.isSubscribedToAdminBlocks);
            assert.instanceOf(adminBlock, AdminBlock);
        } finally {
            event.stopPolling(true);
        }
    });

    it('should unsubscribe from admin blocks', async () => {
        const event = new FactomEvent(cli);
        const adminBlockRef = '3b675f9495f707859cc16bcae0ae58cc67de1dc04826546b4b2ce3b53399f1da';

        await new Promise(resolve => {
            event
                .subscribeToAdminBlocks()
                .on(event.adminBlock, resolve)
                .emit(event.directoryBlock, { adminBlockRef });
        });
        let hasAdminBlockListener = event.listeners(event.directoryBlock).includes(event._fetchAdminBlock);
        assert.isTrue(hasAdminBlockListener);
        assert.isTrue(event.isSubscribedToAdminBlocks);

        await new Promise((resolve, reject) => {
            event
                .unsubscribeFromAdminBlocks()
                .on(event.adminBlock, () => reject(new Error('failed to unsubscribe')))
                .emit(event.directoryBlock, { adminBlockRef });

            setTimeout(resolve, 600);
        });
        hasAdminBlockListener = event.listeners(event.directoryBlock).includes(event._fetchAdminBlock);
        assert.isFalse(hasAdminBlockListener);
        assert.isFalse(event.isSubscribedToAdminBlocks);
    });

    /**
     * Test Entry Credit Block Subscriptions
     */

    it('should subscribe to entry credit blocks', async () => {
        const event = new FactomEvent(cli);

        try {
            const entryCreditBlock = await new Promise(resolve => {
                event
                    .subscribeToEntryCreditBlocks()
                    .on(event.entryCreditBlock, resolve)
                    .startPolling();
            });
            assert.isTrue(event.isSubscribeToEntryCreditBlocks);
            assert.instanceOf(entryCreditBlock, EntryCreditBlock);
        } finally {
            event.stopPolling(true);
        }
    });

    it('should unsubscribe from entry credit blocks', async () => {
        const event = new FactomEvent(cli);
        const entryCreditBlockRef = '5c712be0b649b4360d764afc183aee6963bd09dcb558c7b4991f8fdf4dee3687';

        await new Promise(resolve => {
            event
                .subscribeToEntryCreditBlocks()
                .on(event.entryCreditBlock, resolve)
                .emit(event.directoryBlock, { entryCreditBlockRef });
        });
        let hasEntryCreditBlockListener = event.listeners(event.directoryBlock).includes(event._fetchEntryCreditBlock);
        assert.isTrue(hasEntryCreditBlockListener);
        assert.isTrue(event.isSubscribeToEntryCreditBlocks);

        await new Promise((resolve, reject) => {
            event
                .unsubscribeFromEntryCreditBlocks()
                .on(event.entryCreditBlock, () => reject(new Error('failed to unsubscribe')))
                .emit(event.directoryBlock, { entryCreditBlockRef });

            setTimeout(resolve, 600);
        });

        hasEntryCreditBlockListener = event.listeners(event.directoryBlock).includes(event._fetchEntryCreditBlock);
        assert.isFalse(hasEntryCreditBlockListener);
        assert.isFalse(event.isSubscribeToEntryCreditBlocks);
    });

    /**
     * Test Entry Chain Subscriptions
     */

    const chainIds = [
        '23411b35d7666bdc41cf1446bf2156e20584f5c748dbabf5ca8f0fd9bd00efb1',
        '0ec9d1cfbb458e28229b40139b5bee7d88c81215fb4dfdac48a9cf27f70f0790',
        '880eda4ecd5beb0b31f3fc0130f13b7f918d2d52f14e5ab1bc9588cecc42392d',
        '60ffb72effed9311fd3bb63407b99171bbc343d5b6ac53fa3300a0453f8693e0',
        '6bea4bccc44bd4f3e3801f67caa20770c33c63794f8e57fe5c2141f8270d46ec'
    ];

    it('should subscribe to entry chains', async () => {
        const event = new FactomEvent(cli);

        const entryBlocks = await new Promise(resolve => {
            const entryBlocks = [];
            event
                .on(event.entryChain, entryBlock => entryBlocks.push(entryBlock))
                .subscribeToEntryChains(chainIds)
                .emit(event.directoryBlock, mockDirectoryBlock);
            setTimeout(() => resolve(entryBlocks), 600);
        });

        const hasEntryChainListener = event.listeners(event.directoryBlock).includes(event._fetchentryChain);
        assert.isTrue(hasEntryChainListener);
        assert.lengthOf(entryBlocks, 3);
        entryBlocks.forEach(entryBlock => {
            assert.instanceOf(entryBlock, EntryBlock);
            assert.strictEqual(entryBlock.directoryBlockHeight, 69704);
        });
        assert.strictEqual(event.entryChainSubscriptions.size, 5);
    });

    it('should unsubscribe from an entry chain', async () => {
        const event = new FactomEvent(cli);
        const chainIdToUnsubscribeFrom = '60ffb72effed9311fd3bb63407b99171bbc343d5b6ac53fa3300a0453f8693e0';

        let entryBlocks = await new Promise(resolve => {
            const entryBlocks = [];
            event
                .on(event.entryChain, entryBlock => entryBlocks.push(entryBlock))
                .subscribeToEntryChains(chainIds)
                .emit(event.directoryBlock, mockDirectoryBlock);
            setTimeout(() => resolve(entryBlocks), 600);
        });
        assert.lengthOf(entryBlocks, 3);
        assert.strictEqual(event.entryChainSubscriptions.size, 5);

        entryBlocks = await new Promise(resolve => {
            const entryBlocks = [];
            event
                .on(event.entryChain, entryBlock => entryBlocks.push(entryBlock))
                .unsubscribeFromEntryChains(chainIdToUnsubscribeFrom)
                .emit(event.directoryBlock, mockDirectoryBlock);

            setTimeout(() => resolve(entryBlocks), 600);
        });

        const hasEntryChainListener = event.listeners(event.directoryBlock).includes(event._fetchentryChain);
        assert.isTrue(hasEntryChainListener);
        assert.lengthOf(entryBlocks, 2);
        entryBlocks.forEach(entryBlock => {
            assert.instanceOf(entryBlock, EntryBlock);
            assert.strictEqual(entryBlock.directoryBlockHeight, 69704);
            assert.notStrictEqual(entryBlock.keyMR, chainIdToUnsubscribeFrom);
        });
        assert.strictEqual(event.entryChainSubscriptions.size, 4);
    });

    it('should unsubscribe from all entry chains', async () => {
        const event = new FactomEvent(cli);

        let entryBlocks = await new Promise(resolve => {
            const entryBlocks = [];
            event
                .on(event.entryChain, entryBlock => entryBlocks.push(entryBlock))
                .subscribeToEntryChains(chainIds)
                .emit(event.directoryBlock, mockDirectoryBlock);
            setTimeout(() => resolve(entryBlocks), 600);
        });
        assert.lengthOf(entryBlocks, 3);
        assert.strictEqual(event.entryChainSubscriptions.size, 5);

        entryBlocks = await new Promise(resolve => {
            const entryBlocks = [];
            event
                .on(event.entryChain, entryBlock => entryBlocks.push(entryBlock))
                .unsubscribeFromAllEntryChains()
                .emit(event.directoryBlock, mockDirectoryBlock);

            setTimeout(() => resolve(entryBlocks), 600);
        });
        const hasEntryChainListener = event.listeners(event.directoryBlock).includes(event._fetchentryChain);
        assert.isFalse(hasEntryChainListener);
        assert.lengthOf(entryBlocks, 0);
        assert.strictEqual(event.entryChainSubscriptions.size, 0);
    });

    it('should throw an error if chainId is not a string', () => {
        const event = new FactomEvent(cli);
        assert.throws(event.subscribeToEntryChains, 'must be a string');
    });

    it('should throw an error if chainId is not a sha256', () => {
        const event = new FactomEvent(cli);
        assert.throws(() => event.subscribeToEntryChains('string'), 'must be a chainId');
    });

    it('should throw an error if already subscribed to chainId', () => {
        const event = new FactomEvent(cli);
        const chainId = '60ffb72effed9311fd3bb63407b99171bbc343d5b6ac53fa3300a0453f8693e0';
        event.subscribeToEntryChains(chainId);
        assert.throws(() => event.subscribeToEntryChains(chainId), 'already subscribed to');
    });

    /**
     * Test Factoid Address Subscriptions
     */

    const factoidBlockRef = 'cad832bab1d83c74bff8e1092fcf70e298cd7cdf35dee1956ae8879e749195ac';
    const factoidAddresses = [
        'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC', // a. sent to b and received from FA3QZ56sTSEv4oamkhLxFrtMXdu7vuynJBdxt5z5HKWf5JKgjWhV
        'FA3PZ6PyUs5Nc7ybj938EHR8d3tpGCKBKz7gw7b99Z4y5xxFCfCC', // b. received from a
        'FA2m1B2BdNY8dEgFA5JQJ5gWn18gqM1fDpWMJU8MA7bzBEd5Yh3U' // c. sent to FA2pySS8Dv5TFLxUGkhCB4bWuHbipZGKoCY2ZFd3dJ5yXhTntvqF
    ];

    it('should subscribe to factoid addresses with inputs and outputs', async () => {
        const event = new FactomEvent(cli);
        const transactions = await new Promise(resolve => {
            event
                .on(event.factoidTransaction, resolve)
                .subscribeToFactoidAddresses(factoidAddresses)
                .emit(event.directoryBlock, { factoidBlockRef });
        });
        assert.lengthOf(transactions, 3);
        assert.strictEqual(transactions[0].id, 'c538ffb37d5dab837f3ea781b01bae481d8d6e77ceb0471442c1d85576a00e01');
        assert.strictEqual(transactions[1].id, 'd788cd1a7329f4e747098e2ddf3694af0ae0f2cd1a88cd1725c1542789a7d269');
        assert.strictEqual(transactions[2].id, '8d5d3479eee4e651ff80144fbd7dfa45ac9e4b2b8e012204e3ca4eb142aef61e');
    });

    it('should subscribe to factoid addresses outputs only', async () => {
        const event = new FactomEvent(cli);
        const transactions = await new Promise(resolve => {
            event
                .on(event.factoidTransaction, resolve)
                .subscribeToFactoidAddresses(factoidAddresses, { onSend: true })
                .emit(event.directoryBlock, { factoidBlockRef });
        });
        assert.lengthOf(transactions, 2);
        assert.strictEqual(transactions[0].id, 'c538ffb37d5dab837f3ea781b01bae481d8d6e77ceb0471442c1d85576a00e01');
        assert.strictEqual(transactions[1].id, '8d5d3479eee4e651ff80144fbd7dfa45ac9e4b2b8e012204e3ca4eb142aef61e');
    });

    it('should subscribe to factoid addresses inputs only', async () => {
        const event = new FactomEvent(cli);
        const transactions = await new Promise(resolve => {
            event
                .on(event.factoidTransaction, resolve)
                .subscribeToFactoidAddresses(factoidAddresses, { onReceive: true })
                .emit(event.directoryBlock, { factoidBlockRef });
        });
        assert.lengthOf(transactions, 2);
        assert.strictEqual(transactions[0].id, 'c538ffb37d5dab837f3ea781b01bae481d8d6e77ceb0471442c1d85576a00e01');
        assert.strictEqual(transactions[1].id, 'd788cd1a7329f4e747098e2ddf3694af0ae0f2cd1a88cd1725c1542789a7d269');
    });

    it('should unsubscribe from a factoid address', async () => {
        const event = new FactomEvent(cli);
        let transactions = await new Promise(resolve => {
            event
                .on(event.factoidTransaction, resolve)
                .subscribeToFactoidAddresses(factoidAddresses)
                .emit(event.directoryBlock, { factoidBlockRef });
        });
        assert.lengthOf(transactions, 3);
        assert.lengthOf(Object.keys(event._factoidAddressSubscriptions), 3);

        transactions = await new Promise(resolve => {
            event
                .on(event.factoidTransaction, resolve)
                .unsubscribeFromFactoidAddresses([factoidAddresses[0]])
                .emit(event.directoryBlock, { factoidBlockRef });
        });
        const hasFactoidBlockListener = event.listeners(event.directoryBlock).includes(event._fetchFactoidBlock);
        assert.isTrue(hasFactoidBlockListener);
        assert.lengthOf(transactions, 2);
        assert.lengthOf(Object.keys(event._factoidAddressSubscriptions), 2);
    });

    it('should unsubscribe from all factoid addresses', async () => {
        const event = new FactomEvent(cli);
        let transactions = await new Promise(resolve => {
            event
                .on(event.factoidTransaction, resolve)
                .subscribeToFactoidAddresses(factoidAddresses)
                .emit(event.directoryBlock, { factoidBlockRef });
        });
        assert.lengthOf(transactions, 3);
        assert.lengthOf(Object.keys(event._factoidAddressSubscriptions), 3);

        transactions = await new Promise((resolve, reject) => {
            event
                .on(event.factoidTransaction, reject)
                .unsubscribeFromAllFactoidAddresses()
                .emit(event.directoryBlock, { factoidBlockRef });
            setTimeout(() => resolve([]), 500);
        });
        const hasFactoidBlockListener = event.listeners(event.directoryBlock).includes(event._fetchFactoidBlock);
        assert.isFalse(hasFactoidBlockListener);
        assert.lengthOf(transactions, 0);
        assert.lengthOf(Object.keys(event._factoidAddressSubscriptions), 0);
    });

    it('should subscribe to factoid addresses and blocks, then unsubscribe from blocks whilst keeping the factoid block listener', () => {
        const event = new FactomEvent(cli);
        event
            .subscribeToFactoidBlocks()
            .subscribeToFactoidAddresses(factoidAddresses)
            .unsubscribeFromFactoidBlocks();
        const hasFactoidBlockListener = event.listeners(event.directoryBlock).includes(event._fetchFactoidBlock);
        assert.isTrue(hasFactoidBlockListener);
        assert.isFalse(event.isSubscribedToFactoidBlocks);
        assert.lengthOf(Object.keys(event.factoidAddressSubscriptions), 3);
    });

    it('should subscribe to factoid addresses and blocks, then unsubscribe from addresses whilst keeping the factoid block listener', () => {
        const event = new FactomEvent(cli);
        event
            .subscribeToFactoidAddresses(factoidAddresses)
            .subscribeToFactoidBlocks()
            .unsubscribeFromAllFactoidAddresses();
        const hasFactoidBlockListener = event.listeners(event.directoryBlock).includes(event._fetchFactoidBlock);
        assert.isTrue(hasFactoidBlockListener);
        assert.isTrue(event.isSubscribedToFactoidBlocks);
    });

    it('should throw an error if passing bad options argument to subscribeToFactoidAddresses', () => {
        const event = new FactomEvent(cli);
        assert.throws(() => event.subscribeToFactoidAddresses(factoidAddresses, {}), 'onReceive or onSend must be true');
    });

    it('should throw an error if passing an invalid factoid address to subscribeToFactoidAddresses', () => {
        const event = new FactomEvent(cli);
        assert.throws(() => event.subscribeToFactoidAddresses('invalid address'), 'is not a valid public FCT address');
    });

    it('should throw an error if attempting to unsubscribe from unknown address', () => {
        const event = new FactomEvent(cli);
        assert.throws(() => event.unsubscribeFromFactoidAddresses(factoidAddresses[0]), 'not currently subscribed to');
    });

    it('should throw an error if attempting to unsubscribe from all addresses with no active subscription', () => {
        const event = new FactomEvent(cli);
        assert.throws(() => event.unsubscribeFromAllFactoidAddresses(factoidAddresses[0]), 'not currently subscribed to any factoid addreses');
    });
});


