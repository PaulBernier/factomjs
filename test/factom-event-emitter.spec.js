const { FactomCli, FactomEventEmitter, FACTOM_EVENT } = require('../src/factom'),
    { FactoidBlock, AdminBlock, EntryCreditBlock, EntryBlock } = require('../src/blocks'),
    mockDirectoryBlock = require('./data/directory-block.json'),
    assert = require('chai').assert,
    sinon = require('sinon');

const INTERVAL = 50;

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
});
