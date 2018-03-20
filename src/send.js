const Promise = require('bluebird'),
    { waitOnFactoidTransactionAck } = require('./ack'),
    { publicFactoidRCDHashToHumanAddress } = require('factomjs-util'),
    { isValidFctPublicAddress, isValidEcPublicAddress } = require('./addresses'),
    { getPrivateAddress } = require('./wallet'),
    { Transaction } = require('./transaction'),
    { getEntryCreditRate } = require('./get');

async function sendTransaction(factomd, transaction, to) {
    const ackTimeout = to || 60;
    const txId = await submitTransaction(factomd, transaction);

    if (ackTimeout >= 0) {
        await waitOnFactoidTransactionAck(factomd, txId, ackTimeout);
    }

    return txId;
}

async function submitTransaction(factomd, transaction) {
    if (!(transaction instanceof Transaction)) {
        throw new Error('Argument must be an instance of Transaction');
    }

    const ecRate = await getEntryCreditRate(factomd);
    if (!transaction.validateFees(ecRate)) {
        throw new Error(`Insufficient fees for the transaction (paid: ${transaction.feesPaid}, minimum required: ${transaction.feesRequired(ecRate)}, current EC rate: ${ecRate})`);
    }

    await Promise.each(transaction.inputs, input => validateFunds(factomd, publicFactoidRCDHashToHumanAddress(input.rcdHash), input.amount));

    return factomd.factoidSubmit(transaction.marshalBinary().toString('hex'))
        .then(r => r.txid);
}

async function validateFunds(factomd, publicFctAddress, amount) {
    const { balance } = await factomd.factoidBalance(publicFctAddress);
    if (balance < amount) {
        throw new Error(`Address ${publicFctAddress} doesn't have sufficient funds (balance: ${balance})`);
    }
}

async function getFactoidTransaction(factomd, walletd, originAddress, recipientAddress, amount, fees) {
    const originPrivateAddress = await getPrivateAddress(walletd, originAddress);
    if (!isValidFctPublicAddress(recipientAddress)) {
        throw new Error('Recipient address is not a valid Factoid public address');
    }

    const ecRate = await getEntryCreditRate(factomd);
    const requiredFees = Transaction.builder()
        .input(originPrivateAddress, amount)
        .output(recipientAddress, amount)
        .build()
        .feesRequired(ecRate);

    let finalFees = requiredFees;
    if (fees && fees < requiredFees) {
        throw new Error(`Cannot set fees to ${fees} factoshis because the minimum required fees are ${requiredFees}`);
    } else if (fees) {
        finalFees = fees;
    }

    const transaction = Transaction.builder()
        .input(originPrivateAddress, amount + finalFees)
        .output(recipientAddress, amount)
        .build();

    return transaction;
}

async function getEntryCreditPurchaseTransaction(factomd, walletd, originAddress, recipientAddress, ecAmount, fees) {
    const originPrivateAddress = await getPrivateAddress(walletd, originAddress);
    if (!isValidEcPublicAddress(recipientAddress)) {
        throw new Error('Recipient address is not a valid Entry Credit public address');
    }

    const ecRate = await getEntryCreditRate(factomd);
    const amount = ecAmount * ecRate;

    const requiredFees = Transaction.builder()
        .input(originPrivateAddress, amount)
        .output(recipientAddress, amount)
        .build()
        .feesRequired(ecRate);

    let finalFees = requiredFees;
    if (fees && fees < requiredFees) {
        throw new Error(`Cannot set fees to ${fees} factoshis because the minimum required fees are ${requiredFees}`);
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
    getFactoidTransaction,
    getEntryCreditPurchaseTransaction
};