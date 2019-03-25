const { FactomCli, FactomEventEmitter } = require('../src/factom'),
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

            emitter.removeListener(emitter.event.directoryBlock, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(emitter.event.directoryBlock, listener);
    });

    it('should add then remove a factoid block listener', done => {
        const emitter = new FactomEventEmitter(cli);

        const listener = fBlock => {
            assert.instanceOf(fBlock, FactoidBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners('factoidBlock'), 1);

            emitter.removeListener('factoidBlock', listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            assert.lengthOf(emitter.listeners('factoidBlock'), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(emitter.event.factoidBlock, listener);
    });

    it('should add then remove an admin block listener', done => {
        const emitter = new FactomEventEmitter(cli);

        const listener = aBlock => {
            assert.instanceOf(aBlock, AdminBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners('adminBlock'), 1);

            emitter.removeListener('adminBlock', listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            assert.lengthOf(emitter.listeners('adminBlock'), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(emitter.event.adminBlock, listener);
    });

    it('should add then remove an entry credit block listener', done => {
        const emitter = new FactomEventEmitter(cli);

        const listener = ecBlock => {
            assert.instanceOf(ecBlock, EntryCreditBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners('entryCreditBlock'), 1);

            emitter.removeListener('entryCreditBlock', listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            assert.lengthOf(emitter.listeners('entryCreditBlock'), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(emitter.event.entryCreditBlock, listener);
    });

    it('should add then remove entry chain listener', done => {
        const emitter = new FactomEventEmitter(cli);
        const entryChain = '3392f9df84cae30d97962641600546d7aafd3a29667d1dd356280a54c9070bcb';

        const listener = eBlock => {
            assert.instanceOf(eBlock, EntryBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners(entryChain), 1);

            emitter.removeListener(entryChain, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            assert.lengthOf(emitter.listeners(entryChain), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(entryChain, listener);
        emitter.emit(emitter.event.directoryBlock, mockDirectoryBlock);
    });

    it('should add then remove factoid address listener', done => {
        const emitter = new FactomEventEmitter(cli);
        const address = 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC';
        const factoidBlockRef = 'cad832bab1d83c74bff8e1092fcf70e298cd7cdf35dee1956ae8879e749195ac';

        const listener = tx => {
            assert.strictEqual(tx.id, 'c538ffb37d5dab837f3ea781b01bae481d8d6e77ceb0471442c1d85576a00e01');
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners('factoidBlock'), 1);
            assert.lengthOf(emitter.listeners(address), 1);

            emitter.removeListener(address, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            assert.lengthOf(emitter.listeners('factoidBlock'), 0);
            assert.lengthOf(emitter.listeners(address), 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(address, listener);
        emitter.emit(emitter.event.directoryBlock, { factoidBlockRef });
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
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners('newEntryChain'), 1);

            emitter.removeListener('newEntryChain', listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            assert.lengthOf(emitter.listeners('newEntryChain'), 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(emitter.event.newEntryChain, listener);
        emitter.emit(emitter.event.directoryBlock, mockDirectoryBlock);
    });

    it('should stop polling after emitting once', done => {
        const emitter = new FactomEventEmitter(cli);
        const address = 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC';
        const factoidBlockRef = 'cad832bab1d83c74bff8e1092fcf70e298cd7cdf35dee1956ae8879e749195ac';

        const listener = tx => {
            assert.strictEqual(tx.id, 'c538ffb37d5dab837f3ea781b01bae481d8d6e77ceb0471442c1d85576a00e01');
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            assert.lengthOf(emitter.listeners('factoidBlock'), 0);
            assert.lengthOf(emitter.listeners(address), 0);
            assert.lengthOf(emitter.factoidAddressSubscriptions, 0);
            done();
        };

        emitter.on('error', err => done(err));
        emitter.once(address, listener);
        emitter.emit(emitter.event.directoryBlock, { factoidBlockRef });
    });

    it('should not stop polling if there are listeners of a different type still active', done => {
        const emitter = new FactomEventEmitter(cli);

        const nullListener = () => {};

        const listener = aBlock => {
            // assert that adding multiple listeners results in healthy state
            assert.instanceOf(aBlock, AdminBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 2);
            assert.lengthOf(emitter.listeners('entryCreditBlock'), 1);
            assert.lengthOf(emitter.listeners('adminBlock'), 1);

            // assert that the removal of a listener does not stop polling if directoryBlock still has dependent listeners
            emitter.removeListener('adminBlock', listener);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners('entryCreditBlock'), 1);
            assert.lengthOf(emitter.listeners('adminBlock'), 0);

            // assert that the removal of the final dependent listeners stops polling and removes all listeners
            emitter.removeListener('entryCreditBlock', nullListener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            assert.lengthOf(emitter.listeners('entryCreditBlock'), 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(emitter.event.entryCreditBlock, nullListener);
        emitter.on(emitter.event.adminBlock, listener);
    });

    it('should not stop polling if there are listeners of the same type still active', done => {
        const emitter = new FactomEventEmitter(cli);

        const nullListener = () => {};

        const listener = fBlock => {
            // assert that adding multiple listeners results in healthy state
            assert.instanceOf(fBlock, FactoidBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners('factoidBlock'), 2);

            // assert that the removal of a listener does not stop polling if directoryBlock still has dependent listeners
            emitter.removeListener('factoidBlock', listener);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners('factoidBlock'), 1);

            // assert that the removal of the final dependent listeners stops polling and removes all listeners
            emitter.removeListener('factoidBlock', nullListener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            assert.lengthOf(emitter.listeners('factoidBlock'), 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(emitter.event.factoidBlock, nullListener);
        emitter.on(emitter.event.factoidBlock, listener);
    });

    it('should not stop polling when removing a factoidBlock listener whilst a factoid address listener is still active', done => {
        const emitter = new FactomEventEmitter(cli);
        const address = 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC';
        const nullListener = () => {};

        const listener = fBlock => {
            // assert that adding multiple listeners results in healthy state
            assert.instanceOf(fBlock, FactoidBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners('factoidBlock'), 2);
            assert.lengthOf(emitter.listeners(address), 1);

            // assert that the removal of a listener does not stop polling if factoidBlock still has dependent listeners
            emitter.removeListener('factoidBlock', listener);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners('factoidBlock'), 1);
            assert.lengthOf(emitter.listeners(address), 1);

            // assert that the removal of the final dependent listeners stops polling and removes all listeners
            emitter.removeListener(address, nullListener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            assert.lengthOf(emitter.listeners('factoidBlock'), 0);
            assert.lengthOf(emitter.listeners(address), 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(address, nullListener);
        emitter.on(emitter.event.factoidBlock, listener);
    });

    it('should add multiple chain ID listeners then remove one without affecting the others', done => {
        const emitter = new FactomEventEmitter(cli);
        const chainId0 = '23411b35d7666bdc41cf1446bf2156e20584f5c748dbabf5ca8f0fd9bd00efb1';
        const chainId1 = '0ec9d1cfbb458e28229b40139b5bee7d88c81215fb4dfdac48a9cf27f70f0790';
        const chainId2 = '880eda4ecd5beb0b31f3fc0130f13b7f918d2d52f14e5ab1bc9588cecc42392d';

        const nullListener = () => {};

        const listener = eBlock => {
            // assert that adding multiple listeners results in healthy state
            assert.instanceOf(eBlock, EntryBlock);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners(chainId0), 1);
            assert.lengthOf(emitter.listeners(chainId1), 1);
            assert.lengthOf(emitter.listeners(chainId2), 1);
            assert.lengthOf(emitter.entryChainSubscriptions, 3);

            // assert that the removal of a listener does not stop polling if directoryBlock still has dependent listeners
            emitter.removeListener(chainId0, nullListener);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners(chainId0), 0);
            assert.lengthOf(emitter.listeners(chainId1), 1);
            assert.lengthOf(emitter.listeners(chainId2), 1);
            assert.lengthOf(emitter.entryChainSubscriptions, 2);

            // assert that the removal of the final dependent listeners stops polling and removes all listeners
            emitter.removeListener(chainId1, nullListener);
            emitter.removeListener(chainId2, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            assert.lengthOf(emitter.listeners(chainId0), 0);
            assert.lengthOf(emitter.listeners(chainId1), 0);
            assert.lengthOf(emitter.listeners(chainId2), 0);
            assert.lengthOf(emitter.entryChainSubscriptions, 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(chainId0, nullListener);
        emitter.on(chainId1, nullListener);
        emitter.on(chainId2, listener);
        emitter.emit('directoryBlock', mockDirectoryBlock);
    });

    it('should add multiple factoid address listeners then remove one without affecting the others', done => {
        const emitter = new FactomEventEmitter(cli);
        const factoidBlockRef = 'cad832bab1d83c74bff8e1092fcf70e298cd7cdf35dee1956ae8879e749195ac';
        const address0 = 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC';
        const address1 = 'FA3PZ6PyUs5Nc7ybj938EHR8d3tpGCKBKz7gw7b99Z4y5xxFCfCC';
        const address2 = 'FA2m1B2BdNY8dEgFA5JQJ5gWn18gqM1fDpWMJU8MA7bzBEd5Yh3U';

        const nullListener = () => {};

        const listener = tx => {
            // assert that adding multiple listeners results in healthy state
            assert.strictEqual(tx.id, '8d5d3479eee4e651ff80144fbd7dfa45ac9e4b2b8e012204e3ca4eb142aef61e');
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners('factoidBlock'), 1);
            assert.lengthOf(emitter.listeners(address0), 1);
            assert.lengthOf(emitter.listeners(address1), 1);
            assert.lengthOf(emitter.listeners(address2), 1);
            assert.lengthOf(emitter.factoidAddressSubscriptions, 3);

            // assert that the removal of a listener does not stop polling if directoryBlock still has dependent listeners
            emitter.removeListener(address0, nullListener);
            assert.isTrue(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 1);
            assert.lengthOf(emitter.listeners('factoidBlock'), 1);
            assert.lengthOf(emitter.listeners(address0), 0);
            assert.lengthOf(emitter.listeners(address1), 1);
            assert.lengthOf(emitter.listeners(address2), 1);
            assert.lengthOf(emitter.factoidAddressSubscriptions, 2);

            // assert that the removal of the final dependent listeners stops polling and removes all listeners
            emitter.removeListener(address1, nullListener);
            emitter.removeListener(address2, listener);
            assert.isFalse(emitter.isPolling);
            assert.lengthOf(emitter.listeners('directoryBlock'), 0);
            assert.lengthOf(emitter.listeners('factoidBlock'), 0);
            assert.lengthOf(emitter.listeners(address0), 0);
            assert.lengthOf(emitter.listeners(address1), 0);
            assert.lengthOf(emitter.listeners(address2), 0);
            assert.lengthOf(emitter.factoidAddressSubscriptions, 0);

            done();
        };

        emitter.on('error', err => done(err));
        emitter.on(address0, nullListener);
        emitter.on(address1, nullListener);
        emitter.on(address2, listener);
        emitter.emit('directoryBlock', { factoidBlockRef });
    });

    it('should throw if trying to add chain ID already subscribed to', () => {
        const emitter = new FactomEventEmitter(cli);
        const chainId = '23411b35d7666bdc41cf1446bf2156e20584f5c748dbabf5ca8f0fd9bd00efb1';

        const nullListener = () => {
            throw new Error('this should never be called');
        };

        const errorListener = async err => {
            assert.instanceOf(err, Error);
            assert.strictEqual(err.message, `already listening to ${chainId}`);
            assert.lengthOf(emitter.listeners(chainId), 1);
            emitter.removeListener(chainId, nullListener);
        };

        emitter.on('error', errorListener);
        emitter.on(chainId, nullListener);
        emitter.on(chainId, nullListener);
    });

    it('should throw if trying to add factoid address alrady subscribed to', () => {
        const emitter = new FactomEventEmitter(cli);
        const address = 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC';

        const nullListener = () => {
            throw new Error('this should never be called');
        };

        const errorListener = async err => {
            assert.instanceOf(err, Error);
            assert.strictEqual(err.message, `already listening to ${address}`);
            assert.lengthOf(emitter.listeners(address), 1);
            emitter.removeListener(address, nullListener);
        };

        emitter.on('error', errorListener);
        emitter.on(address, nullListener);
        emitter.on(address, nullListener);
    });
});
