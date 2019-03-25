const assert = require('chai').assert;
const { Entry } = require('../src/entry'),
    { Chain } = require('../src/chain'),
    { FactomCli } = require('../src/factom-cli');

const PAYING_EC_ADDRESS = process.env.EC_PRIVATE_ADDRESS;
const PAYING_FCT_ADDRESS = process.env.FCT_PRIVATE_ADDRESS;
const RECEIVING_FCT_ADDRESS = 'FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg4uH';
const RECEIVING_EC_ADDRESS = 'EC3MVTBYTo2Y1HrEKxeEGfNNoKhLZ9ZYQhb26zQUzngJ6SLUVRX9';

describe('Test FactomCli', function() {
    const cli = new FactomCli({
        factomd: {
            host: process.env.FACTOMD_HOST,
            port: process.env.FACTOMD_PORT
        },
        walletd: {
            host: 'localhost',
            port: 8089
        }
    });

    it('should call raw factomd API', async function() {
        assert.isObject(await cli.factomdApi('properties'));
    });

    xit('should call raw walletd API', async function() {
        assert.isObject(await cli.walletdApi('properties'));
    });

    it('should commit and reveal', async function() {
        this.timeout(5000);

        const e = Entry.builder()
            .chainId('0ec9d1cfbb458e28229b40139b5bee7d88c81215fb4dfdac48a9cf27f70f0790')
            .extId('factom-cli', 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .build();
        assert.isObject(await cli.commit(e, PAYING_EC_ADDRESS));
        assert.isObject(await cli.reveal(e));
    });

    it('should commit and reveal chain', async function() {
        this.timeout(5000);

        const e = Entry.builder()
            .extId('factom-cli', 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .build();
        assert.isObject(await cli.commitChain(new Chain(e), PAYING_EC_ADDRESS));
        assert.isObject(await cli.revealChain(new Chain(e), PAYING_EC_ADDRESS));
    });

    it('should commit and reveal entry', async function() {
        this.timeout(5000);

        const e = Entry.builder()
            .chainId('0ec9d1cfbb458e28229b40139b5bee7d88c81215fb4dfdac48a9cf27f70f0790')
            .extId('factom-cli', 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .build();
        assert.isObject(await cli.commitEntry(e, PAYING_EC_ADDRESS));
        assert.isObject(await cli.revealEntry(e, PAYING_EC_ADDRESS));
    });

    it('should add', async function() {
        this.timeout(10000);

        const e = Entry.builder()
            .chainId('0ec9d1cfbb458e28229b40139b5bee7d88c81215fb4dfdac48a9cf27f70f0790')
            .extId('factom-cli', 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .build();
        assert.isObject(await cli.add(e, PAYING_EC_ADDRESS));
    });

    it('should add entry', async function() {
        this.timeout(10000);

        const e = Entry.builder()
            .chainId('0ec9d1cfbb458e28229b40139b5bee7d88c81215fb4dfdac48a9cf27f70f0790')
            .extId('factom-cli', 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .build();
        assert.isObject(await cli.addEntry(e, PAYING_EC_ADDRESS));
    });

    it('should add entries', async function() {
        this.timeout(10000);

        const e = Entry.builder()
            .chainId('0ec9d1cfbb458e28229b40139b5bee7d88c81215fb4dfdac48a9cf27f70f0790')
            .extId('factom-cli', 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .build();
        assert.isArray(await cli.addEntries([e], PAYING_EC_ADDRESS));
    });

    it('should add chain', async function() {
        this.timeout(10000);

        const e = Entry.builder()
            .chainId('0ec9d1cfbb458e28229b40139b5bee7d88c81215fb4dfdac48a9cf27f70f0790')
            .extId('factom-cli', 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .build();
        assert.isObject(await cli.addChain(new Chain(e), PAYING_EC_ADDRESS));
    });

    it('should add chains', async function() {
        this.timeout(10000);

        const e = Entry.builder()
            .chainId('0ec9d1cfbb458e28229b40139b5bee7d88c81215fb4dfdac48a9cf27f70f0790')
            .extId('factom-cli', 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .extId(Math.random().toString(), 'utf8')
            .build();
        assert.isArray(await cli.addChains([new Chain(e)], PAYING_EC_ADDRESS));
    });

    it('should get all entries of chain', async function() {
        this.timeout(5000);

        assert.isArray(
            await cli.getAllEntriesOfChain(
                '9f0901a2cdef23bb9cc8d06d8355d848f19d315808fdf70a614dd52dd6539689'
            )
        );
    });

    it('should get chain head', async function() {
        assert.isObject(
            await cli.getChainHead(
                '9f0901a2cdef23bb9cc8d06d8355d848f19d315808fdf70a614dd52dd6539689'
            )
        );
    });

    it('should get entry', async function() {
        assert.isObject(
            await cli.getEntry('a37e7077146ead1fd8ee818cfcf9afa3ac1074a97324a75360722cd81cf28bc4')
        );
    });

    it('should get entry with block context', async function() {
        this.timeout(5000);

        assert.isObject(
            await cli.getEntryWithBlockContext(
                'a37e7077146ead1fd8ee818cfcf9afa3ac1074a97324a75360722cd81cf28bc4'
            )
        );
    });

    it('should get first entry', async function() {
        this.timeout(5000);

        assert.isObject(
            await cli.getFirstEntry(
                '9f0901a2cdef23bb9cc8d06d8355d848f19d315808fdf70a614dd52dd6539689'
            )
        );
    });

    it('should check chain exists', async function() {
        assert.isBoolean(
            await cli.chainExists(
                '9f0901a2cdef23bb9cc8d06d8355d848f19d315808fdf70a614dd52dd6539689'
            )
        );
    });

    it('should get balance', async function() {
        assert.isNumber(
            await cli.getBalance('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw')
        );
    });

    it('should get entry credit rate', async function() {
        assert.isNumber(await cli.getEntryCreditRate());
    });

    it('should get transaction', async function() {
        assert.isObject(
            await cli.getTransaction(
                '3dd83531164388d9a598fb8db63e0610f5c3b5c9411ca990f51b3406c8e81d0c'
            )
        );
    });

    it('should rewind chain', async function() {
        this.timeout(5000);

        let i = 0;
        await cli.rewindChainWhile(
            '9f0901a2cdef23bb9cc8d06d8355d848f19d315808fdf70a614dd52dd6539689',
            () => true,
            () => i++
        );
        assert.isAtLeast(i, 1);
    });

    it('should create and send factoid transaction', async function() {
        this.timeout(10000);

        const transaction = await cli.createFactoidTransaction(
            PAYING_FCT_ADDRESS,
            RECEIVING_FCT_ADDRESS,
            1
        );
        assert.isString(await cli.sendTransaction(transaction));
    });

    it('should create and send EC purchase transaction', async function() {
        this.timeout(10000);

        const transaction = await cli.createEntryCreditPurchaseTransaction(
            PAYING_FCT_ADDRESS,
            RECEIVING_EC_ADDRESS,
            1
        );
        assert.isString(await cli.sendTransaction(transaction));
    });

    it('should wait on commit ack', async function() {
        const status = await cli.waitOnCommitAck(
            'bbd51be102e7ed19b825acd32d48f1f88033d5b14721f3003f925862b1baf135'
        );
        assert.strictEqual(status, 'DBlockConfirmed');
    });

    it('should wait on reveal ack', async function() {
        const status = await cli.waitOnRevealAck(
            'ac564d418ffaae59432d644d59fd11f6f0552a1211e9219e16037bc14296c630',
            '3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791'
        );
        assert.strictEqual(status, 'DBlockConfirmed');
    });

    it('should wait on Factoid transaction ack', async function() {
        const status = await cli.waitOnFactoidTransactionAck(
            '09d23680a82f95faafd3562f6b76d83525bdd4575a74656809ced19fa45f72e6'
        );
        assert.strictEqual(status, 'DBlockConfirmed');
    });

    it('should get heights', async function() {
        assert.isObject(await cli.getHeights());
    });

    it('should get Directory Block head', async function() {
        assert.isObject(await cli.getDirectoryBlockHead());
    });

    it('should get Directory Block', async function() {
        assert.isObject(
            await cli.getDirectoryBlock(
                'b22ce9d405402a3ddaafa63914ebf8e0cec4fd4c8b8513fc786cd53c5254208c'
            )
        );
    });

    it('should get Admin Block', async function() {
        assert.isObject(
            await cli.getAdminBlock(
                '579d864ab69a3c4dd66730045a10831463ddc74a00293a54098e7ba125ff9950'
            )
        );
    });

    it('should get Entry Credit Block', async function() {
        assert.isObject(
            await cli.getEntryCreditBlock(
                'cf893ad2711c2e7d2daf5f0599d63fd63fc92674bcd046d0dbdb6a5742ea7a61'
            )
        );
    });

    it('should get Factoid Block', async function() {
        assert.isObject(
            await cli.getFactoidBlock(
                '7d7ba1f058c76bbc7b6aee2c645d15da79182fd2eaf39aebe1a8b9d40c8e9cc5'
            )
        );
    });

    it('should get Entry Block', async function() {
        assert.isObject(
            await cli.getEntryBlock(
                '308093c08f9c17a33cf21a3da89d7c28e8b3587b5d0119a50ab9e88e0bee39d4'
            )
        );
    });
});
