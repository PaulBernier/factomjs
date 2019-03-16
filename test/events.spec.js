const { FactomEvent } = require('../src/events'),
    { FactomCli } = require('../src/factom-cli'),
    { DirectoryBlock } = require('../src/blocks'),
    assert = require('chai').assert,
    Promise = require('bluebird');

describe.only('Test FactomEvent', () => {
    const cli = new FactomCli({
        factomd: {
            host: process.env.FACTOMD_HOST,
            port: process.env.FACTOMD_PORT
        }
    });

    /**
     * Basic FactomEvent tests
     */

    it('should set events properties', () => {
        const emitter = new FactomEvent(cli);
        assert.equal(emitter.cli, cli);
        assert.equal(emitter.height, 0);
    });

    it('should start polling and emit a new directoryBlock', async () => {
        const emitter = new FactomEvent(cli);

        try {
            const block = await new Promise(resolve => {
                emitter.on('directoryBlock', block => resolve(block)).startPolling();
            });
            assert.instanceOf(block, DirectoryBlock);
        } finally {
            emitter.removeAllListeners().stopPolling();
        }
    });

    it('should start polling then remove all listeners and stop polling', async () => {
        const emitter = new FactomEvent(cli);

        try {
            await new Promise(resolve => {
                emitter.on('directoryBlock', () => resolve()).startPolling();
            });

            emitter.removeAllListeners().stopPolling();
            const activeListeners = emitter.eventNames();
            assert.isNull(emitter.interval);
            assert.isUndefined(activeListeners[0]);
        } finally {
            emitter.removeAllListeners().stopPolling();
        }
    });

    it('should throw an error if startPolling is called twice', () => {
        const emitter = new FactomEvent(cli);

        try {
            emitter.startPolling();
            emitter.startPolling();
            assert.fail('Polling started twice');
        } catch (err) {
            assert.equal(err.message, 'Polling already started');
        } finally {
            emitter.removeAllListeners().stopPolling();
        }
    });

    /**
     * Factoid address event tests
     */

    const mockDirectoryBlock = {
        factoidBlockRef: '8fee341e9cec46488aef80f7f3688974a974a603b52cfcfc9337bac5c5894f68',
        keyMR: '50f784c9290c01ab2ea9a595aae6f1639d1b6e83a6f90ed9efa1863996ff0fe1',
        height: 70391
    };

    it.only('should trigger listener for factoid transaction TO address', done => {
        const address = 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC';

        const listener = transactionArr => {
            try {
                const transaction = transactionArr[0];
                assert.lengthOf(transactionArr, 1);
                assert.equal(transaction.id, '8bbdb36359edddcedf7b4d256c281198b5523f7cc98668837e71305d0c3859fc');
                done();
            } catch (err) {
                done(err);
            } finally {
                emitter.removeAllListeners();
            }
        };

        const emitter = new FactomEvent(cli);
        emitter.setFactoidAddressListener(address, listener);
        emitter.emit('directoryBlock', mockDirectoryBlock);
    });

    it('should NOT trigger listener for factoid transaction TO address', done => {
        const address = 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC';
        const opts = { onReceive: false };

        const listener = () => done(new Error('setting onReceive to false did not prevent event emitting'));

        const emitter = new FactomEvent(cli);
        emitter.setFactoidAddressListener(address, listener, opts);
        emitter.emit('directoryBlock', mockDirectoryBlock);

        setTimeout(() => {
            emitter.removeFactoidAddressListener(address, listener);
            done();
        }, 1500);
    });

    it('should trigger listener for factoid transaction FROM address', done => {
        const address = 'FA3ZxKyN3HHoJftdGbFp5PRvi12jPvQ3SgGNTDQya2D5jwFrtLqZ';

        const listener = transactionArr => {
            try {
                assert.lengthOf(transactionArr, 2);
                assert.equal(transactionArr[0].id, '8bbdb36359edddcedf7b4d256c281198b5523f7cc98668837e71305d0c3859fc');
                assert.equal(transactionArr[1].id, 'eedcc5ce2744ccd0af24f157c78adab6bed2b0afde03921c0906f0437acaef3a');
                done();
            } catch (err) {
                done(err);
            } finally {
                emitter.removeAllListeners();
            }
        };

        const emitter = new FactomEvent(cli);
        emitter.setFactoidAddressListener(address, listener);
        emitter.emit('directoryBlock', mockDirectoryBlock);
    });

    it('should NOT trigger listener for factoid transaction FROM address', done => {
        const address = 'FA3ZxKyN3HHoJftdGbFp5PRvi12jPvQ3SgGNTDQya2D5jwFrtLqZ';
        const opts = { onSend: false };

        const listener = () => done(new Error('setting onReceive to false did not prevent event emitting'));

        const emitter = new FactomEvent(cli);
        emitter.setFactoidAddressListener(address, listener, opts);
        emitter.emit('directoryBlock', mockDirectoryBlock);

        setTimeout(() => {
            emitter.removeFactoidAddressListener(address, listener);
            done();
        }, 1500);
    });
});
