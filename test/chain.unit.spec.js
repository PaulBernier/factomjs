const assert = require('chai').assert,
    { Entry } = require('../src/entry'),
    { Chain, composeChainCommit, composeChainReveal, composeChain, computeChainTxId } = require('../src/chain');

describe('Test Chain', function() {

    it('should populate Chain attributes', function() {
        const entry = Entry.builder()
            .extId('test', 'utf8')
            .content('hello', 'utf8')
            .timestamp(1523072354)
            .build();

        const chain = new Chain(entry);

        assert.instanceOf(chain.id, Buffer);
        assert.equal(chain.id.toString('hex'), '954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4');
        assert.equal(chain.idHex, '954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4');
        assert.equal(chain.firstEntry.chainIdHex, '954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4');
    });

    it('should override chainId of Entry', function() {
        const entry = Entry.builder()
            .chainId('45f7ebb3be5217d0e2f1d14ab73121a66cdaad12a50b9863a45ee8ee9f3ab032')
            .extId('test', 'utf8')
            .content('hello', 'utf8')
            .timestamp(1523072354)
            .build();

        const chain = new Chain(entry);

        assert.equal(chain.idHex, '954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4');
        assert.equal(chain.firstEntry.chainIdHex, '954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4');
    });

    it('should compute EC cost', function() {
        const entry = Entry.builder()
            .chainId('45f7ebb3be5217d0e2f1d14ab73121a66cdaad12a50b9863a45ee8ee9f3ab032')
            .extId('test', 'utf8')
            .content('hello', 'utf8')
            .timestamp(1523072354)
            .build();

        const chain = new Chain(entry);

        assert.equal(chain.ecCost(), 11);
    });

    it('should compose Chain commit', function() {
        const entry = Entry.builder()
            .extId('my ext id 1784465577795', 'utf8')
            .content('first')
            .timestamp(1523227752000)
            .build();

        const chain = new Chain(entry);

        const commit = composeChainCommit(chain, 'Es2d1a3uPx7o5uXHmsCnSEK2EKatPA56n8RUFmW9uRrpPRBuk5bZ');
        assert.instanceOf(commit, Buffer);
        assert.equal(commit.toString('hex'),
            '000162a772f640448ee02e500a8e539bcf5c02e53f8b88fc1f81f0a87d0f18af94ab9384992b5c9db26ac6b20aba137815efc39cf19cee53de0baccc54ec4e6acc6b02ffe4b936b56a6bbae773f5b51001161efdeb0ba1e8447f3c45206119b40539e4325cc5be0b5d54e4b02234a10b542573645f7ba55650f25eb931985cddcf451df77594b5b6a523cd0ebb71b13ec133eeb93c084958f1ed6adef51ec9ec6323c543f91303739c9e5194972c5105929b7787d327755ab1b5cf1b2884d4877b8fdcbca1cfb00b');
    });

    it('should compose Chain reveal', function() {
        const entry = Entry.builder()
            .chainId('954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f4')
            .extId('test', 'utf8')
            .content('PayloadHere', 'utf8')
            .build();
        const chain = new Chain(entry);

        const reveal = composeChainReveal(chain);
        assert.instanceOf(reveal, Buffer);
        assert.equal(reveal.toString('hex'), '00954d5a49fd70d9b8bcdb35d252267829957f7ef7fa6c74f88419bdc5e82209f400060004746573745061796c6f616448657265');
    });

    it('should compose Chain commit and reveal', function() {
        const entry = Entry.builder()
            .extId('my ext id 1784465577795', 'utf8')
            .content('first')
            .timestamp(1523227752000)
            .build();
        const chain = new Chain(entry);

        const composed = composeChain(chain, 'Es2d1a3uPx7o5uXHmsCnSEK2EKatPA56n8RUFmW9uRrpPRBuk5bZ');
        assert.instanceOf(composed.commit, Buffer);
        assert.instanceOf(composed.reveal, Buffer);
        assert.equal(composed.commit.toString('hex'),
            '000162a772f640448ee02e500a8e539bcf5c02e53f8b88fc1f81f0a87d0f18af94ab9384992b5c9db26ac6b20aba137815efc39cf19cee53de0baccc54ec4e6acc6b02ffe4b936b56a6bbae773f5b51001161efdeb0ba1e8447f3c45206119b40539e4325cc5be0b5d54e4b02234a10b542573645f7ba55650f25eb931985cddcf451df77594b5b6a523cd0ebb71b13ec133eeb93c084958f1ed6adef51ec9ec6323c543f91303739c9e5194972c5105929b7787d327755ab1b5cf1b2884d4877b8fdcbca1cfb00b');
        assert.equal(composed.reveal.toString('hex'), '00fcfe632c6ab1a7c71448e256e0487c4cfc34ceac90e997de8c4fdf8485e9a0fd001900176d79206578742069642031373834343635353737373935');
    });

    it('should compute chain txId', function() {
        const e = Entry.builder()
            .extId('extId', 'utf8')
            .extId('extId++', 'utf8')
            .content('heloooooooooo', 'utf8')
            .timestamp(1523241150229)
            .build();

        const chain = new Chain(e);

        const txId = computeChainTxId(chain);
        assert.instanceOf(txId, Buffer);
        assert.equal(txId.toString('hex'), '3c22e7bb1b69818508d47056230317a9791158d96e7adb83b4596d77b6548a00');
    });
});