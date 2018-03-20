# Factom.js

Library to interact easily with Factom blockchain. 

* Provide higher level functionalities than bare API making it more efficient to create chains or entries, make transactions...
* Provide structures more uniform, consistent and easy to use than the API results

## Installation

```bash
$ npm install --save factom
```

## Usage

Important: please note than whenever a private address (EntryCredit or Factoid) is needed (typically for signing data), you can either provide a private address or a public address as an argument. If you provide a public address the library will attempt to retrieve the corresponding private address from the wallet. Thus providing private address as arguments allow you to not have to run walletd.

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

```javascript
const firstEntry = Entry.builder()
    .extId('my ext id 1')
    .extId('6d79206578742069642031', 'hex')
    .content('Initial content')
    .build();
const chain = new Chain(firstEntry);
cli.addChain(chain, 'Es32PjobTxPTd73dohEFRegMFRLv3X5kZ4FXEwtN8kE2pMDfeMym')
    .then(console.log);
```

TODO: note about ack commit, reveal + repeated commit

#### Add an entry

```javascript
const myEntry = Entry.builder()
    .chainId('9107a308f91fd7962fecb321fdadeb37e2ca7d456f1d99d24280136c0afd55f2')
    .extId('some external ID')
    .extId('6d79206578742069642031', 'hex')
    .content('My new content')
    .build();
cli.addEntry(myEntry, 'Es32PjobTxPTd73dohEFRegMFRLv3X5kZ4FXEwtN8kE2pMDfeMym')
    .then(console.log);
```

```javascript

cli.addEntries([entry1, entry2], 'Es32PjobTxPTd73dohEFRegMFRLv3X5kZ4FXEwtN8kE2pMDfeMym')
    .then(console.log);
```

TODO: note about ack commit, reveal + repeated commit

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
// You can check how much Factoshis it's going to cost you to buy those 10 EC
console.log(transaction.totalInputs);
const txId = await cli.sendTransaction(transaction);
```

#### Multi inputs/outputs transaction

For multi inputs/outputs you have to build your Transaction object yourself and set the fees manually.

```javascript
const { Transaction } = require('factom');

const ecRate = await cli.getEntryCreditRate();
const requiredFees = Transaction.builder()
    .input('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav37X', 14000000)
    .input('Fs3BhggPYJBNJRzbLMce94FYyzEA3PDnsEJFwEsr37gYDN9QgFrh', 1010000)
    .output('FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg5uH', 5000000)
    .output('FA24PAtyZWWVAPm95ZCVpwyY6RYHeCMTiZt2v4VQAY8aBXMUZteF', 10000000)
    .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e3QR', 10000)// Please note this line is to buy EntryCredit (see the address type) and the amount is in Factoshis like others (it is *not* the number of EntryCredit you are purchasing)
    .build()
    .feesRequired(ecRate);

// Now that you know the required fees for your transaction you are free to add to any inputs or substract it from any outputs
const transaction = Transaction.builder()
    .input('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav37X', 14000000)
    .input('Fs3BhggPYJBNJRzbLMce94FYyzEA3PDnsEJFwEsr37gYDN9QgFrh', 1010000 + requiredFees)
    .output('FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg5uH', 5000000)
    .output('FA24PAtyZWWVAPm95ZCVpwyY6RYHeCMTiZt2v4VQAY8aBXMUZteF', 10000000)
    .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e3QR', 10000)
    .build()

const txId = await cli.sendTransaction(transaction);
```

#### Transaction acknowledgement

`sendTransaction` method has a second optional argument that is the timeout in seconds to wait for the transaction acknowledgement by the network (passed the timeout an exception is thrown). If not provided or set to 0, a default timeout value of 60s is used. You are free to set a lower or higher value. If you provide a negative value the acknowledgment will be disabled (no wait).

```javascript
// Wait transaction ack for up to 60s
const txId = await cli.sendTransaction(transaction);
// Wait transaction ack for up to 20s
const txId = await cli.sendTransaction(transaction, 20);
// Disable wait for ack
const txId = await cli.sendTransaction(transaction, -1);
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

### Blocks

```javascript
const db = await cli.getDirectoryBlock('f55a19d9562843b642f1a20b34fcbb71e70f438c4d98d223fc2228ca2dd0c54a');
const ecb = await cli.getEntryCreditBlock(db.entryCreditBlockRef);
const fb = await cli.getFactoidBlock(db.factoidBlockRef);
const ab = await cli.getAdminBlock(db.entryCreditBlockRef);
const eb = await cli.getEntryBlock(db.entryBlockRefs[0]);
```

### Raw Factomd and Walletd API calls

```javascript
// First argument is the API, then follow the args for the API call
cli.factomdApi('directory-block', "faf2a058cc475c5cb8ec13e8ba979118f7cde9db38bcfeb7e35744bcf5f6134b");
cli.walletdApi('address', "FA2jK2HcLnRdS94dEcU27rF3meoJfpUcZPSinpb7AwQvPRY6RL1Q");

```