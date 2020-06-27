const { FactomCli, FactomEventEmitter, FACTOM_EVENT } = require('../src/factom'),
    { FactoidBlock, AdminBlock, EntryCreditBlock, EntryBlock } = require('../src/blocks'),
    mockDirectoryBlock = require('./data/directory-block.json'),
    assert = require('chai').assert,
    sinon = require('sinon');

const INTERVAL = 50;

const mockTransactionId = '337a32712f14c5df0b57a64bd6c321a043081688ecd4f33fd8319470da2256b1';
const getMockPendingTransaction = (txid = mockTransactionId) => [
    {
        transactionid: txid,
        status: 'TransactionACK',
        inputs: [
            {
                amount: 100012000,
                address: '646f3e8750c550e4582eca5047546ffef89c13a175985e320232bacac81cc428',
                useraddress: 'FA2jK2HcLnRdS94dEcU27rF3meoJfpUcZPSinpb7AwQvPRY6RL1Q'
            }
        ],
        outputs: [
            {
                amount: 100000000,
                address: '27c0a471c6c9b6da3fce0af7b1119ac2cbc68723657a9e2860d83c6776bbd6ff',
                useraddress: 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC'
            }
        ],
        ecoutputs: [],
        fees: 12000
    }
];

describe('Test FactomEventEmitter', () => {
    const cli = new FactomCli({
        factomd: {
            protocol: process.env.FACTOMD_PROTOCOL,
            rejectUnauthorized: false,
            path: process.env.FACTOMD_PATH,
            user: process.env.FACTOMD_USER,
            password: process.env.FACTOMD_PASSWORD,
            host: process.env.FACTOMD_HOST,
            port: process.env.FACTOMD_PORT
        }
    });

    // Create mocks for methods used to start polling and trigger new block height.
    sinon.stub(cli, 'getDirectoryBlockHead').resolves(mockDirectoryBlock);
    sinon.stub(cli, 'getHeights').resolves({ directoryBlockHeight: mockDirectoryBlock.height - 1 });

    it('should add then remove a directory block listener', done => {
        // Set short interval so the test does not timeout.
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });

        const listener = dBlock => {
            assert.isString(dBlock.keyMR);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newDirectoryBlock'), 1);

            emitter.removeListener(FACTOM_EVENT.newDirectoryBlock, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newDirectoryBlock'), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(FACTOM_EVENT.newDirectoryBlock, listener);
    });

    it('should add then remove a factoid block listener', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });

        const listener = fBlock => {
            assert.instanceOf(fBlock, FactoidBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newFactoidBlock'), 1);

            emitter.removeListener('newFactoidBlock', listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newFactoidBlock'), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(FACTOM_EVENT.newFactoidBlock, listener);
    });

    it('should add then remove an admin block listener', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });

        const listener = aBlock => {
            assert.instanceOf(aBlock, AdminBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newAdminBlock'), 1);

            emitter.removeListener('newAdminBlock', listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newAdminBlock'), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(FACTOM_EVENT.newAdminBlock, listener);
    });

    it('should add then remove an entry credit block listener', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });

        const listener = ecBlock => {
            assert.instanceOf(ecBlock, EntryCreditBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newEntryCreditBlock'), 1);

            emitter.removeListener('newEntryCreditBlock', listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newEntryCreditBlock'), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(FACTOM_EVENT.newEntryCreditBlock, listener);
    });

    it('should add then remove entry chain listener', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });
        const chain = '3392f9df84cae30d97962641600546d7aafd3a29667d1dd356280a54c9070bcb';

        const listener = eBlock => {
            assert.instanceOf(eBlock, EntryBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners(chain), 1);

            emitter.removeListener(chain, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners(chain), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(chain, listener);
    });

    it('should add then remove factoid address listener', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });
        const address = 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC';
        const factoidBlockRef = 'cad832bab1d83c74bff8e1092fcf70e298cd7cdf35dee1956ae8879e749195ac';
        // Stub resolves directory block with specific factoidBlockRef
        cli.getDirectoryBlockHead.resolves({ ...mockDirectoryBlock, factoidBlockRef });

        const listener = tx => {
            assert.strictEqual(
                tx.id,
                'c538ffb37d5dab837f3ea781b01bae481d8d6e77ceb0471442c1d85576a00e01'
            );
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners(address), 1);

            emitter.removeListener(address, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners(address), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(address, listener);
    });

    it('should add then remove factoid pending transaction listener', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });
        const pendingTransaction = {
            eventType: 'newPendingTransaction',
            topic: 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC'
        };
        const tokenizedPendingTransaction = FactomEventEmitter.getSubscriptionToken(
            pendingTransaction
        );
        const mockPendingTransaction = getMockPendingTransaction();

        const listener = tx => {
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners(tokenizedPendingTransaction), 1);
            assert.strictEqual(tx.transactionid, mockPendingTransaction[0].transactionid);

            emitter.removeListener(tokenizedPendingTransaction, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners(tokenizedPendingTransaction), 0);
            cli.factomdApi.restore();
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(tokenizedPendingTransaction, listener);
        sinon.stub(cli, 'factomdApi').resolves(mockPendingTransaction);
    });

    it('should add then remove new chain listener', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });
        const newChain = {
            chainId: '626ae1be1e36c6fd589e50c55638c7a18b551dfc6b63da30842722d448fc6db2',
            keyMR: 'a4883d0e53ce79d70401a839b087c91f1611bd332e3d988a412230fddd27c22d'
        };
        mockDirectoryBlock.entryBlockRefs.push(newChain);

        const listener = eBlock => {
            assert.instanceOf(eBlock, EntryBlock);
            assert.strictEqual(eBlock.sequenceNumber, 0);
            assert.isTrue(emitter.isPolling);
            assert.strictEqual(eBlock.keyMR, newChain.keyMR);
            assert.lengthOf(emitter.listeners('newChain'), 1);

            emitter.removeListener('newChain', listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newChain'), 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(FACTOM_EVENT.newChain, listener);
    });

    it('should stop polling after emitting once', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });

        const listener = dBlock => {
            assert.isString(dBlock.keyMR);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newDirectoryBlock'), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.once(FACTOM_EVENT.newDirectoryBlock, listener);
    });

    it('should not stop polling if there are listeners of a different type still active', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });

        const nullListener = () => {};

        const listener = aBlock => {
            // assert that adding multiple listeners results in healthy state
            assert.instanceOf(aBlock, AdminBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newEntryCreditBlock'), 1);
            assert.lengthOf(emitter.listeners('newAdminBlock'), 1);

            // assert that the removal of a listener does not stop polling if newDirectoryBlock still has dependent listeners
            emitter.removeListener('newAdminBlock', listener);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newEntryCreditBlock'), 1);
            assert.lengthOf(emitter.listeners('newAdminBlock'), 0);

            // assert that the removal of the final dependent listeners stops polling and removes all listeners
            emitter.removeListener('newEntryCreditBlock', nullListener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newEntryCreditBlock'), 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(FACTOM_EVENT.newEntryCreditBlock, nullListener);
        emitter.on(FACTOM_EVENT.newAdminBlock, listener);
    });

    it('should not stop polling if there are listeners of the same type still active', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });

        const nullListener = () => {};

        const listener = fBlock => {
            // assert that adding multiple listeners results in healthy state
            assert.instanceOf(fBlock, FactoidBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newFactoidBlock'), 2);

            // assert that the removal of a listener does not stop polling if newDirectoryBlock still has dependent listeners
            emitter.removeListener('newFactoidBlock', listener);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newFactoidBlock'), 1);

            // assert that the removal of the final dependent listeners stops polling and removes all listeners
            emitter.removeListener('newFactoidBlock', nullListener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newFactoidBlock'), 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(FACTOM_EVENT.newFactoidBlock, nullListener);
        emitter.on(FACTOM_EVENT.newFactoidBlock, listener);
    });

    it('should add two chain ID listeners for the same chain ID then remove one without affecting the other', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });
        const chainId = '4060c0192a421ca121ffff935889ef55a64574a6ef0e69b2b4f8a0ab919b2ca4';

        const nullListener = () => {};

        const listener = eBlock => {
            assert.instanceOf(eBlock, EntryBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners(chainId), 2);
            assert.lengthOf(emitter.chainSubscriptions, 1);

            emitter.removeListener(chainId, nullListener);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners(chainId), 1);
            assert.lengthOf(emitter.chainSubscriptions, 1);

            emitter.removeListener(chainId, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners(chainId), 0);
            assert.lengthOf(emitter.chainSubscriptions, 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(chainId, nullListener);
        emitter.on(chainId, listener);
    });

    it('should add two factoid address listeners for the same address then remove one without affecting the other', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });
        const address = 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC';
        const factoidBlockRef = 'cad832bab1d83c74bff8e1092fcf70e298cd7cdf35dee1956ae8879e749195ac';
        cli.getDirectoryBlockHead.resolves({ ...mockDirectoryBlock, factoidBlockRef });

        const nullListener = () => {};

        const listener = tx => {
            assert.strictEqual(
                tx.id,
                'c538ffb37d5dab837f3ea781b01bae481d8d6e77ceb0471442c1d85576a00e01'
            );
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners(address), 2);
            assert.lengthOf(emitter.factoidAddressSubscriptions, 1);

            emitter.removeListener(address, nullListener);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners(address), 1);
            assert.lengthOf(emitter.factoidAddressSubscriptions, 1);

            emitter.removeListener(address, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners(address), 0);
            assert.lengthOf(emitter.factoidAddressSubscriptions, 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(address, nullListener);
        emitter.on(address, listener);
    });

    it('should add two listeners for the same pending transaction subscription then remove one without affecting the other', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });
        const pendingTransaction = {
            eventType: 'newPendingTransaction',
            topic: 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC'
        };
        const tokenizedPendingTransaction = FactomEventEmitter.getSubscriptionToken(
            pendingTransaction
        );
        const mockPendingTransaction = getMockPendingTransaction();

        const nullListener = () => {};

        const listener = tx => {
            assert.strictEqual(tx.transactionid, mockPendingTransaction[0].transactionid);

            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners(tokenizedPendingTransaction), 2);
            assert.lengthOf(emitter.factoidAddressPendingTransactionSubscriptions, 1);

            emitter.removeListener(tokenizedPendingTransaction, nullListener);
            assert.lengthOf(emitter.listeners(tokenizedPendingTransaction), 1);
            assert.lengthOf(emitter.factoidAddressPendingTransactionSubscriptions, 1);
            assert.isTrue(emitter.isPolling);

            emitter.removeListener(tokenizedPendingTransaction, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners(tokenizedPendingTransaction), 0);
            assert.lengthOf(emitter.factoidAddressPendingTransactionSubscriptions, 0);

            cli.factomdApi.restore();
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(tokenizedPendingTransaction, nullListener);
        emitter.on(tokenizedPendingTransaction, listener);
        sinon.stub(cli, 'factomdApi').resolves(mockPendingTransaction);
    });

    it('should add two pending transaction listeners and should not emit existing pending transactions', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });
        const pendingTransaction = {
            eventType: 'newPendingTransaction',
            topic: 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC'
        };
        const tokenizedPendingTransaction = FactomEventEmitter.getSubscriptionToken(
            pendingTransaction
        );
        const mockPendingTransaction = getMockPendingTransaction();
        let counter = 1;

        const pre_listener = tx => {
            assert.strictEqual(
                tx.transactionid,
                mockPendingTransaction[0].transactionid,
                'Emits expected transaction'
            );
            assert.strictEqual(counter, 1, 'Emitter not triggered twice');

            // setup second listener after pending transaction has occurred
            emitter.on(tokenizedPendingTransaction, post_listener);

            counter++;
        };

        const post_listener = () => {
            assert.fail('Fail: The pending transaction is not a new pending transaction.');
        };

        emitter.on('error', err => done(err));
        emitter.on(tokenizedPendingTransaction, pre_listener);
        sinon.stub(cli, 'factomdApi').resolves(mockPendingTransaction);

        // timeout to allow emitter to poll at least twice
        setTimeout(() => {
            emitter.removeListener(tokenizedPendingTransaction, pre_listener);
            emitter.removeListener(tokenizedPendingTransaction, post_listener);
            cli.factomdApi.restore();
            done();
        }, INTERVAL * 4);
    });

    it('should add a pending transaction listener and emit on new pending transactions', done => {
        const emitter = new FactomEventEmitter(cli, { interval: INTERVAL });
        const pendingTransaction = {
            eventType: 'newPendingTransaction',
            topic: 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC'
        };
        const tokenizedPendingTransaction = FactomEventEmitter.getSubscriptionToken(
            pendingTransaction
        );

        const firstTransaction = getMockPendingTransaction();
        const secondTransaction = getMockPendingTransaction('abc123');
        const allTransactions = [...firstTransaction, ...secondTransaction];

        const expectedTransactionIds = [
            firstTransaction[0].transactionid,
            secondTransaction[0].transactionid
        ];
        let actualTransactionIds = [];

        const listener = tx => {
            assert(
                expectedTransactionIds.includes(tx.transactionid),
                'Emits expected pending transaction'
            );
            assert(
                !actualTransactionIds.includes(tx.transactionid),
                'Pending transaction should not emit twice'
            );
            actualTransactionIds.push(tx.transactionid);
            cli.factomdApi.restore();
            sinon.stub(cli, 'factomdApi').resolves(allTransactions);
        };

        emitter.on('error', err => done(err));
        emitter.on(tokenizedPendingTransaction, listener);
        sinon.stub(cli, 'factomdApi').resolves(firstTransaction);
        // timeout to allow emitter to poll at least twice
        setTimeout(() => {
            assert.sameDeepOrderedMembers(actualTransactionIds, expectedTransactionIds);
            emitter.removeListener(tokenizedPendingTransaction, listener);
            done();
        }, INTERVAL * 10);
    });
});
