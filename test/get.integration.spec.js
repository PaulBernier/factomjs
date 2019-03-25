const assert = require('chai').assert,
    { Entry } = require('../src/entry'),
    { FactomdCli } = require('../src/apis-cli'),
    { Transaction } = require('../src/transaction'),
    {
        DirectoryBlock,
        EntryCreditBlock,
        FactoidBlock,
        AdminBlock,
        EntryBlock
    } = require('../src/blocks'),
    get = require('../src/get');

require('dotenv').config();
const factomd = new FactomdCli({
    host: process.env.FACTOMD_HOST,
    port: process.env.FACTOMD_PORT
});

describe('Get information from Factom blockchain', function() {
    it('should get entry', async function() {
        this.timeout(5000);

        const entry = await get.getEntry(
            factomd,
            'ec92aa51b34b992b3472c54ce005a3baf7fbdddd8bb6d786aad19304830559b0'
        );

        assert.isUndefined(entry.timestamp);
        assert.isUndefined(entry.blockContext);
        assert.strictEqual(
            entry.chainId.toString('hex'),
            'e36c51b43d979f10792ab14d8b4e87f2870962e0bdb4d2c3cc5aba6c3fb4d7d2'
        );
        assert.lengthOf(entry.extIds, 3);
        assert.strictEqual(entry.extIds[0].toString(), 'PrimeNumbers.txt');
        assert.strictEqual(entry.content.toString(), '53746, 662369, 12\r\n');
    });

    it('should get first entry', async function() {
        this.timeout(20000);

        const entry = await get.getFirstEntry(
            factomd,
            'f48d2160c5d8178720d8c83b89a62599ab6a8b9dbec9fbece5229f787d1e8b44'
        );

        assert.strictEqual(
            entry.hashHex(),
            'ed909db55c0abc861a5a164d1dac7be70ffd117e6f1545491e6a253764f52bb2'
        );
        assert.strictEqual(entry.extIds[0].toString(), 'factom-testnet-pioneers');
        // Entries retrieved via getFirstEntry should have a Block context
        assert.isNumber(entry.timestamp);
        assert.isObject(entry.blockContext);
    });

    it('should get entry with block context', async function() {
        this.timeout(15000);

        const entry = await get.getEntryWithBlockContext(
            factomd,
            'caf017da212bb68ffee2ba645e1488e5834863743d50972dd3009eab2b93eb42'
        );
        assertEntryWithBlockContext(entry);
    });

    it('should get all entries', async function() {
        this.timeout(20000);
        const entries = await get.getAllEntriesOfChain(
            factomd,
            'f48d2160c5d8178720d8c83b89a62599ab6a8b9dbec9fbece5229f787d1e8b44'
        );

        assert.isAtLeast(entries.length, 7);
        // Entries retrieved via getAllEntriesOfChain should have a Block context
        const entry = entries[1];
        assertEntryWithBlockContext(entry);
    });

    function assertEntryWithBlockContext(entry) {
        assert.strictEqual(
            entry.hashHex(),
            'caf017da212bb68ffee2ba645e1488e5834863743d50972dd3009eab2b93eb42'
        );
        assert.strictEqual(entry.timestamp, 1518286500000);
        assert.isObject(entry.blockContext);
        assert.strictEqual(entry.blockContext.entryTimestamp, 1518286500);
        assert.strictEqual(entry.blockContext.directoryBlockHeight, 7042);
        assert.strictEqual(entry.blockContext.entryBlockTimestamp, 1518286440);
        assert.strictEqual(entry.blockContext.entryBlockSequenceNumber, 1);
        assert.strictEqual(
            entry.blockContext.entryBlockKeyMR,
            'a13ac9df4153903f5a07093effe6434bdeb35fea0ff4bd402f323e486bea6ea4'
        );
    }

    it('should get balance', async function() {
        this.timeout(5000);

        const ecBalance = await get.getBalance(
            factomd,
            'EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD'
        );
        const ecBalance2 = await get.getBalance(
            factomd,
            'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym'
        );
        const fctBalance = await get.getBalance(
            factomd,
            'FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG'
        );
        const fctBalance2 = await get.getBalance(
            factomd,
            'Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X'
        );

        assert.typeOf(ecBalance, 'number');
        assert.typeOf(ecBalance2, 'number');
        assert.typeOf(fctBalance, 'number');
        assert.typeOf(fctBalance2, 'number');
    });

    it('should get Transaction', async function() {
        this.timeout(5000);

        const transaction = await get.getTransaction(
            factomd,
            '63fe4275064427f11e0dcfc3ff2d56adf88ba12c2646bc0d03d03a02ff7d2727'
        );

        assert.instanceOf(transaction, Transaction);
        assert.strictEqual(
            transaction.id,
            '63fe4275064427f11e0dcfc3ff2d56adf88ba12c2646bc0d03d03a02ff7d2727'
        );
        assert.strictEqual(transaction.timestamp, 1525490539106);
        assert.strictEqual(transaction.totalInputs, 400012000);
        assert.strictEqual(transaction.totalFactoidOutputs, 400000000);
        assert.strictEqual(transaction.totalEntryCreditOutputs, 0);
        assert.strictEqual(transaction.feesPaid, 12000);
        assert.lengthOf(transaction.inputs, 1);
        assert.lengthOf(transaction.factoidOutputs, 1);
        assert.lengthOf(transaction.entryCreditOutputs, 0);
        assert.strictEqual(
            transaction.rcds[0].toString('hex'),
            '011bcb4c8a771c2869ddf554655414e56bdf360663f33960039a9aa43ac5820306'
        );
        assert.strictEqual(
            transaction.signatures[0].toString('hex'),
            '8a3f90a2b47efda21b801d2dc7f8dbbbfe9c0a65cb37aea4a998632ab7578aa965c8b5893f069030c4411a76dddc357270c0d835a31ea4fd34290a925d4c5501'
        );
        assert.strictEqual(
            transaction.inputs[0].address,
            'FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg4uH'
        );
        assert.strictEqual(transaction.inputs[0].amount, 400012000);
        assert.strictEqual(
            transaction.factoidOutputs[0].address,
            'FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw'
        );
        assert.strictEqual(transaction.factoidOutputs[0].amount, 400000000);
        assert.isObject(transaction.blockContext);
        assert.strictEqual(transaction.blockContext.directoryBlockHeight, 27618);
        assert.strictEqual(
            transaction.blockContext.directoryBlockKeyMR,
            'bb971007b95ac7474a573276d010cb0e7cf1d04bc93765c90e757f2555cc90e7'
        );
        assert.strictEqual(
            transaction.blockContext.factoidBlockKeyMR,
            'bb622dc852a278ede8fbfd0144ae49d6576e621a1267932dfd198c2cea73b403'
        );
    });

    it('should reject incorrect transaction id', async function() {
        try {
            await get.getTransaction(factomd, 55);
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should not find Transaction', async function() {
        this.timeout(5000);

        try {
            await get.getTransaction(
                factomd,
                '63fe4275064427f11e0dcfc3ff2d56adf88ba12c2646bc0d03d03a02ff7d2720'
            );
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should get coinbase Transaction', async function() {
        this.timeout(5000);

        const transaction = await get.getTransaction(
            factomd,
            '4099f0fe5ba3ccdccb0ee5e45f9d3d513bb9994c781acb54b49ae15d85f1e9d9'
        );

        assert.instanceOf(transaction, Transaction);
        assert.strictEqual(
            transaction.id,
            '4099f0fe5ba3ccdccb0ee5e45f9d3d513bb9994c781acb54b49ae15d85f1e9d9'
        );
        assert.strictEqual(transaction.totalInputs, 0);
        assert.strictEqual(transaction.totalFactoidOutputs, 640000000);
        assert.strictEqual(transaction.totalEntryCreditOutputs, 0);
        assert.strictEqual(transaction.feesPaid, 0);
        assert.lengthOf(transaction.inputs, 0);
        assert.lengthOf(transaction.factoidOutputs, 2);
        assert.lengthOf(transaction.entryCreditOutputs, 0);
        assert.strictEqual(
            transaction.factoidOutputs[0].address,
            'FA36vN5aQU2DAofpisurQhDSvx73MVatA53kSstTgcts8h2T9cvx'
        );
        assert.strictEqual(transaction.factoidOutputs[0].amount, 320000000);
    });

    it('should get heights', async function() {
        const heights = await get.getHeights(factomd);

        assert.isNumber(heights.directoryBlockHeight);
        assert.notStrictEqual(heights.directoryBlockHeight, 0);
        assert.isNumber(heights.leaderHeight);
        assert.notStrictEqual(heights.leaderHeight, 0);
        assert.isNumber(heights.entryBlockHeight);
        assert.notStrictEqual(heights.entryBlockHeight, 0);
        assert.isNumber(heights.entryHeight);
        assert.notStrictEqual(heights.entryHeight, 0);
    });

    function assertDirectoryBlock(db) {
        assert.instanceOf(db, DirectoryBlock);
        assert.strictEqual(
            db.keyMR,
            'f55a19d9562843b642f1a20b34fcbb71e70f438c4d98d223fc2228ca2dd0c54a'
        );
        assert.strictEqual(db.height, 21537);
        assert.strictEqual(
            db.previousBlockKeyMR,
            'b37bf4eee21547773c74fa099c643588835e4ada9a4a8c22f0dd171e22710bf5'
        );
        assert.strictEqual(db.timestamp, 1521348840);
        assert.strictEqual(
            db.adminBlockRef,
            '643f3a4f0a5fd7a44374affe47fd052a845a078482319ad6540aa7f1f714bb9e'
        );
        assert.strictEqual(
            db.entryCreditBlockRef,
            'f4540b4170666a47b1287c4d0843b91d5a0ebcf8433c40b674d017f146503256'
        );
        assert.strictEqual(
            db.factoidBlockRef,
            'baf6e92932f4ba0f81baacf7b7d7726d6f7f3a4da0c43bfdaf846a843c8f2301'
        );
        assert.lengthOf(db.entryBlockRefs, 23);
    }

    it('should get Directory Block', async function() {
        this.timeout(5000);

        const byKeyMR = await get.getDirectoryBlock(
            factomd,
            'f55a19d9562843b642f1a20b34fcbb71e70f438c4d98d223fc2228ca2dd0c54a'
        );
        assertDirectoryBlock(byKeyMR);

        const byHeight = await get.getDirectoryBlock(factomd, 21537);
        assertDirectoryBlock(byHeight);

        assert.strictEqual(
            byHeight.fullHash,
            'd435f58a88eb9967e8be864af7015a9a01a50f716181a8bee5e86593bc4a0f8d'
        );
        assert.strictEqual(
            byHeight.previousFullHash,
            'f0dc9915ff0db78648a8366a1768332c74d28913f3ae4699d4fab7dc6d935b31'
        );
        assert.strictEqual(
            byHeight.bodyKeyMR,
            '6243865ba04b031423a2d6b48335c571b48499e71b7630f233e885f832bfdd30'
        );
    });

    it('should reject negative block height for getDirectoryBlock', async function() {
        try {
            await get.getDirectoryBlock(factomd, -1);
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should reject incorrect argument for getDirectoryBlock', async function() {
        try {
            await get.getDirectoryBlock(factomd, true);
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    function assertEntryCreditBlock(ecb) {
        assert.instanceOf(ecb, EntryCreditBlock);
        assert.strictEqual(
            ecb.fullHash,
            '4cf58af96b2dcdf416217cbdb195d67f1a511a8ab95a8e37aebeb8e643cb8f3c'
        );
        assert.strictEqual(
            ecb.headerHash,
            '96ad20412e7799e80f3979c425bfa5641282563371cd40049492701f9c09e338'
        );
        assert.strictEqual(
            ecb.bodyHash,
            'd9b5f08c5002bfa70c7b98a61c02eddaa3544299eb498840641b3a9e6d771bda'
        );
        assert.strictEqual(
            ecb.previousFullHash,
            'ae8ab99b07b9d367a36f8a54fe0020532fbb20c71f65dfa2dacdee5bceb1b332'
        );
        assert.strictEqual(
            ecb.previousHeaderHash,
            '48ff34b7bf9807e59e07c2c3d9a96c2442fcde8446952b258223b65b4d75190b'
        );
        assert.strictEqual(ecb.directoryBlockHeight, 17997);
        assert.strictEqual(ecb.headerExpansionArea, '');
        assert.strictEqual(ecb.bodySize, 11939);
        assert.strictEqual(ecb.objectCount, 97);
        assert.lengthOf(ecb.commits, 87);
        assert.lengthOf(ecb.minuteIndexes, 11);
    }

    it('should get Entry Credit Block', async function() {
        this.timeout(5000);

        const byHeaderHash = await get.getEntryCreditBlock(
            factomd,
            '96ad20412e7799e80f3979c425bfa5641282563371cd40049492701f9c09e338'
        );
        assertEntryCreditBlock(byHeaderHash);

        const byHeight = await get.getEntryCreditBlock(factomd, 17997);
        assertEntryCreditBlock(byHeight);
    });

    it('should reject negative block height for getEntryCreditBlock', async function() {
        try {
            await get.getEntryCreditBlock(factomd, -1);
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should reject incorrect argument for getEntryCreditBlock', async function() {
        try {
            await get.getEntryCreditBlock(factomd, true);
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    function assertFactoidBlock(fb) {
        assert.instanceOf(fb, FactoidBlock);
        assert.strictEqual(
            fb.keyMR,
            '4b2572326cc04f4bff215800bc3f48b2e64f2002f0c2b592e09b003ea3f36bdd'
        );
        assert.strictEqual(
            fb.previousBlockKeyMR,
            'a7074a34b37954944224a3cd13a19f690f5b0d12d3373b2f54904329e02c56ec'
        );
        assert.strictEqual(
            fb.bodyMR,
            'ca7641b49bb5cc2d00145b28a5634305490fb0caa96c6a838959910803e8008f'
        );
        assert.strictEqual(fb.entryCreditRate, 1000);
        assert.strictEqual(fb.directoryBlockHeight, 55010);
        assert.strictEqual(
            fb.ledgerKeyMR,
            '72cc3a6d43c72532e0670941e1bb35074e8ab1d55715a2e0687b5fc1540e8fef'
        );
        assert.strictEqual(
            fb.previousLedgerKeyMR,
            '977cd8f7a847770756d040711690aff7b3cbd7f54665152ec72b7de411cf4de9'
        );
        assert.lengthOf(fb.transactions, 1);

        const coinbaseTx = fb.getCoinbaseTransaction();
        assert.instanceOf(coinbaseTx, Transaction);
        assert.strictEqual(coinbaseTx.totalInputs, 0);
        assert.strictEqual(coinbaseTx.totalFactoidOutputs, 6398208000);
        assert.isObject(coinbaseTx.blockContext);
        assert.strictEqual(
            coinbaseTx.blockContext.factoidBlockKeyMR,
            '4b2572326cc04f4bff215800bc3f48b2e64f2002f0c2b592e09b003ea3f36bdd'
        );
        assert.strictEqual(coinbaseTx.blockContext.directoryBlockHeight, 55010);
    }

    it('should get Factoid Block', async function() {
        this.timeout(5000);

        const byKeyMR = await get.getFactoidBlock(
            factomd,
            '4b2572326cc04f4bff215800bc3f48b2e64f2002f0c2b592e09b003ea3f36bdd'
        );
        assertFactoidBlock(byKeyMR);

        const byHeight = await get.getFactoidBlock(factomd, 55010);
        assertFactoidBlock(byHeight);
    });

    it('should reject negative block height for getFactoidBlock', async function() {
        try {
            await get.getFactoidBlock(factomd, -1);
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should reject incorrect argument for getFactoidBlock', async function() {
        try {
            await get.getFactoidBlock(factomd, true);
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should get Entry Block', async function() {
        this.timeout(5000);

        const eb = await get.getEntryBlock(
            factomd,
            '3944669331eea620f7f3ec67864a03a646a104f17e36aec3e0f5bdf638f16883'
        );

        assert.instanceOf(eb, EntryBlock);
        assert.strictEqual(
            eb.keyMR,
            '3944669331eea620f7f3ec67864a03a646a104f17e36aec3e0f5bdf638f16883'
        );
        assert.strictEqual(
            eb.previousBlockKeyMR,
            '1af04b34c3a0113d14aa0fcbb8c609864fa2e8f24dd04e9814aa7e5a40376a70'
        );
        assert.strictEqual(eb.timestamp, 1521429840);
        assert.strictEqual(eb.directoryBlockHeight, 21672);
        assert.strictEqual(
            eb.chainId,
            '3f69bdf3b4769ff53407580b882ee01e0c365f6deffba4ed8d4651b24e65389a'
        );
        assert.strictEqual(eb.sequenceNumber, 1168);
        assert.lengthOf(eb.entryRefs, 50);
    });

    it('should reject incorrect argument for getEntryBlock', async function() {
        try {
            await get.getEntryBlock(factomd, 12777);
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    function assertAdminBlock(ab) {
        assert.instanceOf(ab, AdminBlock);
        assert.strictEqual(
            ab.backReferenceHash,
            'd6d21564d9b1b1e55fa308890821ed4151ded40a33cb3cf8edaecf2b63e32236'
        );
        assert.strictEqual(
            ab.lookupHash,
            'c98beb0b3cbfbb090acdd238ca17725119eb43f1df5ef117ffbdc59f050508e6'
        );
        assert.strictEqual(
            ab.previousBackReferenceHash,
            'a24beb7bcd0d47857fcd0b570ea3c16704daf3377d9b9588c6305e9271539eea'
        );
        assert.strictEqual(ab.directoryBlockHeight, 21662);
        assert.strictEqual(ab.headerExpansionArea, '');
        assert.strictEqual(ab.headerExpansionSize, 0);
        assert.strictEqual(ab.bodySize, 387);
        assert.lengthOf(ab.entries, 3);
    }

    it('should get Admin Block', async function() {
        this.timeout(5000);

        const byHash = await get.getAdminBlock(
            factomd,
            'c98beb0b3cbfbb090acdd238ca17725119eb43f1df5ef117ffbdc59f050508e6'
        );
        assertAdminBlock(byHash);

        const byHeight = await get.getAdminBlock(factomd, 21662);
        assertAdminBlock(byHeight);
    });

    it('should reject negative block height for getAdminBlock', async function() {
        try {
            await get.getAdminBlock(factomd, -1);
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should reject incorrect argument for getAdminBlock', async function() {
        try {
            await get.getAdminBlock(factomd, true);
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should test if chain exists', async function() {
        this.timeout(5000);

        const b1 = await get.chainExists(
            factomd,
            '3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791'
        );
        assert.isTrue(b1);
        const b2 = await get.chainExists(
            factomd,
            '3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079792'
        );
        assert.isFalse(b2);
    });

    it('should get Directory block head', async function() {
        this.timeout(5000);

        const head = await get.getDirectoryBlockHead(factomd);
        assert.instanceOf(head, DirectoryBlock);
    });

    // TODO: fragile test, should be set up against local factomd rather than testnet
    it('should rewind chain entry by entry (forEach)', async function() {
        this.timeout(20000);

        let counter = 0;
        await get.rewindChainWhile(
            factomd,
            '106fa1e435be6cff0e167da35a186b141e4dfcea204e1500bf694c88b9214f68',
            () => true,
            function(entry) {
                assert.instanceOf(entry, Entry);
                assert.isObject(entry.blockContext);
                assert.isNumber(entry.blockContext.directoryBlockHeight);
                assert.isNumber(entry.blockContext.entryBlockTimestamp);
                assert.isNumber(entry.blockContext.entryBlockSequenceNumber);
                assert.isString(entry.blockContext.entryBlockKeyMR);
                counter++;
            }
        );
        assert.strictEqual(counter, 5);
    });

    it('should not rewind chain ', async function() {
        this.timeout(20000);

        await get.rewindChainWhile(
            factomd,
            '106fa1e435be6cff0e167da35a186b141e4dfcea204e1500bf694c88b9214f68',
            () => false,
            function() {
                throw new Error('Should not be entered');
            }
        );
    });

    // TODO: fragile test, should be set up against local factomd rather than testnet
    it('should rewind chain and find entry', async function() {
        this.timeout(20000);

        let search = true,
            found,
            counter = 0;
        await get.rewindChainWhile(
            factomd,
            '106fa1e435be6cff0e167da35a186b141e4dfcea204e1500bf694c88b9214f68',
            () => search,
            function(entry) {
                counter++;
                if (
                    entry.content.toString('hex') ===
                    '0b70b3b0fd865bd903461bf8f3d9cd782ebfa92e26238079eaf58bbdf2b4a1c0'
                ) {
                    found = entry;
                    search = false;
                }
            }
        );

        assert.strictEqual(counter, 3);
        assert.strictEqual(
            found.hash().toString('hex'),
            '0ef649d17f4f1e961a0e5d0d7f294ae151253d72564958763821aee1dc6ac37f'
        );
    });

    it('should validate rewind chain predicate function', async function() {
        try {
            await get.rewindChainWhile(
                factomd,
                '106fa1e435be6cff0e167da35a186b141e4dfcea204e1500bf694c88b9214f68',
                44,
                () => {}
            );
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should validate rewind chain apply function', async function() {
        try {
            await get.rewindChainWhile(
                factomd,
                '106fa1e435be6cff0e167da35a186b141e4dfcea204e1500bf694c88b9214f68',
                () => true
            );
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });
});
