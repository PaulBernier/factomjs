# Factom.js

Library to interact easily with Factom blockchain. 

* Provide higher level functionalities than bare API making it more efficient to create chains or entries, make transactions...
* Provide structures more uniform, consistent and easy to use than the API results

## State of development

**Important**: This library is at an early development stage and being actively worked on . You should expect breaking changes in interface definitions in newer versions until we reach a more stable stage.

## Installation

```bash
$ npm install --save factom
```

## Usage

Important: please note than whenever a private (EntryCredit or Factoid) address is needed in this library (typically for signing data), you can either provide a private address or a public address as an argument. If you provide a public address the library will attempt to retrieve the corresponding private address from the wallet. Thus providing private address as arguments allow you to not have to run walletd.

### Instantiate FactomCli

```javascript
const { FactomCli } = require('factom');

// Default factomd connection to localhost:8088
// and walletd connection to localhost:8089
const cli = new FactomCli();

// You can override factomd connection parameters
const cli = new FactomCli({
    host: '52.202.51.228',
    port: 8088
});

// You can also override both factomd and walletd connection parameters
const cli = new FactomCli({
    factomd: {
        host: '52.202.51.229',
        port: 8088
    },
    walletd: {
        host: '52.202.51.229',
        port: 8089
    }
});
```

### Chains and Entries

#### Add a Chain

```javascript
const firstEntry = Entry.builder()
    .extId('6d79206578742069642031') // If no encoding parameter is passed 'hex' is used
    .extId('my ext id 1', 'utf8') // Explicit the encoding. Or you can pass directly a Buffer
    .content('Initial content', 'utf8')
    .build();

const chain = new Chain(firstEntry);
cli.addChain(chain, 'Es32PjobTxPTd73dohEFRegMFRLv3X5kZ4FXEwtN8kE2pMDfeMym')
    .then(console.log);
```

#### Add an entry

```javascript
const myEntry = Entry.builder()
    .chainId('9107a308f91fd7962fecb321fdadeb37e2ca7d456f1d99d24280136c0afd55f2')
    .extId('6d79206578742069642031')
    .extId('some external ID', 'utf8')
    .content('My new content',  'utf8')
    .build();
cli.addEntry(myEntry, 'Es32PjobTxPTd73dohEFRegMFRLv3X5kZ4FXEwtN8kE2pMDfeMym')
    .then(console.log);
```

```javascript

cli.addEntries([entry1, entry2], 'Es32PjobTxPTd73dohEFRegMFRLv3X5kZ4FXEwtN8kE2pMDfeMym')
    .then(console.log);
```

#### Commit/reveal acknowledgment when submitting chains or entries

Factom protocol uses a [commit/reveal commitment scheme](https://en.wikipedia.org/wiki/Commitment_scheme). By default when using `addChain` or `addEntry` the library will sequentially wait for an acknowledgment (ack) of the commit by the network and then wait for the ack of the reveal, both for up to 60s. The library allows you to customize the timeouts of those acks and also to not wait for the acks at all when creating a Chain or an Entry. Please read [Factom whitepaper](https://www.factom.com/devs/docs/guide/factom-white-paper-1-0) about commit/reveal scheme and what are the potential risks to not wait for network acknowledgments.

```javascript
// Default behavior waits for both commit and reveal up to 60s
cli.addEntry(myEntry, 'Es32PjobTxPTd73dohEFRegMFRLv3X5kZ4FXEwtN8kE2pMDfeMym');
// Change the timeout for commit ack to 120s and the timeout for reveal ack to 20s
cli.addEntry(myEntry, 'Es32PjobTxPTd73dohEFRegMFRLv3X5kZ4FXEwtN8kE2pMDfeMym', {commitTimeout: 120, revealTimeout: 20});
// By providing a negative number the library will not wait for any acknowledgment. 
// In below example the wait on reveal ack is disabled (it'll still wait up to 60s on the commit ack).
cli.addEntry(myEntry, 'Es32PjobTxPTd73dohEFRegMFRLv3X5kZ4FXEwtN8kE2pMDfeMym', {revealTimeout: -1});
```

#### Repeated commit

If you commit twice an entry or a chain and that the second time the fees paid are lower or equal to the first commit you are in a 'repeated commit' case and the second commit will be rejected (and you won't be charged for it). If this scenario happens (which it should probably not) the output of `addEntry` or `addChain` will have the field `repeatedCommit` set to `true` and the field `txId` will be undefined.

### Transactions

#### Simple Factoid transaction
```javascript
// Send 1000000 Factoshis (10^-8 Factoids) from Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X 
// to FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw
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
// Buy 10 EC with address Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X and credited 
// to EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR
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
const tmpTx = Transaction.builder()
    .input('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav37X', 14000000)
    .input('Fs3BhggPYJBNJRzbLMce94FYyzEA3PDnsEJFwEsr37gYDN9QgFrh', 1010000)
    .output('FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg5uH', 5000000)
    .output('FA24PAtyZWWVAPm95ZCVpwyY6RYHeCMTiZt2v4VQAY8aBXMUZteF', 10000000)
    // Please note this line is to buy EntryCredit (see the address type) and the amount is in Factoshis like others (it is *not* the number of EntryCredit you are purchasing)
    .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e3QR', 10000)
    .build();

const requiredFees = tmpTx.computeRequiredFees(ecRate);

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

#### On fees

By default the library will reject a transaction over paying the minimum required fees by a factor 10 as it is most likely a user input error. If you wish to force the transaction to be accepted you can pass the `force` option to `sendTransaction`;

```javascript
// Transaction largely over paid
const transaction = Transaction.builder()
    .timestamp(now)
    .input('Fs28CkYaV5AVsmhiWZWupUVKF4sTe8eQcJvtQ5mpB6UnjquxnU3c', 99999999999999999)
    .output('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 12000)
    .build();

// Will throw an exception
await cli.sendTransaction(transaction);
// Set flag 'force' to true to bypass the over paying protection
await cli.sendTransaction(transaction, {force: true});
```

#### Unsigned transactions

##### Manual signature

If you build your Transaction using private Factoid addresses for inputs the library will take care for you to properly sign the transaction so that it's immediately ready to be submitted to the network. In some cases you may want to delegate the signature to another component (for instance an external cryptographic hardware storing your keys - such as Ledger device for instance): you will need to first build an unsigned transaction and later append the signatures and RCDs. The library will take care of validating the RCDs and signatures manually provided to guarantee the consistency and validity of the transaction.

```javascript
// You can create an unsigned transaction by using a public Factoid address for the inputs
const unsignedTx = Transaction.builder()
    .timestamp(now)
    .input('FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg4uH', 14000000)
    .output('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 5000000)
    .build();

console.log(unsignedTx.isSigned()); // false

// Delegate signature to an external component
const {rcd, signature} = getRcdSignatureFromSecureComponent(unsignedTx.marshalBinarySig());

// The builder below will copy timestamp, inputs and outputs. Then the RCD and signature are appended.
// When the transaction is built the library verifies the validity of the RCD and signature. (exception throw if any of them is invalid)
const signedTx = Transaction.builder(unsignedTx)
    .rcdSignature(rcd, signature)
    .build();
```

Side note: helper functions `getFactoidTransaction` and `getEntryCreditPurchaseTransaction` cannot generate unsigned transactions because they compute fees automatically and to do so need the complete transaction. Therefore if the user provides a public Factoid address as input for those functions the library will attempt to retrieve the corresponding private address from the wallet in order to build a signed transaction.

##### Fees computation

Knowledge about the RCDs and signatures is required to compute fees of a transaction (see section fees of [factom data structures doc](https://www.factom.com/devs/docs/guide/factom-data-structures)). You can still compute the fees of an unsigned transaction using the library by either:
* providing the length in bytes of the RCD reveal/signature section and the number of signatures (generic use case)

```javascript
tx.computeEcRequiredFees({rcdSignatureLength: 2 * (33 + 64), numberOfSignatures: 2});
tx.computeRequiredFees(ecRate, {rcdSignatureLength: 2 * (33 + 64), numberOfSignatures: 2});
```
* providing a single RCD type for the transaction (only works for RCD type 1 as of today)

```javascript
tx.computeEcRequiredFees({rcdType: 1});
tx.computeRequiredFees(ecRate, {rcdType: 1});
```

#### Transaction acknowledgement

`sendTransaction` options argument allows you to pass the timeout in seconds to wait for the transaction acknowledgement by the network (the timeout expired an exception is thrown). If not provided or set to 0, a default timeout value of 60s is used. You are free to set a lower or higher value. If you provide a negative value the acknowledgment will be disabled (no wait).

```javascript
// Wait transaction ack for up to 60s
const txId = await cli.sendTransaction(transaction);
// Wait transaction ack for up to 20s
const txId = await cli.sendTransaction(transaction, {timeout: 20});
// Disable wait for ack
const txId = await cli.sendTransaction(transaction, {timeout: -1});
```

#### Get Transaction

```javascript
const transaction = await cli.getTransaction(txId);
const transactionWithBlockContext = await cli.getTransactionWithBlockContext(txId);
/* 
    Output structure of transaction with block context: 

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
