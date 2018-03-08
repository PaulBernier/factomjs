const factom = require('./src/factom');
const { Entry, Chain, FactomCli, getPublicAddress, Transaction } = factom;

// const entry = new Entry.Builder()
//     .content('88888', 'ascii')
//     .extIds(['helooo'])
//     .build();


// const chain = new Chain(entry);

const cli = new FactomCli({
    host: '52.202.51.229',
    port: 8088
});

const now = Date.now()

// Single input/output
const transaction = new Transaction.Builder()
    .input('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X', 21012000)
    .output('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 21000000)
    .build();

// console.log(transaction)

// cli.sendTransaction(transaction).then(console.log).catch(console.error);


async function handleTx() {
    // const tx = await cli.getFactoidTransaction('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X', 'FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 21000000);
    // console.log(tx)
    // const txid = await cli.sendTransaction(tx);
    // console.log(txid);
    // await cli.waitOnFactoidTransactionAck(txid)

    const tx2 = await cli.getEntryCreditPurchaseTransaction('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X',
        'EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR',
        10);
    console.log(tx2)
    const txid2 = await cli.sendTransaction(tx2);
    console.log(txid2);
    await cli.waitOnFactoidTransactionAck(txid2)

}

handleTx();

// TODO: 
// * Test getFactoidTransaction and getEntryCreditPurchaseTransaction
// * experiment multi input/output


// Multi input/output
// const transaction3 = new Transaction.Builder()
//     .input('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X', 80000)
//     .input('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X', 80000)
//     // Detect EC/FC output
//     .output('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 14000)
//     .output('EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD', 2000)
//     .adjustFeesOnInput(1000, 0)
//     .build();

// submitTransaction(transaction);
// // Optional 4th parameter override fee in Factoshi (reject if this override is lower than minimum)
// sendFactoid('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X', 'FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 55);
// buyEntryCreditFee('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X', 'EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD', 1000);
// buyEntryCredit('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X', 'EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD', 1000);