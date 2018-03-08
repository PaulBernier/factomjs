const factom = require('./src/factom');
const { Entry, Chain, FactomCli, getPublicAddress, Transaction } = factom;

const cli = new FactomCli({
    host: '52.202.51.229',
    port: 8088
});

cli.factomdApi('directoryBlock', "faf2a058cc475c5cb8ec13e8ba979118f7cde9db38bcfeb7e35744bcf5f6134b").then(console.log)

// const now = Date.now()

// // Single input/output
// const transaction = Transaction.Builder()
//     .input('Fs3BhggPYJBNJRzbLMce94FYyzEA3PDnsEJFwEsr37gYDN9QgFdh', 1012000)
//     .output('FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg4uH', 1000000)
//     .build();

// console.log(transaction)


// cli.sendTransaction(transaction).then(console.log).catch(console.error);




