const assert = require('chai').assert,
    { FactomdCli } = require('../src/apis-cli'),
    { waitOnCommitAck, waitOnRevealAck, waitOnFactoidTransactionAck } = require('../src/ack');

require('dotenv').config();
const factomd = new FactomdCli({
    host: process.env.FACTOMD_HOST,
    port: process.env.FACTOMD_PORT
});

describe('Acknowledge data in Factom blockchain', function() {
    it('should fail because of invalid arg', async function() {
        this.timeout(5000);
        try {
            await waitOnCommitAck(factomd, 'aa');
        } catch (e) {
            assert.instanceOf(e, Error);
            assert.include(e.message, 'Invalid params (code: -32602)');
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should timeout', async function() {
        try {
            await waitOnCommitAck(
                factomd,
                'bbd51be102e7ed19b825acd32d48f1f88033d5b14721f3003f925862b1baf137',
                1
            );
        } catch (e) {
            assert.instanceOf(e, Error);
            assert.include(e.message, 'Timeout');
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should wait on commit ack', async function() {
        const status = await waitOnCommitAck(
            factomd,
            'bbd51be102e7ed19b825acd32d48f1f88033d5b14721f3003f925862b1baf135'
        );
        assert.strictEqual(status, 'DBlockConfirmed');
    });

    it('should wait on reveal ack', async function() {
        const status = await waitOnRevealAck(
            factomd,
            'ac564d418ffaae59432d644d59fd11f6f0552a1211e9219e16037bc14296c630',
            '3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791'
        );
        assert.strictEqual(status, 'DBlockConfirmed');
    });

    it('should wait on Factoid transaction ack', async function() {
        const status = await waitOnFactoidTransactionAck(
            factomd,
            '09d23680a82f95faafd3562f6b76d83525bdd4575a74656809ced19fa45f72e6'
        );
        assert.strictEqual(status, 'DBlockConfirmed');
    });
});
