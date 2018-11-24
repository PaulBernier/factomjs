const assert = require('chai').assert,
    { FactomdCli } = require('../src/apis-cli'),
    { Transaction } = require('../src/transaction'),
    send = require('../src/send');

const nconf = require('nconf').env().file({ file: `${__dirname}/config.json` });
const factomd = new FactomdCli({ host: nconf.get('FACTOMD_HOST'), port: nconf.get('FACTOMD_PORT') });
const PAYING_FCT_ADDRESS = nconf.get('FCT_PRIVATE_ADDRESS');
const RECEIVING_FCT_ADDRESS = 'FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg4uH';
const RECEIVING_EC_ADDRESS = 'EC3MVTBYTo2Y1HrEKxeEGfNNoKhLZ9ZYQhb26zQUzngJ6SLUVRX9';

describe('Send transactions', function() {

    it('should send Factoid Transaction', async function() {
        this.timeout(10000);

        const transaction = await send.createFactoidTransaction(factomd, PAYING_FCT_ADDRESS, RECEIVING_FCT_ADDRESS, 1);
        await send.sendTransaction(factomd, transaction);
    });

    it('should refuse to build under paid transation', async function() {
        this.timeout(10000);

        try {
            await send.createFactoidTransaction(factomd, PAYING_FCT_ADDRESS, RECEIVING_FCT_ADDRESS, 1, 1);
        } catch (e) {
            assert.instanceOf(e, Error);
            assert.include(e.message, 'Cannot set fees to ');
            return;
        }
        throw new Error('Should have thrown Error');
    });

    it('should reject over paid transation', async function() {
        this.timeout(10000);

        try {
            const tx = await send.createFactoidTransaction(factomd, PAYING_FCT_ADDRESS, RECEIVING_FCT_ADDRESS, 1, 99999999999);
            await send.sendTransaction(factomd, tx);
        } catch (e) {
            assert.instanceOf(e, Error);
            assert.include(e.message, 'Transaction is overpaying required fees by more than 10 times');
            return;
        }
        throw new Error('Should have thrown Error');
    });

    it('should send Entry Credit purchase Transaction', async function() {
        this.timeout(10000);

        const transaction = await send.createEntryCreditPurchaseTransaction(factomd, PAYING_FCT_ADDRESS, RECEIVING_EC_ADDRESS, 1);
        await send.sendTransaction(factomd, transaction);

    });

    it('should reject under paid transaction', async function() {
        this.timeout(10000);

        try {
            const transaction = Transaction.builder()
                .input(PAYING_FCT_ADDRESS, 1)
                .output(RECEIVING_FCT_ADDRESS, 1)
                .build();


            await send.sendTransaction(factomd, transaction);
        } catch (e) {
            assert.instanceOf(e, Error);
            assert.include(e.message, 'Insufficient fees for the transaction');
            return;
        }

        throw new Error('Should have thrown Error');

    });

    it('should send multi output Transaction', async function() {
        this.timeout(10000);

        const rate = await factomd.call('entry-credit-rate')
            .then(r => r.rate);

        const fees = Transaction.builder()
            .input(PAYING_FCT_ADDRESS, 2)
            .output(RECEIVING_FCT_ADDRESS, 1)
            .output(RECEIVING_EC_ADDRESS, 1)
            .build()
            .computeRequiredFees(rate);

        const transaction = Transaction.builder()
            .input(PAYING_FCT_ADDRESS, 2 + fees)
            .output(RECEIVING_FCT_ADDRESS, 1)
            .output(RECEIVING_EC_ADDRESS, 1)
            .build();

        await send.sendTransaction(factomd, transaction);
    });

});