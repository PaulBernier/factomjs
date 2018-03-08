const { isValidFctPublicAddress, isValidEcPublicAddress } = require('./addresses'), { getPrivateAddress } = require('./wallet'), { Transaction } = require('./transaction'), { getEntryCreditRate } = require('./get');

async function sendTransaction(factomd, transaction) {
    if (!(transaction instanceof Transaction)) {
        throw 'Argument must be an instance of Transaction';
    }

    const ecRate = await getEntryCreditRate(factomd);
    if (!transaction.validateFees(ecRate)) {
        throw `Insufficient fees for the transaction (paid: ${transaction.feesPaid}, minimum required: ${transaction.feesRequired(ecRate)}, current EC rate: ${ecRate})`;
    }

    return factomd.factoidSubmit(transaction.marshalBinary().toString('hex'))
        .then(r => r.txid);
}

async function getFactoidTransaction(factomd, walletd, originAddress, recipientAddress, amount, fees) {
    const originPrivateAddress = await getPrivateAddress(walletd, originAddress);
    if (!isValidFctPublicAddress(recipientAddress)) {
        throw 'Recipient address is not a valid Factoid public address';
    }

    const ecRate = await getEntryCreditRate(factomd);
    const requiredFees = new Transaction.Builder()
        .input(originPrivateAddress, amount)
        .output(recipientAddress, amount)
        .build()
        .feesRequired(ecRate);

    let finalFees = requiredFees;
    if (fees && fees < requiredFees) {
        throw `Cannot set fees to ${fees} factoshis because the minimum required fees are ${requiredFees}`;
    } else if (fees) {
        finalFees = fees;
    }

    const transaction = new Transaction.Builder()
        .input(originPrivateAddress, amount + finalFees)
        .output(recipientAddress, amount)
        .build();

    return transaction;
}

async function getEntryCreditPurchaseTransaction(factomd, walletd, originAddress, recipientAddress, ecAmount, fees) {
    const originPrivateAddress = await getPrivateAddress(walletd, originAddress);
    if (!isValidEcPublicAddress(recipientAddress)) {
        throw 'Recipient address is not a valid Entry Credit public address';
    }

    const ecRate = await getEntryCreditRate(factomd);
    const amount = ecAmount * ecRate;

    const requiredFees = new Transaction.Builder()
        .input(originPrivateAddress, amount)
        .output(recipientAddress, amount)
        .build()
        .feesRequired(ecRate);

    let finalFees = requiredFees;
    if (fees && fees < requiredFees) {
        throw `Cannot set fees to ${fees} factoshis because the minimum required fees are ${requiredFees}`;
    } else if (fees) {
        finalFees = fees;
    }

    const transaction = new Transaction.Builder()
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