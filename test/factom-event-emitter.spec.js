const { FactomCli, FactomEventEmitter, FACTOM_EVENT } = require('../src/factom'),
    { DirectoryBlock, FactoidBlock, AdminBlock, EntryCreditBlock, EntryBlock } = require('../src/blocks'),
    mockDirectoryBlock = require('./data/directory-block.json'),
    assert = require('chai').assert;

describe('Test FactomEventEmitter', () => {
    const cli = new FactomCli({
        factomd: {
            host: process.env.FACTOMD_HOST,
            port: process.env.FACTOMD_PORT
        }
    });

    it('should add then remove a directory block listener', done => {
        const emitter = new FactomEventEmitter(cli);

        const listener = dBlock => {
            assert.instanceOf(dBlock, DirectoryBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);

            emitter.removeListener(FACTOM_EVENT.directoryBlock, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(FACTOM_EVENT.directoryBlock, listener);
    });

    it('should add then remove a factoid block listener', done => {
        const emitter = new FactomEventEmitter(cli);

        const listener = fBlock => {
            assert.instanceOf(fBlock, FactoidBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('factoidBlock'), 1);

            emitter.removeListener('factoidBlock', listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('factoidBlock'), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(FACTOM_EVENT.factoidBlock, listener);
    });

    it('should add then remove an admin block listener', done => {
        const emitter = new FactomEventEmitter(cli);

        const listener = aBlock => {
            assert.instanceOf(aBlock, AdminBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('adminBlock'), 1);

            emitter.removeListener('adminBlock', listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('adminBlock'), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(FACTOM_EVENT.adminBlock, listener);
    });

    it('should add then remove an entry credit block listener', done => {
        const emitter = new FactomEventEmitter(cli);

        const listener = ecBlock => {
            assert.instanceOf(ecBlock, EntryCreditBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('entryCreditBlock'), 1);

            emitter.removeListener('entryCreditBlock', listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('entryCreditBlock'), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(FACTOM_EVENT.entryCreditBlock, listener);
    });

    it('should add then remove entry chain listener', done => {
        const emitter = new FactomEventEmitter(cli);
        const entryChain = '3392f9df84cae30d97962641600546d7aafd3a29667d1dd356280a54c9070bcb';

        const listener = eBlock => {
            assert.instanceOf(eBlock, EntryBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners(entryChain), 1);

            emitter.removeListener(entryChain, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners(entryChain), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(entryChain, listener);
        emitter._handleDirectoryBlock(mockDirectoryBlock);
    });

    it('should add then remove factoid address listener', done => {
        const emitter = new FactomEventEmitter(cli);
        const address = 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC';
        const factoidBlockRef = 'cad832bab1d83c74bff8e1092fcf70e298cd7cdf35dee1956ae8879e749195ac';

        const listener = tx => {
            assert.strictEqual(tx.id, 'c538ffb37d5dab837f3ea781b01bae481d8d6e77ceb0471442c1d85576a00e01');
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners(address), 1);

            emitter.removeListener(address, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners(address), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(address, listener);
        emitter._handleDirectoryBlock({ factoidBlockRef, entryBlockRefs: [] });
    });

    it('should add then remove new chain listener', done => {
        const emitter = new FactomEventEmitter(cli);
        const newChain = {
            chainId: '626ae1be1e36c6fd589e50c55638c7a18b551dfc6b63da30842722d448fc6db2',
            keyMR: 'a4883d0e53ce79d70401a839b087c91f1611bd332e3d988a412230fddd27c22d'
        };
        mockDirectoryBlock.entryBlockRefs.push(newChain);

        const listener = eBlock => {
            assert.instanceOf(eBlock, EntryBlock);
            assert.isTrue(emitter.isPolling);
            assert.strictEqual(eBlock.keyMR, newChain.keyMR);
            assert.lengthOf(emitter.listeners('newEntryChain'), 1);

            emitter.removeListener('newEntryChain', listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('newEntryChain'), 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(FACTOM_EVENT.newEntryChain, listener);
        emitter._handleDirectoryBlock(mockDirectoryBlock);
    });

    it('should stop polling after emitting once', done => {
        const emitter = new FactomEventEmitter(cli);

        const listener = dBlock => {
            assert.instanceOf(dBlock, DirectoryBlock);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.once(FACTOM_EVENT.directoryBlock, listener);
    });

    it('should not stop polling if there are listeners of a different type still active', done => {
        const emitter = new FactomEventEmitter(cli);

        const nullListener = () => {};

        const listener = aBlock => {
            // assert that adding multiple listeners results in healthy state
            assert.instanceOf(aBlock, AdminBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('entryCreditBlock'), 1);
            assert.lengthOf(emitter.listeners('adminBlock'), 1);

            // assert that the removal of a listener does not stop polling if directoryBlock still has dependent listeners
            emitter.removeListener('adminBlock', listener);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('entryCreditBlock'), 1);
            assert.lengthOf(emitter.listeners('adminBlock'), 0);

            // assert that the removal of the final dependent listeners stops polling and removes all listeners
            emitter.removeListener('entryCreditBlock', nullListener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('entryCreditBlock'), 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(FACTOM_EVENT.entryCreditBlock, nullListener);
        emitter.on(FACTOM_EVENT.adminBlock, listener);
    });

    it('should not stop polling if there are listeners of the same type still active', done => {
        const emitter = new FactomEventEmitter(cli);

        const nullListener = () => {};

        const listener = fBlock => {
            // assert that adding multiple listeners results in healthy state
            assert.instanceOf(fBlock, FactoidBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('factoidBlock'), 2);

            // assert that the removal of a listener does not stop polling if directoryBlock still has dependent listeners
            emitter.removeListener('factoidBlock', listener);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('factoidBlock'), 1);

            // assert that the removal of the final dependent listeners stops polling and removes all listeners
            emitter.removeListener('factoidBlock', nullListener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('factoidBlock'), 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(FACTOM_EVENT.factoidBlock, nullListener);
        emitter.on(FACTOM_EVENT.factoidBlock, listener);
    });

    it('should add two chain ID listeners for the same chain ID then remove one without affecting the other', done => {
        const emitter = new FactomEventEmitter(cli);
        const chainId = '4060c0192a421ca121ffff935889ef55a64574a6ef0e69b2b4f8a0ab919b2ca4';

        const nullListener = () => {};

        const listener = eBlock => {
            assert.instanceOf(eBlock, EntryBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners(chainId), 2);
            assert.lengthOf(emitter.entryChainSubscriptions, 1);

            emitter.removeListener(chainId, nullListener);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners(chainId), 1);
            assert.lengthOf(emitter.entryChainSubscriptions, 1);

            emitter.removeListener(chainId, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners(chainId), 0);
            assert.lengthOf(emitter.entryChainSubscriptions, 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(chainId, nullListener);
        emitter.on(chainId, listener);
        emitter._handleDirectoryBlock(mockDirectoryBlock);
    });

    it('should add two factoid address listeners for the same address then remove one without affecting the other', done => {
        const emitter = new FactomEventEmitter(cli);
        const address = 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC';
        const factoidBlockRef = 'cad832bab1d83c74bff8e1092fcf70e298cd7cdf35dee1956ae8879e749195ac';

        const nullListener = () => {};

        const listener = tx => {
            assert.strictEqual(tx.id, 'c538ffb37d5dab837f3ea781b01bae481d8d6e77ceb0471442c1d85576a00e01');
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
        emitter._handleDirectoryBlock({ factoidBlockRef, entryBlockRefs: [] });
    });
});
