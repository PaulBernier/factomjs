const assert = require('chai').assert,
    sign = require('tweetnacl/nacl-fast').sign,
    {
        Entry,
        composeEntryCommit,
        composeEntryReveal,
        composeEntry,
        computeEntryTxId,
        composeEntryLedger
    } = require('../src/entry');

describe('Test Entry', function() {
    it('should populate Entry attributes', function() {
        const entry = Entry.builder()
            .chainId('cfb5d93e747d20433e3b14603f90a5eb152d0399e7278f9671ecf9763f8780e8')
            .extId('extId', 'utf8')
            .extId('6c756170', 'hex')
            .extId(Buffer.from('extId2'))
            .content('hello', 'utf8')
            .timestamp(1523072354)
            .build();

        assert.instanceOf(entry.chainId, Buffer);
        assert.strictEqual(
            entry.chainId.toString('hex'),
            'cfb5d93e747d20433e3b14603f90a5eb152d0399e7278f9671ecf9763f8780e8'
        );
        assert.instanceOf(entry.content, Buffer);
        assert.strictEqual(entry.content.toString(), 'hello');
        assert.instanceOf(entry.extIds, Array);
        assert.lengthOf(entry.extIds, 3);
        assert.instanceOf(entry.extIds[0], Buffer);
        assert.strictEqual(entry.extIds[0].toString(), 'extId');
        assert.strictEqual(entry.extIds[1].toString(), 'luap');
        assert.strictEqual(entry.extIds[2].toString(), 'extId2');
        assert.strictEqual(entry.timestamp, 1523072354);
    });

    it('should reject invalid argument of Entry constructor', function() {
        try {
            new Entry({});
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should fail to marshal binary Entry without a chain Id', function() {
        try {
            Entry.builder()
                .extId('ef')
                .content('af')
                .build()
                .marshalBinary();
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should reject entry bigger tha 10kb', function() {
        try {
            Entry.builder()
                .content(Buffer.allocUnsafe(10240 + 1).fill('0'))
                .build()
                .ecCost();
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should get sizes with ext ids', function() {
        const entry = Entry.builder()
            .extId('extId', 'utf8')
            .extId('extId2', 'utf8')
            .content('hello', 'utf8')
            .build();

        assert.strictEqual(entry.size(), 55);
        assert.strictEqual(entry.payloadSize(), 20);
        assert.strictEqual(entry.rawDataSize(), 16);
    });

    it('should copy Entry', function() {
        const entry = Entry.builder()
            .chainId('cfb5d93e747d20433e3b14603f90a5eb152d0399e7278f9671ecf9763f8780e8')
            .extId('extId', 'utf8')
            .extId('extId2', 'utf8')
            .content('hello', 'utf8')
            .timestamp(1523072354)
            .build();

        const copy = Entry.builder(entry).build();

        assert.notStrictEqual(entry, copy);
        assert.notStrictEqual(entry.extIds[0], copy.extIds[0]);
        assert.notStrictEqual(entry.content, copy.content);
        assert.deepEqual(entry, copy);
    });

    it('should copy empty Entry', function() {
        const entry = Entry.builder().build();

        const copy = Entry.builder(entry).build();

        assert.notStrictEqual(entry, copy);
        assert.deepEqual(copy.chainId, Buffer.from(''));
        assert.deepEqual(copy.extIds, []);
        assert.deepEqual(copy.content, Buffer.from(''));
    });

    it('should get sizes without ext ids', function() {
        const entry = Entry.builder()
            .content('abcdef', 'utf8')
            .build();

        assert.strictEqual(entry.size(), 41);
        assert.strictEqual(entry.payloadSize(), 6);
        assert.strictEqual(entry.rawDataSize(), 6);
    });

    it('should get remaining free bytes', function() {
        const e1 = Entry.builder()
            .content(Buffer.alloc(24))
            .build();
        const e2 = Entry.builder()
            .content(Buffer.alloc(1024))
            .build();
        const e3 = Entry.builder()
            .content(Buffer.alloc(1025))
            .build();
        const e4 = Entry.builder()
            .content(Buffer.alloc(0))
            .build();

        assert.strictEqual(e1.remainingFreeBytes(), 1000);
        assert.strictEqual(e2.remainingFreeBytes(), 0);
        assert.strictEqual(e3.remainingFreeBytes(), 1023);
        assert.strictEqual(e4.remainingFreeBytes(), 1024);
    });

    it('should get remaining maximum bytes', function() {
        const e1 = Entry.builder()
            .content(Buffer.alloc(240))
            .build();
        const e2 = Entry.builder()
            .content(Buffer.alloc(e1.payloadSize() + e1.remainingMaxBytes()))
            .build();
        const e3 = Entry.builder()
            .content(Buffer.alloc(e1.payloadSize() + e1.remainingMaxBytes() + 1))
            .build();

        assert.strictEqual(e1.remainingMaxBytes(), 10000);
        assert.strictEqual(e2.remainingMaxBytes(), 0);
        assert.throws(() => e3.remainingMaxBytes(), Error);
    });

    it('should get hex values', function() {
        const e = Entry.builder()
            .chainId('45f7ebb3be5217d0e2f1d14ab73121a66cdaad12a50b9863a45ee8ee9f3ab032')
            .extId('efef', 'hex')
            .extId(Buffer.from('covfefe'))
            .content('45878755', 'hex')
            .build();

        assert.strictEqual(e.contentHex, '45878755');
        assert.strictEqual(e.extIdsHex[0], 'efef');
        assert.strictEqual(e.extIdsHex[1], '636f7666656665');
        assert.strictEqual(
            e.chainIdHex,
            '45f7ebb3be5217d0e2f1d14ab73121a66cdaad12a50b9863a45ee8ee9f3ab032'
        );
    });

    it('should compute marshal binary', function() {
        // Examples from Factom data structures document
        const e = Entry.builder()
            .chainId('954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4')
            .extId('test', 'utf8')
            .content('PayloadHere', 'utf8')
            .build();
        const e2 = Entry.builder()
            .chainId('954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4')
            .content('PayloadHere', 'utf8')
            .build();

        const marshalBinary = e.marshalBinary();
        const marshalBinaryHex = e.marshalBinaryHex();
        assert.instanceOf(marshalBinary, Buffer);
        assert.strictEqual(
            marshalBinary.toString('hex'),
            '00954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f400060004746573745061796c6f616448657265'
        );
        assert.strictEqual(
            marshalBinaryHex,
            '00954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f400060004746573745061796c6f616448657265'
        );
        assert.strictEqual(
            e2.marshalBinary().toString('hex'),
            '00954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f400005061796c6f616448657265'
        );
    });

    it('should compute hash', function() {
        const e = Entry.builder()
            .chainId('954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4')
            .content('PayloadHere', 'utf8')
            .build();

        const hash = e.hash();
        assert.instanceOf(hash, Buffer);
        assert.strictEqual(
            hash.toString('hex'),
            '72177d733dcd0492066b79c5f3e417aef7f22909674f7dc351ca13b04742bb91'
        );
    });

    it('should compute EC cost', function() {
        const e1 = Entry.builder()
            .chainId('954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4')
            .content('ab')
            .build();

        const e2 = Entry.builder()
            .chainId('954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4')
            .content(Buffer.allocUnsafe(e1.payloadSize() + e1.remainingFreeBytes()))
            .build();

        const e3 = Entry.builder()
            .chainId('954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4')
            .content(Buffer.allocUnsafe(e1.payloadSize() + e1.remainingFreeBytes() + 1))
            .build();

        const e4 = Entry.builder()
            .chainId('954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4')
            .extId('123', 'utf8')
            .content(Buffer.alloc(1024 - 2 - 3 + 1))
            .build();

        assert.strictEqual(e1.ecCost(), 1);
        assert.strictEqual(e4.ecCost(), 2);
        assert.strictEqual(e2.ecCost(), e1.ecCost());
        assert.strictEqual(e3.ecCost(), e1.ecCost() + 1);
    });

    it('should compose Entry commit', function() {
        const e1 = Entry.builder()
            .chainId('954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4')
            .content('ab')
            .timestamp(1523151053000)
            .build();

        const commit = composeEntryCommit(
            e1,
            'Es2d1a3uPx7o5uXHmsCnSEK2EKatPA56n8RUFmW9uRrpPRBuk5bZ'
        );
        assert.instanceOf(commit, Buffer);
        assert.strictEqual(
            commit.toString('hex'),
            '000162a2e0a0c8fd461748e49aa77a6380c04059bd7e3040c9dbceca1828b37ddb737dd928909f015d54e4b02234a10b542573645f7ba55650f25eb931985cddcf451df77594b5b678790d79fc44d3c81fb701b2c3278b50b98eec215cd28be19bba5e1d96f7dc262ec8a87ae4cf9ea20eb43ef196052e761afb02a8f1a78df097c27c56a4a1d00f'
        );
    });

    it('should reject invalid argument of composeChainCommit', function() {
        try {
            composeEntryCommit({}, 'Es2d1a3uPx7o5uXHmsCnSEK2EKatPA56n8RUFmW9uRrpPRBuk5bZ');
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have thrown');
    });

    it('should compose Entry commit with provided signature', function() {
        const e1 = Entry.builder()
            .chainId('954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4')
            .content('ab')
            .timestamp(1523151053000)
            .build();

        const commit = composeEntryCommit(
            e1,
            'EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR',
            '78790d79fc44d3c81fb701b2c3278b50b98eec215cd28be19bba5e1d96f7dc262ec8a87ae4cf9ea20eb43ef196052e761afb02a8f1a78df097c27c56a4a1d00f'
        );
        assert.instanceOf(commit, Buffer);
        assert.strictEqual(
            commit.toString('hex'),
            '000162a2e0a0c8fd461748e49aa77a6380c04059bd7e3040c9dbceca1828b37ddb737dd928909f015d54e4b02234a10b542573645f7ba55650f25eb931985cddcf451df77594b5b678790d79fc44d3c81fb701b2c3278b50b98eec215cd28be19bba5e1d96f7dc262ec8a87ae4cf9ea20eb43ef196052e761afb02a8f1a78df097c27c56a4a1d00f'
        );
    });

    it('should reject invalid signature manually provided for entry commit (timestamp not fixed)', function() {
        const e1 = Entry.builder()
            .chainId('954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4')
            .content('ab')
            .build();

        const buffer = composeEntryLedger(e1);
        const secretKey = sign.keyPair.fromSeed(
            Buffer.from('19c71085f906291070d07cb64cf160692c033d5e6ac05342f2219c03b4a5c8c6', 'hex')
        ).secretKey;
        const signature = sign.detached(buffer, secretKey);

        try {
            composeEntryCommit(
                e1,
                'EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR',
                signature
            );
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have rejected invalid signature');
    });

    it('should compose Entry reveal', function() {
        const e = Entry.builder()
            .chainId('954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4')
            .extId('test', 'utf8')
            .content('PayloadHere', 'utf8')
            .build();

        const reveal = composeEntryReveal(e);
        assert.instanceOf(reveal, Buffer);
        assert.strictEqual(
            reveal.toString('hex'),
            '00954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f400060004746573745061796c6f616448657265'
        );
    });

    it('should compose Entry commit and reveal', function() {
        const e = Entry.builder()
            .chainId('954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4')
            .extId('test', 'utf8')
            .content('PayloadHere', 'utf8')
            .timestamp(1523151053000)
            .build();

        const composed = composeEntry(e, 'Es2d1a3uPx7o5uXHmsCnSEK2EKatPA56n8RUFmW9uRrpPRBuk5bZ');
        assert.instanceOf(composed.commit, Buffer);
        assert.instanceOf(composed.reveal, Buffer);
        assert.strictEqual(
            composed.commit.toString('hex'),
            '000162a2e0a0c8be705a58aea4230e99881f625e74cd085b6ef455b94ff144249b9a2f425e8f96015d54e4b02234a10b542573645f7ba55650f25eb931985cddcf451df77594b5b62a7642156b5cf73ecd0b54b803922c5365d58c372d33353995a1ef5b2ef889bdcd19a3101456379cc339642de1d623f6cade5af10addbcdd589d30e8bfe78702'
        );
        assert.strictEqual(
            composed.reveal.toString('hex'),
            '00954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f400060004746573745061796c6f616448657265'
        );
    });

    it('should compose Entry commit and reveal with manually provided signature', function() {
        const e = Entry.builder()
            .chainId('954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4')
            .extId('test', 'utf8')
            .content('PayloadHere', 'utf8')
            .timestamp(1523151053000)
            .build();

        const composed = composeEntry(
            e,
            'EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR',
            '2a7642156b5cf73ecd0b54b803922c5365d58c372d33353995a1ef5b2ef889bdcd19a3101456379cc339642de1d623f6cade5af10addbcdd589d30e8bfe78702'
        );
        assert.instanceOf(composed.commit, Buffer);
        assert.instanceOf(composed.reveal, Buffer);
        assert.strictEqual(
            composed.commit.toString('hex'),
            '000162a2e0a0c8be705a58aea4230e99881f625e74cd085b6ef455b94ff144249b9a2f425e8f96015d54e4b02234a10b542573645f7ba55650f25eb931985cddcf451df77594b5b62a7642156b5cf73ecd0b54b803922c5365d58c372d33353995a1ef5b2ef889bdcd19a3101456379cc339642de1d623f6cade5af10addbcdd589d30e8bfe78702'
        );
        assert.strictEqual(
            composed.reveal.toString('hex'),
            '00954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f400060004746573745061796c6f616448657265'
        );
    });

    it('should compute entry txId', function() {
        const entry = Entry.builder()
            .chainId('3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791')
            .extId('extId', 'utf8')
            .extId('extId++', 'utf8')
            .content('heloooooooooo', 'utf8')
            .timestamp(1523241150229)
            .build();

        const txId = computeEntryTxId(entry);
        assert.instanceOf(txId, Buffer);
        assert.strictEqual(
            txId.toString('hex'),
            'd6e9aa572959910d4a0712c0fd23025f5f1bf4fb74467d2677e10048dc441883'
        );
    });

    it('should convert to JS object', function() {
        const entry = Entry.builder()
            .chainId('3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791')
            .extId('extId', 'utf8')
            .extId('extId++', 'utf8')
            .content('heloooooooooo', 'utf8')
            .timestamp(1523241150229)
            .build();

        const obj = entry.toObject();
        assert.isObject(obj);
        assert.strictEqual(obj.chainId, entry.chainIdHex);
        assert.strictEqual(obj.content, entry.contentHex);
        assert.strictEqual(obj.timestamp, entry.timestamp);
        assert.deepEqual(
            Entry.builder(obj)
                .build()
                .hash(),
            entry.hash()
        );
    });
});
