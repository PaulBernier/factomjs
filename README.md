# Factom.js

[![npm version](https://badge.fury.io/js/factom.svg)](https://badge.fury.io/js/factom)
[![Build Status](https://travis-ci.com/PaulBernier/factomjs.svg?branch=master)](https://travis-ci.com/PaulBernier/factomjs)
[![Coverage Status](https://coveralls.io/repos/github/PaulBernier/factomjs/badge.svg?branch=master)](https://coveralls.io/github/PaulBernier/factomjs?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/PaulBernier/factomjs/badge.svg?targetFile=package.json)](https://snyk.io/test/github/PaulBernier/factomjs?targetFile=package.json)

Factom.js is a library to easily build applications on the Factom blockchain.

-   Provides higher level functionalities than factomd API making it a breeze to create chains or entries, send transactions...
-   Provides uniform, consistent and easy to use Factom data structures.
-   Provides a range of util functions to manipulate Factom addresses.

## Installation

```bash
$ npm install --save factom
```

## Documentation and changelog

The complete documentation of the library is available in Markdown format in the `docs` directory or online in web format at [https://factomjs.luciap.ca](https://factomjs.luciap.ca).

A changelog is available in the file `changelog.md`.

## Web browser

Two versions of _factom.js_ are being bundled for usage in a web browser and can be found in the `dist` folder. `dist/factom.js` is a bundle containing all the exposed components of the library. `dist/factom-struct.js` is a lighter bundle that contains factom structures such as Entry, Chain and Transaction, and all the utily functions related to FCT/EC addresses and fundamental constants. `factom-struct` bundle doesn't include any component that makes API calls.

```javascript
import { isValidPrivateAddress, isValidPrivateEcAddress } from 'factom/dist/factom-struct';
import { FactomCli } from 'factom/dist/factom';
```

## Usage

We recommend you have a look at the [tutorial on the developer portal of the Factom protocol](https://developers.factomprotocol.org/start/hello-world-examples/javascript).

**Important:** please note than whenever a private (Entry Credit or Factoid) address is needed in this library (typically for signing data), you can either provide a private address or a public address as an argument. If you provide a public address the library will attempt to retrieve the corresponding private address from the wallet. Thus providing private address as arguments allow you to not have to run walletd.

### Instantiate FactomCli

```javascript
const { FactomCli } = require('factom');

// Default factomd connection to localhost:8088
// and walletd connection to localhost:8089
const cli = new FactomCli();

// You can override factomd connection parameters and retry strategy
const cli = new FactomCli({
    host: '52.202.51.228',
    port: 8088,
    path: '/v2', // Path to V2 API. Default to /v2
    debugPath: '/debug', // Path to debug API. Default to /debug
    user: 'paul', // RPC basic authentication
    password: 'pwd',
    protocol: 'http', // http or https. Default to http
    rejectUnauthorized: true, // Set to false to allow connection to a node with a self-signed certificate
    timeout: 5000, // Timeout of individual requests
    retry: {
        retries: 3,
        factor: 2,
        minTimeout: 500,
        maxTimeout: 2000
    }
});

// You can also override both factomd and walletd options
const cli = new FactomCli({
    factomd: {
        host: '52.202.51.228',
        port: 8088
    },
    walletd: {
        host: '52.202.51.228',
        port: 8089
    }
});
```

### Chains and Entries

#### Add a Chain

```javascript
const { Entry, Chain } = require('factom');
const firstEntry = Entry.builder()
    .extId('6d79206578742069642031') // If no encoding parameter is passed as 2nd argument, 'hex' is used
    .extId('my ext id 1', 'utf8') // Explicit the encoding. Or you can pass directly a Buffer
    .content('Initial content', 'utf8')
    .build();

const chain = new Chain(firstEntry);
cli.add(chain, 'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym');
```

#### Add an entry

```javascript
const { Entry } = require('factom');
const myEntry = Entry.builder()
    .chainId('9107a308f91fd7962fecb321fdadeb37e2ca7d456f1d99d24280136c0afd55f2')
    .extId('6d79206578742069642031') // If no encoding parameter is passed as 2nd argument, 'hex' is used
    .extId('some external ID', 'utf8')
    .content('My new content', 'utf8')
    .build();
cli.add(myEntry, 'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym');
```

```javascript
// Add multiples entries.
// The library will limit the number of concurrent Promises to 200 by default to avoid overwhelming the factomd instance.
cli.add([entry1, entry2], 'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym');

// The concurrency limit can be customized.
cli.add([entry1, entry2], 'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym', {
    concurrency: 1
});
```

#### Commit/reveal acknowledgment when submitting chains or entries

Factom protocol uses a [commit/reveal commitment scheme](https://en.wikipedia.org/wiki/Commitment_scheme). By default when using `add` the library will sequentially wait for an acknowledgment (ack) of the commit by the network and then wait for the ack of the reveal, both for up to 60s. The library allows you to customize the timeouts of those acks and also to not wait for the acks at all when creating a Chain or an Entry. Please read [Factom whitepaper](https://www.factom.com/devs/docs/guide/factom-white-paper-1-0) about commit/reveal scheme and what are the potential risks to not wait for network acknowledgments.

```javascript
// Default behavior waits for both commit and reveal up to 60s
cli.add(myEntry, 'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym');
// Change the timeout for commit ack to 120s and the timeout for reveal ack to 20s
cli.add(myEntry, 'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym', {
    commitTimeout: 120,
    revealTimeout: 20
});
// By providing a negative number the library will not wait for any acknowledgment.
// In below example the wait on reveal ack is disabled (it'll still wait up to 60s on the commit ack).
cli.add(myEntry, 'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym', { revealTimeout: -1 });
```

#### Repeated commit

If you commit twice an entry or a chain and that the second time the fees paid are lower or equal to the first commit you are in a 'repeated commit' case and the second commit will be rejected (and you won't be charged for it). If this scenario happens the output of `add` will have the field `repeatedCommit` set to `true` and the field `txId` will be undefined. See [Factom doc](https://docs.factom.com/api#repeated-commit).

#### Getting entries and block context

The simplest and fastest way to retrieve an Entry is to query it by its hash.

```javascript
cli.getEntry('caf017da212bb68ffee2ba645e1488e5834863743d50972dd3009eab2b93eb42');
```

You may notice that the entry returned doesn't have a timestamp populated. That's because the timestamp is actually stored in the Entry Block that contains this Entry. The library offers a convenient way to also retrieve that information:

```javascript
cli.getEntryWithBlockContext('caf017da212bb68ffee2ba645e1488e5834863743d50972dd3009eab2b93eb42');
```

The entry returned will have its timestamp populated and an additional `blockContext` field that is structured as follow:

```javascript
// Note that the timestamps here are in epoch seconds whereas the timestamp attribute of the Entry itself is in timestamp milliseconds
{ entryTimestamp: 1518286500,
  directoryBlockHeight: 7042,
  entryBlockTimestamp: 1518286440,
  entryBlockSequenceNumber: 1,
  entryBlockKeyMR: 'a13ac9df4153903f5a07093effe6434bdeb35fea0ff4bd402f323e486bea6ea4' }
```

Besides `getEntryWithBlockContext` entries returned by `getFirstEntry` and `getAllEntriesOfChain` also have a `timestamp` and `blockContext` populated.

#### Iterating entries of a chain

The FactomCli method `getAllEntriesOfChain` fetches all the entries of the chain before returning the result: in case of long chains in can be impractical. In some cases you may want to iterate only through a portion of the chain. For those cases FactomCli exposes the method `rewindChainWhile(chainId, function predicate(entry) {}, function body(entry) {})` that iterates a chain from the most recent entry to the oldest one as long as the `predicate` function returns true and that the end of the chain has not been reached. At each iteration the `body` function is called with the current entry as its argument.

_Example 1. Iterating a long chain entry by entry_

```javascript
await cli.rewindChainWhile('caf017da212bb68ffee2ba645e1488e5834863743d50972dd3009eab2b93eb42',
    () => true,
    entry => // Process entry
```

_Example 2. Searching an entry in a chain_

```javascript
let search = true,
    found;
await cli.rewindChainWhile(
    'caf017da212bb68ffee2ba645e1488e5834863743d50972dd3009eab2b93eb42',
    () => search,
    function(entry) {
        if (entry.extId[0].toString() === 'Find me!') {
            search = false;
            found = entry;
        }
    }
);
```

### Addresses

Factom.js offers a bunch of util functions around FCT/EC addresses and cryptographic keys, namely:

```javascript
const {
    isValidAddress,
    addressToKey, // For EC, Es, Fs addresse
    addressToRcdHash, // For FA addresses
    isValidPublicAddress,
    isValidPrivateAddress,
    isValidEcAddress,
    isValidPublicEcAddress,
    isValidPrivateEcAddress,
    isValidFctAddress,
    isValidPublicFctAddress,
    isValidPrivateFctAddress,
    getPublicAddress,
    keyToPublicFctAddress,
    rcdHashToPublicFctAddress,
    seedToPrivateFctAddress,
    keyToPublicEcAddress,
    seedToPrivateEcAddress,
    generateRandomFctAddress,
    generateRandomEcAddress
} = require('factom');
```

### Transactions

#### Transaction object

Note that all the amounts are in factoshis (10^-8 Factoids).

```javascript
Transaction {
    timestamp: 1527092064498,
    inputs: [TransactionAddress {
        address: 'FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg4uH',// Paying FCT address
        amount: 12000, // Amount in factoshis
        rcdHash: < Buffer fb cc 9 b c3 02 cc b8 c3 0 c 69 0 c 70 e4 12 f0 05 53 cc f8 5e 4 b 6 c 2 a b6 0e ce db 12 fe 9 d fe aa >
    }],
    factoidOutputs: [TransactionAddress {
        address: 'FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw',// Receiving FCT address
        amount: 1, // Amount in factoshis
        rcdHash: < Buffer d9 54 88 34 81 f3 aa 50 1 f 3 f 5 d 4 f 9e 79 6 b af e8 aa 01 bf e8 97 80 77 1e 73 3 d 63 96 f8 fb 9 b >
    }],
    entryCreditOutputs: [TransactionAddress {
        address: 'EC3MVTBYTo2Y1HrEKxeEGfNNoKhLZ9ZYQhb26zQUzngJ6SLUVRX9',// Receiving EC address
        amount: 10000, // Amount in factoshis
        rcdHash: < Buffer d1 aa eb 70 6 c 79 47 5 d b8 8e 01 d9 e4 17 e7 83 2 b 20 df 5 c c6 fd a6 7 f 09 b8 8 b 89 36 64 2 a 9 f >
    }],
    marshalBinarySig: < Buffer 02 01 63 8 d c7 b0 f2 01 01 01 dd 60 fb cc 9 b c3 02 cc b8 c3 0 c 69 0 c 70 e4 12 f0 05 53 cc f8 5e 4 b 6 c 2 a b6 0e ce db 12 fe 9 d fe aa 01 d9 54 88 34 81... > ,
    id: '40dee7fde9747e4b4a8e9d4685c64044d1a7513734f6adf63698b1533b57461d',

    rcds: [ < Buffer 01 1 b cb 4 c 8 a 77 1 c 28 69 dd f5 54 65 54 14 e5 6 b df 36 06 63 f3 39 60 03 9 a 9 a a4 3 a c5 82 03 06 > ],
    signatures: [ < Buffer 4 b d5 bc 2 a 4 d e0 a0 06 2 b 30 28 d3 34 90 31 f7 e4 93 5e a2 6 a db 20 f1 0e c8 92 9 c db 7e 62 f2 c4 9 b 0 f 14 e5 cd 6 d fe 28 22 1e c1 9 a bb 32 aa 70 83... > ],

    totalInputs: 12000, // Sum of all the inputs in factoshis
    totalFactoidOutputs: 1, // Sum of all factoid outputs in factoshis
    totalEntryCreditOutputs: 10000, // Sum of all entry credit outputs in factoshis
    feesPaid: 11999 // Fees paid by this transaction in factoshis
}

```

#### Simple Factoid transaction

```javascript
// Send 1000000 Factoshis (10^-8 Factoids) from Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X
// to FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw
const transaction = await cli.createFactoidTransaction(
    'Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X',
    'FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw',
    1000000
);
// You can check the additional fees that you are going to pay for the transaction to go through
// (automatically set to the minimum acceptable by the network)
console.log(transaction.feesPaid);
// Send the transaction
const txId = await cli.sendTransaction(transaction);
```

#### Buy EntryCredit

```javascript
// Buy 10 EC with address Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X and credited
// to EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR
const transaction = await cli.createEntryCreditPurchaseTransaction(
    'Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X',
    'EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR',
    10
);
// You can check how many Factoshis it's going to cost you to buy those 10 EC
console.log(transaction.totalInputs);
const txId = await cli.sendTransaction(transaction);
```

#### Multi inputs/outputs transaction

For multi inputs/outputs you have to build your Transaction object yourself and set the fees manually.

```javascript
const { Transaction } = require('factom');

const ecRate = await cli.getEntryCreditRate();
const tmpTx = Transaction.builder()
    .input('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X', 14000000)
    .input('Fs2E6iXCLAKDiPqVtfxtuQCKsTe7o6DJFDnht1wST53s4ibtdu9f', 1010000)
    .output('FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg5uH', 5000000)
    .output('FA24PAtyZWWVAPm95ZCVpwyY6RYHeCMTiZt2v4VQAY8aBXMUZteF', 10000000)
    // Note the line below is to buy Entry Credits (see the address type) and the amount is in Factoshis like other outputs:
    // it is *not* the number of Entry Credits you are purchasing.
    .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e3QR', 10000)
    .build();

const requiredFees = tmpTx.computeRequiredFees(ecRate);

// Now that you know the required fees for your transaction you are free to add to any inputs or substract it from any outputs
const transaction = Transaction.builder()
    .input('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X', 14000000)
    .input('Fs2E6iXCLAKDiPqVtfxtuQCKsTe7o6DJFDnht1wST53s4ibtdu9f', 1010000 + requiredFees)
    .output('FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg5uH', 5000000)
    .output('FA24PAtyZWWVAPm95ZCVpwyY6RYHeCMTiZt2v4VQAY8aBXMUZteF', 10000000)
    .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e3QR', 10000)
    .build();

const txId = await cli.sendTransaction(transaction);
```

#### On fees

By default the library will reject a transaction over paying the minimum required fees by a factor 10 as it is most likely a user input error. If you wish to force the transaction to be accepted you can pass the `force` option to `sendTransaction`;

```javascript
const { Transaction } = require('factom');
// Transaction largely over paid
const transaction = Transaction.builder()
    .timestamp(now)
    .input('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X', 99999999999999999)
    .output('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 12000)
    .build();

// Will throw an exception
await cli.sendTransaction(transaction);
// Set flag 'force' to true to bypass the over paying protection
await cli.sendTransaction(transaction, { force: true });
```

#### Unsigned transactions

##### Manual signature

If you build your Transaction using private Factoid addresses for inputs the library will take care for you to properly sign the transaction so that it's immediately ready to be submitted to the network. In some cases you may want to delegate the signature to another component (for instance an external cryptographic hardware storing your keys - such as Ledger device for instance): you will need to first build an unsigned transaction and later append the signatures and RCDs. The library will take care of validating the RCDs and signatures manually provided to guarantee the consistency and validity of the transaction.

```javascript
const { Transaction } = require('factom');
// You can create an unsigned transaction by using a public Factoid address for the inputs
const unsignedTx = Transaction.builder()
    .timestamp(now)
    .input('FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg4uH', 14000000)
    .output('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 5000000)
    .build();

console.log(unsignedTx.isSigned()); // false

// Delegate signature to an external component
const { rcd, signature } = getRcdSignatureFromSecureComponent(unsignedTx.marshalBinarySig());

// The builder below will copy timestamp, inputs and outputs. Then the RCD and signature are appended.
// When the transaction is built the library verifies the validity of the RCD and signature. (exception throw if any of them is invalid)
const signedTx = Transaction.builder(unsignedTx)
    .rcdSignature(rcd, signature)
    .build();
```

Side note: helper functions `createFactoidTransaction` and `createEntryCreditPurchaseTransaction` cannot generate unsigned transactions because they compute fees automatically and to do so need the complete transaction. Therefore if the user provides a public Factoid address as input for those functions the library will attempt to retrieve the corresponding private address from the wallet in order to build a signed transaction.

##### Fees computation

Knowledge about the RCDs and signatures is required to compute fees of a transaction (see section fees of [factom data structures doc](https://www.factom.com/devs/docs/guide/factom-data-structures)). You can still compute the fees of an unsigned transaction using the library by either:

-   providing the length in bytes of the RCD reveal/signature section and the number of signatures (generic use case)

```javascript
tx.computeEcRequiredFees({ rcdSignatureLength: 2 * (33 + 64), numberOfSignatures: 2 });
tx.computeRequiredFees(ecRate, { rcdSignatureLength: 2 * (33 + 64), numberOfSignatures: 2 });
```

-   providing a single RCD type for the transaction (only works for RCD type 1 as of today)

```javascript
tx.computeEcRequiredFees({ rcdType: 1 });
tx.computeRequiredFees(ecRate, { rcdType: 1 });
```

#### Transaction acknowledgement

`sendTransaction` options argument allows you to pass the timeout in seconds to wait for the transaction acknowledgement by the network (the timeout expired an exception is thrown). If not provided or set to 0, a default timeout value of 60s is used. You are free to set a lower or higher value. If you provide a negative value the acknowledgment will be disabled (no wait).

```javascript
// Wait transaction ack for up to 60s
const txId = await cli.sendTransaction(transaction);
// Wait transaction ack for up to 20s
const txId = await cli.sendTransaction(transaction, { timeout: 20 });
// Disable wait for ack
const txId = await cli.sendTransaction(transaction, { timeout: -1 });
```

#### Get existing Transaction

```javascript
const transaction = await cli.getTransaction(txId);
```

Transactions retrieved via `getTransaction` have an addition field `blockContext` that has the following structure:

```javascript
   { factoidBlockKeyMR: '9954300904152e688c52306c7cd86d1f1b96ec35be5da29541b0e3c24e3be306',
     directoryBlockKeyMR: 'c2e9a3f643683a093349f43bdbc11122f3b26aebfed6efc410e670f77c8419fa',
     directoryBlockHeight: 27735 }
```

### Blocks

```javascript
const db = await cli.getDirectoryBlock(
    'f55a19d9562843b642f1a20b34fcbb71e70f438c4d98d223fc2228ca2dd0c54a'
);
const ecb = await cli.getEntryCreditBlock(db.entryCreditBlockRef);
const fb = await cli.getFactoidBlock(db.factoidBlockRef);
const ab = await cli.getAdminBlock(db.entryCreditBlockRef);
const eb = await cli.getEntryBlock(db.entryBlockRefs[0]);
```

### Raw Factomd and Walletd API calls

```javascript
// First argument is the API method name, followed by the params object for that API
// Check https://docs.factom.com/api for the details of APIs
cli.factomdApi('directory-block', {
    keymr: 'faf2a058cc475c5cb8ec13e8ba979118f7cde9db38bcfeb7e35744bcf5f6134b'
});
// It also supports factomd debug API calls
cli.factomdApi('federated-servers');
cli.walletdApi('address', { address: 'FA2jK2HcLnRdS94dEcU27rF3meoJfpUcZPSinpb7AwQvPRY6RL1Q' });
```

You can also directly instanciate a FactomdCli or WalletdCli.

```javascript
const { FactomdCli, WalletdCli } = require('factom');
// Options of connection and retry strategy can be passed to the construtor the same way as FactomCli
const factomd = new FactomdCli();
const walletd = new WalletdCli();
factomd.call('directory-block', {
    keymr: 'faf2a058cc475c5cb8ec13e8ba979118f7cde9db38bcfeb7e35744bcf5f6134b'
});
walletd.call('address', { address: 'FA2jK2HcLnRdS94dEcU27rF3meoJfpUcZPSinpb7AwQvPRY6RL1Q' });
```

## Factom Event Emitter

`FactomEventEmitter` emits various blockchain events.

```javascript
const { FactomCli, FactomEventEmitter } = require('factom');
const cli = new FactomCli();
// Poll the blockchain every 10s
const emitter = new FactomEventEmitter(cli, { interval: 10000 });
emitter.on('newDirectoryBlock', (directoryBlock) => ...);
emitter.on('newFactoidBlock', (factoidBlock) => ...);
emitter.on('newAdminBlock', (adminBlock) => ...);
emitter.on('newEntryCreditBlock', (entryCreditBlock) => ...);
emitter.on('newChain', (entryBlock) => ...);
// Listen to any transaction involving a given Factoid address
emitter.on('FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC', (transaction) => ...);
// Listen to any new entries in a given chain
emitter.on('4060c0192a421ca121ffff935889ef55a64574a6ef0e69b2b4f8a0ab919b2ca4', (entryBlock) => ...);
// Listen to any pending transactions involving a given Factoid address
emitter.on(FactomEventEmitter.getSubscriptionToken({
  eventType: 'newPendingTransaction', address: 'FA29eyMVJaZ2tbGqJ3M49gANaXMXCjgfKcJGe5mx8p4iQFCvFDAC'
}), (pendingTransaction) => ...);
```

## Running tests

The integration tests of the library have been built against the Factom Community Testnet network. You need to set a few environment variables in order to properly run those tests. To do so you can create a `.env` file at the root of the project and populate the following variables:

```
EC_PRIVATE_ADDRESS=Es...
FACTOMD_HOST=54.11.122.3
FACTOMD_PORT=8088
FCT_PRIVATE_ADDRESS=Fs...
```

The values must be valid for the Factom Community Testnet. The EC and FCT addresses need to be funded in order for the tests to pass.

Then to run all the tests:

```javascript
npm test
```
