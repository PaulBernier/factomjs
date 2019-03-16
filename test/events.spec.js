const { FactomEvent } = require('../src/events'),
    { FactomCli } = require('../src/factom-cli'),
    { DirectoryBlock } = require('../src/blocks'),
    assert = require('chai').assert,
    Promise = require('bluebird');

describe.only('Test Listener', () => {
    const cli = new FactomCli({
        factomd: {
            host: process.env.FACTOMD_HOST,
            port: process.env.FACTOMD_PORT
        }
    });

    it('should set events properties', () => {
        const events = new FactomEvent(cli);
        assert.equal(events.cli, cli);
        assert.equal(events.height, 0);
    });

    it('should start polling and emit a new directoryBlock', async () => {
        const events = new FactomEvent(cli);

        try {
            const block = await new Promise(resolve => {
                events.on('directoryBlock', block => resolve(block)).startPolling();
            });
            assert.instanceOf(block, DirectoryBlock);
        } finally {
            events.removeAllListeners().stopPolling();
        }
    });

    it('should start polling then remove all listeners and stop polling', async () => {
        const events = new FactomEvent(cli);

        try {
            await new Promise(resolve => {
                events.on('directoryBlock', () => resolve()).startPolling();
            });

            events.removeAllListeners().stopPolling();
            const activeListeners = events.eventNames();
            assert.isNull(events.interval);
            assert.isUndefined(activeListeners[0]);
        } finally {
            events.removeAllListeners().stopPolling();
        }
    });

    it('should throw an error if startPolling is called twice', () => {
        const event = new FactomEvent(cli);

        try {
            event.startPolling();
            event.startPolling();
            assert.fail('Polling started twice');
        } catch (err) {
            assert.equal(err.message, 'Polling already started');
        } finally {
            event.removeAllListeners().stopPolling();
        }
    });

    it('should trigger listener for factoid address transaction', async () => {
        // const dBlock = '50f784c9290c01ab2ea9a595aae6f1639d1b6e83a6f90ed9efa1863996ff0fe1';
        // const address = 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC';
        // const event = new FactomEvent(cli);
        // event.startPolling().setFactoidTransactionListener();
    });
});
