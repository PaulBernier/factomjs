const factom = require('./src/factom');
const { Entry, Chain, FactomCli, getPublicAddress, Transaction } = factom;

const cli = new FactomCli({
    host: '52.202.51.229',
    port: 8088
});

const now = Date.now()

// Single input/output
const transaction = Transaction.Builder()
    .input('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X', 14000000)
    .input('Fs3BhggPYJBNJRzbLMce94FYyzEA3PDnsEJFwEsr37gYDN9QgFdh', 1010000)
    .output('FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg4uH', 5000000)
    .output('FA24PAtyZWWVAPm95ZCVpwyY6RYHeCMTiZt2v4VQAY8aBXMUZyeF', 10000000)
    .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR', 10000)// Please note this line is to buy EntryCredit (see the address type) and the amount is in Factoshis like others (it is *not* the number of EntryCredit you are purchasing)
    .build()
    .feesRequired(1000);

console.log(transaction)

console.log(transaction.feesRequired(1000))

cli.sendTransaction(transaction).then(console.log).catch(console.error);




