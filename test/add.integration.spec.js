const assert = require('chai').assert,
    { FactomdCli } = require('../src/apis-cli'),
    { Entry, computeEntryTxId } = require('../src/entry'),
    { Chain, computeChainTxId } = require('../src/chain'),
    add = require('../src/add');

require('dotenv').config();
const factomd = new FactomdCli({
    host: process.env.FACTOMD_HOST,
    port: process.env.FACTOMD_PORT
});
const PAYING_EC_ADDRESS = process.env.EC_PRIVATE_ADDRESS;

describe('Add chains and entries in Factom blockchain', function() {
    it('should commit and then reveal chain', async function() {
        this.timeout(10000);

        const e = Entry.builder()
            .timestamp(Date.now())
            .extId('factom.js')
            .extId('commit/reveal chain test', 'utf8')
            .extId(Date.now().toString() + Math.random(), 'utf8')
            .build();

        const c = new Chain(e);

        // Commit
        const committed = await add.commit(factomd, c, PAYING_EC_ADDRESS);
        assert.strictEqual(committed.txId, computeChainTxId(c).toString('hex'));

        // Reveal
        const revealed = await add.reveal(factomd, c, PAYING_EC_ADDRESS);
        assert.strictEqual(revealed.entryHash, c.firstEntry.hashHex());
        assert.strictEqual(revealed.chainId, c.idHex);
    });

    it('should commit and then reveal entry', async function() {
        this.timeout(10000);

        const e = Entry.builder()
            .chainId('3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791')
            .timestamp(Date.now())
            .extId('factom.js')
            .extId('commit/reveal entry test', 'utf8')
            .extId(Date.now().toString() + Math.random(), 'utf8')
            .build();

        // Commit
        const committed = await add.commit(factomd, e, PAYING_EC_ADDRESS);
        assert.strictEqual(committed.txId, computeEntryTxId(e).toString('hex'));

        // Reveal
        const revealed = await add.reveal(factomd, e, PAYING_EC_ADDRESS);
        assert.strictEqual(revealed.entryHash, e.hashHex());
        assert.strictEqual(
            revealed.chainId,
            '3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791'
        );
    });

    it('should reject commit entry without chainId', async function() {
        const e = Entry.builder()
            .timestamp(Date.now())
            .extId('factom.js', 'utf8')
            .extId('commit entry test', 'utf8')
            .extId(Date.now().toString(), 'utf8')
            .build();

        try {
            await add.commit(factomd, e, PAYING_EC_ADDRESS);
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have rejected entry without chainId');
    });

    it('should reject reveal entry without chainId', async function() {
        const e = Entry.builder()
            .timestamp(Date.now())
            .extId('factom.js', 'utf8')
            .extId('reveal entry test', 'utf8')
            .extId(Date.now().toString(), 'utf8')
            .build();

        try {
            await add.reveal(factomd, e, PAYING_EC_ADDRESS);
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have rejected entry without chainId');
    });

    it('should add chain', async function() {
        this.timeout(10000);

        const e = Entry.builder()
            .timestamp(Date.now())
            .extId('factom.js')
            .extId('add chain test', 'utf8')
            .extId(Date.now().toString(), 'utf8')
            .build();

        const c = new Chain(e);

        const added = await add.add(factomd, c, PAYING_EC_ADDRESS);

        assert.strictEqual(added.entryHash, c.firstEntry.hashHex());
        assert.strictEqual(added.chainId, c.idHex);
        assert.strictEqual(added.repeatedCommit, false);
        assert.strictEqual(added.txId, computeChainTxId(c).toString('hex'));
    });

    it('should notify repeated commit', async function() {
        this.timeout(10000);

        const e = Entry.builder()
            .timestamp(Date.now())
            .extId('factom.js')
            .extId('add chain test', 'utf8')
            .extId(Date.now().toString(), 'utf8')
            .build();

        const c = new Chain(e);

        await add.commit(factomd, c, PAYING_EC_ADDRESS);
        const repeated = await add.commit(factomd, c, PAYING_EC_ADDRESS);
        assert.strictEqual(repeated.repeatedCommit, true);
        assert.isUndefined(repeated.txId);
    });

    it('should add entry', async function() {
        this.timeout(10000);

        const e = Entry.builder()
            .chainId('3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791')
            .timestamp(Date.now())
            .extId('factom.js', 'utf8')
            .extId('add entry test', 'utf8')
            .extId(Date.now().toString(), 'utf8')
            .build();

        const added = await add.add(factomd, e, PAYING_EC_ADDRESS);

        assert.strictEqual(added.entryHash, e.hashHex());
        assert.strictEqual(
            added.chainId,
            '3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791'
        );
        assert.strictEqual(added.repeatedCommit, false);
        assert.strictEqual(added.txId, computeEntryTxId(e).toString('hex'));
    });

    it('should reject add entry without chainId', async function() {
        const e = Entry.builder()
            .timestamp(Date.now())
            .extId('factom.js', 'utf8')
            .extId('add entry test', 'utf8')
            .extId(Date.now().toString(), 'utf8')
            .build();

        try {
            await add.add(factomd, e, PAYING_EC_ADDRESS);
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have rejected entry without chainId');
    });

    it('should add entries', async function() {
        this.timeout(10000);

        const e1 = Entry.builder()
            .chainId('3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791')
            .timestamp(Date.now())
            .extId('factom.js', 'utf8')
            .extId('add entries test', 'utf8')
            .extId(Date.now().toString() + Math.random(), 'utf8')
            .build();

        const e2 = Entry.builder()
            .chainId('3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791')
            .timestamp(Date.now())
            .extId('factom.js', 'utf8')
            .extId('add entries test', 'utf8')
            .extId(Date.now().toString() + Math.random(), 'utf8')
            .build();

        const added = await add.add(factomd, [e1, e2], PAYING_EC_ADDRESS, {
            concurrency: 1
        });

        assert.lengthOf(added, 2);
        assert.strictEqual(added[0].entryHash, e1.hashHex());
        assert.strictEqual(
            added[0].chainId,
            '3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791'
        );
        assert.strictEqual(added[0].repeatedCommit, false);
        assert.strictEqual(added[0].txId, computeEntryTxId(e1).toString('hex'));
    });

    it('should add chains', async function() {
        this.timeout(15000);

        const c1 = new Chain(
            Entry.builder()
                .chainId('3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791')
                .timestamp(Date.now())
                .extId('factom.js', 'utf8')
                .extId('add chains test', 'utf8')
                .extId(Date.now().toString() + Math.random(), 'utf8')
                .build()
        );

        const c2 = new Chain(
            Entry.builder()
                .chainId('3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791')
                .timestamp(Date.now())
                .extId('factom.js', 'utf8')
                .extId('add chains test', 'utf8')
                .extId(Date.now().toString() + Math.random(), 'utf8')
                .build()
        );

        const added = await add.add(factomd, [c1, c2], PAYING_EC_ADDRESS, {
            concurrency: 1
        });

        assert.lengthOf(added, 2);
        assert.strictEqual(added[0].entryHash, c1.firstEntry.hashHex());
        assert.strictEqual(added[0].chainId, c1.idHex);
        assert.strictEqual(added[0].repeatedCommit, false);
        assert.strictEqual(added[0].txId, computeChainTxId(c1).toString('hex'));
    });

    it('should throw when adding an already existing chain', async function() {
        this.timeout(10000);

        const e = Entry.builder()
            .extId('hello', 'utf8')
            .extId('erfkkk', 'utf8')
            .content(Math.random().toString(), 'utf8')
            .build();
        const c = new Chain(e);

        try {
            await add.add(factomd, c, PAYING_EC_ADDRESS);
        } catch (e) {
            assert.include(e.message, 'already exists');
            return;
        }
        throw new Error('Should have thrown.');
    });

    it('should throw when not enough EC', async function() {
        this.timeout(10000);

        const e = Entry.builder()
            .chainId('8f6f7d99fb4fe51fcba7679780aa2c21fcf7f3a85e6658b72fa33a2baaecd911')
            .extId('hello', 'utf8')
            .content(Math.random().toString(), 'utf8')
            .build();

        try {
            await add.add(factomd, e, 'Es3WC5Pr54jsppooWWvGEqeqsauQFJaZuBMdXCBWSDA3wkzWK9cC');
        } catch (e) {
            assert.include(e.message, 'not sufficient to pay');
            return;
        }
        throw new Error('Should have thrown.');
    });

    it('should bypass fund validation', async function() {
        this.timeout(10000);

        const e = Entry.builder()
            .chainId('8f6f7d99fb4fe51fcba7679780aa2c21fcf7f3a85e6658b72fa33a2baaecd911')
            .extId('hello', 'utf8')
            .content(Math.random().toString(), 'utf8')
            .build();

        await add.add(factomd, e, 'Es3WC5Pr54jsppooWWvGEqeqsauQFJaZuBMdXCBWSDA3wkzWK9cC', {
            skipFundValidation: true,
            commitTimeout: -1,
            revealTimeout: -1
        });
    });
});
