const assert = require('chai').assert,
    { Entry } = require('../src/entry'),
    { FactomdCli } = require('../src/apis-cli'),
    { Transaction } = require('../src/transaction'),
    { DirectoryBlock, EntryCreditBlock, FactoidBlock, AdminBlock, EntryBlock } = require('../src/blocks'),
    get = require('../src/get');

const nconf = require('nconf').file({ file: `${__dirname}/config.json` });
const factomd = new FactomdCli({ host: nconf.get('factomd-host'), port: nconf.get('factomd-port') });

describe('Get information from Factom blockchain', function () {

    it('should get entry', async function () {
        this.timeout(5000);

        const entry = await get.getEntry(factomd, 'ec92aa51b34b992b3472c54ce005a3baf7fbdddd8bb6d786aad19304830559b0');

        assert.isUndefined(entry.timestamp);
        assert.isUndefined(entry.blockContext);
        assert.equal(entry.chainId.toString('hex'), 'e36c51b43d979f10792ab14d8b4e87f2870962e0bdb4d2c3cc5aba6c3fb4d7d2');
        assert.lengthOf(entry.extIds, 3);
        assert.equal(entry.extIds[0].toString(), 'PrimeNumbers.txt');
        assert.equal(entry.content.toString(), '53746, 662369, 12\r\n');
    });

    it('should get first entry', async function () {
        this.timeout(10000);

        const entry = await get.getFirstEntry(factomd, 'f48d2160c5d8178720d8c83b89a62599ab6a8b9dbec9fbece5229f787d1e8b44');

        assert.equal(entry.hashHex(), 'ed909db55c0abc861a5a164d1dac7be70ffd117e6f1545491e6a253764f52bb2');
        assert.equal(entry.extIds[0].toString(), 'factom-testnet-pioneers');
        // Entries retrieved via getFirstEntry should have a Block context
        assert.isNumber(entry.timestamp);
        assert.isObject(entry.blockContext);
    });

    it('should get entry with block context', async function () {
        this.timeout(15000);

        const entry = await get.getEntryWithBlockContext(factomd, 'caf017da212bb68ffee2ba645e1488e5834863743d50972dd3009eab2b93eb42');
        assertEntryWithBlockContext(entry);
    });

    it('should get all entries', async function () {
        this.timeout(20000);
        const entries = await get.getAllEntriesOfChain(factomd, 'f48d2160c5d8178720d8c83b89a62599ab6a8b9dbec9fbece5229f787d1e8b44');

        assert.isAtLeast(entries.length, 7);
        // Entries retrieved via getAllEntriesOfChain should have a Block context
        const entry = entries[1];
        assertEntryWithBlockContext(entry);
    });

    function assertEntryWithBlockContext(entry) {
        assert.equal(entry.hashHex(), 'caf017da212bb68ffee2ba645e1488e5834863743d50972dd3009eab2b93eb42');
        assert.equal(entry.timestamp, 1518286500000);
        assert.isObject(entry.blockContext);
        assert.equal(entry.blockContext.entryTimestamp, 1518286500);
        assert.equal(entry.blockContext.directoryBlockHeight, 7042);
        assert.equal(entry.blockContext.entryBlockTimestamp, 1518286440);
        assert.equal(entry.blockContext.entryBlockSequenceNumber, 1);
        assert.equal(entry.blockContext.entryBlockKeyMR, 'a13ac9df4153903f5a07093effe6434bdeb35fea0ff4bd402f323e486bea6ea4');
    }

    it('should get balance', async function () {
        this.timeout(5000);

        const ecBalance = await get.getBalance(factomd, 'EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD');
        const ecBalance2 = await get.getBalance(factomd, 'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym');
        const fctBalance = await get.getBalance(factomd, 'FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG');
        const fctBalance2 = await get.getBalance(factomd, 'Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X');

        assert.typeOf(ecBalance, 'number');
        assert.typeOf(ecBalance2, 'number');
        assert.typeOf(fctBalance, 'number');
        assert.typeOf(fctBalance2, 'number');
    });

    it('should get Transaction', async function () {
        this.timeout(5000);

        const transaction = await get.getTransaction(factomd, '63fe4275064427f11e0dcfc3ff2d56adf88ba12c2646bc0d03d03a02ff7d2727');

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.id, '63fe4275064427f11e0dcfc3ff2d56adf88ba12c2646bc0d03d03a02ff7d2727');
        assert.equal(transaction.timestamp, 1525490539106);
        assert.equal(transaction.totalInputs, 400012000);
        assert.equal(transaction.totalFactoidOutputs, 400000000);
        assert.equal(transaction.totalEntryCreditOutputs, 0);
        assert.equal(transaction.feesPaid, 12000);
        assert.lengthOf(transaction.inputs, 1);
        assert.lengthOf(transaction.factoidOutputs, 1);
        assert.lengthOf(transaction.entryCreditOutputs, 0);
        assert.equal(transaction.rcds[0].toString('hex'), '011bcb4c8a771c2869ddf554655414e56bdf360663f33960039a9aa43ac5820306')
        assert.equal(transaction.signatures[0].toString('hex'), '8a3f90a2b47efda21b801d2dc7f8dbbbfe9c0a65cb37aea4a998632ab7578aa965c8b5893f069030c4411a76dddc357270c0d835a31ea4fd34290a925d4c5501')
        assert.equal(transaction.inputs[0].address, 'FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg4uH');
        assert.equal(transaction.inputs[0].amount, 400012000);
        assert.equal(transaction.factoidOutputs[0].address, 'FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw');
        assert.equal(transaction.factoidOutputs[0].amount, 400000000);
        assert.isObject(transaction.blockContext);
        assert.equal(transaction.blockContext.directoryBlockHeight, 27618);
        assert.equal(transaction.blockContext.directoryBlockKeyMR, 'bb971007b95ac7474a573276d010cb0e7cf1d04bc93765c90e757f2555cc90e7');
        assert.equal(transaction.blockContext.factoidBlockKeyMR, 'bb622dc852a278ede8fbfd0144ae49d6576e621a1267932dfd198c2cea73b403');
    });

    it('should get coinbase Transaction', async function () {
        this.timeout(5000);

        const transaction = await get.getTransaction(factomd, '4099f0fe5ba3ccdccb0ee5e45f9d3d513bb9994c781acb54b49ae15d85f1e9d9');

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.id, '4099f0fe5ba3ccdccb0ee5e45f9d3d513bb9994c781acb54b49ae15d85f1e9d9');
        assert.equal(transaction.totalInputs, 0);
        assert.equal(transaction.totalFactoidOutputs, 640000000);
        assert.equal(transaction.totalEntryCreditOutputs, 0);
        assert.equal(transaction.feesPaid, 0);
        assert.lengthOf(transaction.inputs, 0);
        assert.lengthOf(transaction.factoidOutputs, 2);
        assert.lengthOf(transaction.entryCreditOutputs, 0);
        assert.equal(transaction.factoidOutputs[0].address, 'FA36vN5aQU2DAofpisurQhDSvx73MVatA53kSstTgcts8h2T9cvx');
        assert.equal(transaction.factoidOutputs[0].amount, 320000000);
    });

    it('should get heights', async function () {
        const heights = await get.getHeights(factomd);

        assert.isNumber(heights.directoryBlockHeight);
        assert.notEqual(heights.directoryBlockHeight, 0);
        assert.isNumber(heights.leaderHeight);
        assert.notEqual(heights.leaderHeight, 0);
        assert.isNumber(heights.entryBlockHeight);
        assert.notEqual(heights.entryBlockHeight, 0);
        assert.isNumber(heights.entryHeight);
        assert.notEqual(heights.entryHeight, 0);
    });

    function assertDirectoryBlock(db) {
        assert.instanceOf(db, DirectoryBlock);
        assert.equal(db.keyMR, 'f55a19d9562843b642f1a20b34fcbb71e70f438c4d98d223fc2228ca2dd0c54a');
        assert.equal(db.height, 21537);
        assert.equal(db.previousBlockKeyMR, 'b37bf4eee21547773c74fa099c643588835e4ada9a4a8c22f0dd171e22710bf5');
        assert.equal(db.timestamp, 1521348840);
        assert.equal(db.adminBlockRef, '643f3a4f0a5fd7a44374affe47fd052a845a078482319ad6540aa7f1f714bb9e');
        assert.equal(db.entryCreditBlockRef, 'f4540b4170666a47b1287c4d0843b91d5a0ebcf8433c40b674d017f146503256');
        assert.equal(db.factoidBlockRef, 'baf6e92932f4ba0f81baacf7b7d7726d6f7f3a4da0c43bfdaf846a843c8f2301');
        assert.lengthOf(db.entryBlockRefs, 23);
    }

    it('should get Directory Block', async function () {
        this.timeout(5000);

        const byKeyMR = await get.getDirectoryBlock(factomd, 'f55a19d9562843b642f1a20b34fcbb71e70f438c4d98d223fc2228ca2dd0c54a');
        assertDirectoryBlock(byKeyMR);

        const byHeight = await get.getDirectoryBlock(factomd, 21537);
        assertDirectoryBlock(byHeight);

        assert.equal(byHeight.fullHash, 'd435f58a88eb9967e8be864af7015a9a01a50f716181a8bee5e86593bc4a0f8d');
        assert.equal(byHeight.previousFullHash, 'f0dc9915ff0db78648a8366a1768332c74d28913f3ae4699d4fab7dc6d935b31');
        assert.equal(byHeight.bodyKeyMR, '6243865ba04b031423a2d6b48335c571b48499e71b7630f233e885f832bfdd30');
    });

    function assertEntryCreditBlock(ecb) {
        assert.instanceOf(ecb, EntryCreditBlock);
        assert.equal(ecb.fullHash, '4cf58af96b2dcdf416217cbdb195d67f1a511a8ab95a8e37aebeb8e643cb8f3c');
        assert.equal(ecb.headerHash, '96ad20412e7799e80f3979c425bfa5641282563371cd40049492701f9c09e338');
        assert.equal(ecb.bodyHash, 'd9b5f08c5002bfa70c7b98a61c02eddaa3544299eb498840641b3a9e6d771bda');
        assert.equal(ecb.previousFullHash, 'ae8ab99b07b9d367a36f8a54fe0020532fbb20c71f65dfa2dacdee5bceb1b332');
        assert.equal(ecb.previousHeaderHash, '48ff34b7bf9807e59e07c2c3d9a96c2442fcde8446952b258223b65b4d75190b');
        assert.equal(ecb.directoryBlockHeight, 17997);
        assert.equal(ecb.headerExpansionArea, '');
        assert.equal(ecb.bodySize, 11939);
        assert.equal(ecb.objectCount, 97);
        assert.lengthOf(ecb.commits, 87);
        assert.lengthOf(ecb.minuteIndexes, 11);
    }

    it('should get Entry Credit Block', async function () {
        this.timeout(5000);

        const byHeaderHash = await get.getEntryCreditBlock(factomd, '96ad20412e7799e80f3979c425bfa5641282563371cd40049492701f9c09e338');
        assertEntryCreditBlock(byHeaderHash);

        const byHeight = await get.getEntryCreditBlock(factomd, 17997);
        assertEntryCreditBlock(byHeight);
    });

    function assertFactoidBlock(fb) {
        assert.instanceOf(fb, FactoidBlock);
        assert.equal(fb.keyMR, 'e0715c82f88423a5ce23eb4c8d71700f3dacc5e557adea4d166f5c51683c950a');
        assert.equal(fb.previousBlockKeyMR, '9b7083a4f428019de3bd12c0c84ffd9ec5767878047aba0d65f2886e5516f86c');
        assert.equal(fb.bodyMR, 'd2e2151814cd4a1bbe12e65e8720583118c0594f6ad1e84db096e1c8bffde9ec');
        assert.equal(fb.entryCreditRate, 1000);
        assert.equal(fb.directoryBlockHeight, 21658);
        assert.equal(fb.ledgerKeyMR, '5429704740e3dad6e05f2aca56bf350b647f7612911919d9356d2e9a8d0e58fa');
        assert.equal(fb.previousLedgerKeyMR, '9c3063e4f450227c031f18b9caf6803ae267f27a96bf97b15c734ddf36f4cc9a');
        assert.lengthOf(fb.transactions, 1);

    }

    it('should get Factoid Block', async function () {
        this.timeout(5000);

        const byKeyMR = await get.getFactoidBlock(factomd, 'e0715c82f88423a5ce23eb4c8d71700f3dacc5e557adea4d166f5c51683c950a');
        assertFactoidBlock(byKeyMR);

        const byHeight = await get.getFactoidBlock(factomd, 21658);
        assertFactoidBlock(byHeight);
    });

    it('should get Entry Block', async function () {
        this.timeout(5000);

        const eb = await get.getEntryBlock(factomd, '3944669331eea620f7f3ec67864a03a646a104f17e36aec3e0f5bdf638f16883');

        assert.instanceOf(eb, EntryBlock);
        assert.equal(eb.keyMR, '3944669331eea620f7f3ec67864a03a646a104f17e36aec3e0f5bdf638f16883');
        assert.equal(eb.previousBlockKeyMR, '1af04b34c3a0113d14aa0fcbb8c609864fa2e8f24dd04e9814aa7e5a40376a70');
        assert.equal(eb.timestamp, 1521429840);
        assert.equal(eb.directoryBlockHeight, 21672);
        assert.equal(eb.chainId, '3f69bdf3b4769ff53407580b882ee01e0c365f6deffba4ed8d4651b24e65389a');
        assert.equal(eb.sequenceNumber, 1168);
        assert.lengthOf(eb.entryRefs, 50);

    });

    function assertAdminBlock(ab) {
        assert.instanceOf(ab, AdminBlock);
        assert.equal(ab.backReferenceHash, 'd6d21564d9b1b1e55fa308890821ed4151ded40a33cb3cf8edaecf2b63e32236');
        assert.equal(ab.lookupHash, 'c98beb0b3cbfbb090acdd238ca17725119eb43f1df5ef117ffbdc59f050508e6');
        assert.equal(ab.previousBackReferenceHash, 'a24beb7bcd0d47857fcd0b570ea3c16704daf3377d9b9588c6305e9271539eea');
        assert.equal(ab.directoryBlockHeight, 21662);
        assert.equal(ab.headerExpansionArea, '');
        assert.equal(ab.headerExpansionSize, 0);
        assert.equal(ab.bodySize, 387);
        assert.lengthOf(ab.entries, 3);
    }

    it('should get Admin Block', async function () {
        this.timeout(5000);

        const byHash = await get.getAdminBlock(factomd, 'c98beb0b3cbfbb090acdd238ca17725119eb43f1df5ef117ffbdc59f050508e6');
        assertAdminBlock(byHash);

        const byHeight = await get.getAdminBlock(factomd, 21662);
        assertAdminBlock(byHeight);
    });

    // TODO: fragile test, should be set up against local factomd rather than testnet
    it('should rewind chain entry by entry (forEach)', async function () {
        this.timeout(20000);

        let counter = 0;
        await get.rewindChainWhile(factomd, '106fa1e435be6cff0e167da35a186b141e4dfcea204e1500bf694c88b9214f68', () => true, function (entry) {
            assert.instanceOf(entry, Entry);
            counter++;
        });
        assert.equal(counter, 5);
    });

    it('should not rewind chain ', async function () {
        this.timeout(20000);

        await get.rewindChainWhile(factomd, '106fa1e435be6cff0e167da35a186b141e4dfcea204e1500bf694c88b9214f68', () => false, function () {
            throw new Error('Should not be entered');
        });
    });

    // TODO: fragile test, should be set up against local factomd rather than testnet
    it('should rewind chain and find entry', async function () {
        this.timeout(20000);

        let search = true, found, counter = 0;
        await get.rewindChainWhile(factomd, '106fa1e435be6cff0e167da35a186b141e4dfcea204e1500bf694c88b9214f68', () => search, function (entry) {
            counter++;
            if (entry.content.toString('hex') === '0b70b3b0fd865bd903461bf8f3d9cd782ebfa92e26238079eaf58bbdf2b4a1c0') {
                found = entry;
                search = false;
            }
        });

        assert.equal(counter, 3);
        assert.equal(found.hash().toString('hex'), '0ef649d17f4f1e961a0e5d0d7f294ae151253d72564958763821aee1dc6ac37f');
    });

});