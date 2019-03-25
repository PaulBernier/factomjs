const Promise = require('bluebird'),
    { waitOnFactoidTransactionAck } = require('./ack'),
    { isValidPublicFctAddress, isValidPublicEcAddress } = require('./addresses'),
    { Transaction } = require('./transaction'),
    { getEntryCreditRate } = require('./get');

const MAX_OVERPAYING_FACTOR = 10;

async function sendTransaction(factomd, transaction, opts) {
    const options = opts || {};
    const ackTimeout = options.timeout || 60;
    const txId = await submitTransaction(factomd, transaction, !!options.force);

    if (ackTimeout >= 0) {
        await waitOnFactoidTransactionAck(factomd, txId, ackTimeout);
    }

    return txId;
}

async function submitTransaction(factomd, transaction, force) {
    if (!(transaction instanceof Transaction)) {
        throw new Error('Argument must be an instance of Transaction');
    }
    if (!transaction.isSigned()) {
        throw new Error('Cannot submit an unsigned transaction');
    }

    const ecRate = await getEntryCreditRate(factomd);
    const minimumRequiresFees = transaction.computeRequiredFees(ecRate);

    if (minimumRequiresFees > transaction.feesPaid) {
        throw new Error(
            `Insufficient fees for the transaction (paid: ${
                transaction.feesPaid
            }, minimum required: ${minimumRequiresFees}, current EC rate: ${ecRate})`
        );
    } else if (!force && minimumRequiresFees * MAX_OVERPAYING_FACTOR < transaction.feesPaid) {
        throw new Error(
            `Transaction is overpaying required fees by more than 10 times (paid: ${
                transaction.feesPaid
            }, minimum required: ${minimumRequiresFees}, current EC rate: ${ecRate})`
        );
    }

    if (!force) {
        transaction.entryCreditOutputs.forEach(function(eco) {
            if (eco.amount < ecRate) {
                throw new Error(
                    `Entry Credit output to ${
                        eco.address
                    } is not sufficient to get a minimum of 1 Entry Credit (${
                        eco.amount
                    } < ${ecRate}).`
                );
            }
        });
    }

    await Promise.each(transaction.inputs, input =>
        validateFunds(factomd, input.address, input.amount)
    );

    return factomd
        .call('factoid-submit', {
            transaction: transaction.marshalBinary().toString('hex')
        })
        .then(r => r.txid);
}

async function validateFunds(factomd, publicFctAddress, amount) {
    const { balance } = await factomd.call('factoid-balance', {
        address: publicFctAddress
    });
    if (balance < amount) {
        throw new Error(
            `Address ${publicFctAddress} doesn't have sufficient funds (balance: ${balance})`
        );
    }
}

async function createFactoidTransaction(
    factomd,
    originPrivateAddress,
    recipientAddress,
    amount,
    fees
) {
    if (!isValidPublicFctAddress(recipientAddress)) {
        throw new Error(
            `Recipient address [${recipientAddress}] is not a valid public Factoid address`
        );
    }

    const ecRate = await getEntryCreditRate(factomd);
    return buildTransactionWithFees(originPrivateAddress, recipientAddress, amount, ecRate, fees);
}

async function createEntryCreditPurchaseTransaction(
    factomd,
    originPrivateAddress,
    recipientAddress,
    ecAmount,
    fees
) {
    if (!isValidPublicEcAddress(recipientAddress)) {
        throw new Error(
            `Recipient address [${recipientAddress}] is not a valid public Entry Credit address`
        );
    }

    const ecRate = await getEntryCreditRate(factomd);
    const amount = ecAmount * ecRate;

    return buildTransactionWithFees(originPrivateAddress, recipientAddress, amount, ecRate, fees);
}

function buildTransactionWithFees(originPrivateAddress, recipientAddress, amount, ecRate, fees) {
    const requiredFees = Transaction.builder()
        .input(originPrivateAddress, amount)
        .output(recipientAddress, amount)
        .build()
        .computeRequiredFees(ecRate);

    let finalFees = requiredFees;
    if (fees && fees < requiredFees) {
        throw new Error(
            `Cannot set fees to ${fees} factoshis because the minimum required fees are ${requiredFees}`
        );
    } else if (fees) {
        finalFees = fees;
    }

    const transaction = Transaction.builder()
        .input(originPrivateAddress, amount + finalFees)
        .output(recipientAddress, amount)
        .build();

    return transaction;
}

module.exports = {
    sendTransaction,
    createFactoidTransaction,
    createEntryCreditPurchaseTransaction
};
