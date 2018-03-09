# Factom.js

## Installation

```bash
$ npm install --save factom
```

### Instantiate FactomCli

```javascript
const { FactomCli } = require('factom');
const cli = new FactomCli({
    host: '52.202.51.228',
    port: 8088
});
```

### Chains and Entries

#### Add a Chain

#### Add an entry

### Transactions

#### Simple Factoid transaction
```javascript
// Send 1000000 Factoshis (10^-8 Factoids) from Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X to FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw
const transaction = await cli.getFactoidTransaction('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X',
                                                    'FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 
                                                    1000000);
// You can check the additional fees that you are going to pay for the transaction to go through
// (automatically set to the minimum acceptable by the network)
console.log(transaction.feesPaid);
// Send the transaction
const txId = await cli.sendTransaction(tx);
```

#### Buy EntryCredit

```javascript
// Buy 10 EC with address Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X and credited to EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR
const transaction = await cli.getEntryCreditPurchaseTransaction('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X',
                                                                'EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR',
                                                                10);
// You can check how much Factoshis it's going to cost you to buy those EC
console.log(transaction.totalInputs);
const txId = await cli.sendTransaction(transaction);
```

#### Multi inputs/outputs transaction

For multi inputs/outputs you have to build your Transaction object yourself and set the fees manually.

```javascript
const { Transaction } = require('factom');

const ecRate = await cli.getEntryCreditRate();
const requiredFees = Transaction.Builder()
    .input('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav37X', 14000000)
    .input('Fs3BhggPYJBNJRzbLMce94FYyzEA3PDnsEJFwEsr37gYDN9QgFrh', 1010000)
    .output('FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg5uH', 5000000)
    .output('FA24PAtyZWWVAPm95ZCVpwyY6RYHeCMTiZt2v4VQAY8aBXMUZteF', 10000000)
    .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e3QR', 10000)// Please note this line is to buy EntryCredit (see the address type) and the amount is in Factoshis like others (it is *not* the number of EntryCredit you are purchasing)
    .build()
    .feesRequired(ecRate);

// Now that you know the required fees for your transaction you are free to add to any inputs or substract it from any outputs
const transaction = Transaction.Builder()
    .input('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav37X', 14000000)
    .input('Fs3BhggPYJBNJRzbLMce94FYyzEA3PDnsEJFwEsr37gYDN9QgFrh', 1010000 + requiredFees)
    .output('FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg5uH', 5000000)
    .output('FA24PAtyZWWVAPm95ZCVpwyY6RYHeCMTiZt2v4VQAY8aBXMUZteF', 10000000)
    .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e3QR', 10000)
    .build()

const txId = await cli.sendTransaction(transaction);
```

#### Transaction acknowledgement

`sendTransaction` method will wait for the transaction to be acknowledge by the network before returning with a default timeout. If you don't wish to wait for acknowledgement you can use `sendTransactionNoAck` together with `waitOnFactoidTransactionAck`.

```javascript
const txId = await cli.sendTransactionNoAck(transaction);
// Wait transaction ack for 20s
await cli.waitOnFactoidTransactionAck(txId, 20);
```

#### Get Transaction

```javascript
const result = await cli.getTransaction(txId);
/* 
    Output structure: 

    { 
        transaction: Transaction,
        includedInTransactionBlock: String,
        includedInDirectoryBlock: String,
        includedInDirectoryBlockHeight: Number 
    }
*/
```

### Raw Factomd and Walletd API calls

```javascript
// First argument is the API, then follow the args for the API call
cli.factomdApi('directory-block', "faf2a058cc475c5cb8ec13e8ba979118f7cde9db38bcfeb7e35744bcf5f6134b");
cli.walletdApi('address', "FA2jK2HcLnRdS94dEcU27rF3meoJfpUcZPSinpb7AwQvPRY6RL1Q");

```