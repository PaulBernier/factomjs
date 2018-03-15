const assert = require('chai').assert,
    { EntryCreditBlock } = require('../src/blocks');

describe('Test Blocks', function() {

    it('should populate EntryCreditBlock', function() {
        const ecb = new EntryCreditBlock(require('./data/entry-credit-block.json'));

        assert.instanceOf(ecb, EntryCreditBlock);
        assert.equal(ecb.headerHash, 'b5ba1c807443113650ecc565db3023233a1ab1179674c788891fd89e083021ec');
        assert.equal(ecb.fullHash, '7772b118e454c2730286647801b7e5e543163db0dcfe96de64d08a4322614012');

        assert.equal(ecb.bodyHash, '164f3d2a9fdfbf5c5c6dfe0814ac9b522620ae486619d44d076eaea97e2e9482');
        assert.equal(ecb.previousHeaderHash, 'e716f2ef7baa5663e52aebeac46a6548c71fe4a2e7a9e687014afea862f2a836');
        assert.equal(ecb.previousFullHash, '952856e6e35afb8e5cfa8c893a6d383695562b4ea3c4981290c7da3fef03a2f7');
        assert.equal(ecb.height, 132099);
        assert.equal(ecb.headerExpansionArea, '');
        assert.equal(ecb.objectCount, 59);
        assert.equal(ecb.bodySize, 6733);
        assert.equal(ecb.fullHash, '7772b118e454c2730286647801b7e5e543163db0dcfe96de64d08a4322614012');

        assert.lengthOf(ecb.commits, 49);
        assert.lengthOf(ecb.getCommitsForMinute(1), 1);
        assert.lengthOf(ecb.getCommitsForMinute(2), 1);
        assert.lengthOf(ecb.getCommitsForMinute(3), 1);
        assert.lengthOf(ecb.getCommitsForMinute(4), 23);
        assert.lengthOf(ecb.getCommitsForMinute(5), 6);
        assert.lengthOf(ecb.getCommitsForMinute(6), 3);
        assert.lengthOf(ecb.getCommitsForMinute(7), 1);
        assert.lengthOf(ecb.getCommitsForMinute(8), 1);
        assert.lengthOf(ecb.getCommitsForMinute(9), 1);
        assert.lengthOf(ecb.getCommitsForMinute(10), 11);

        const commit = ecb.getCommitsForMinute(1)[0];
        assert.equal(commit.version, 0);
        assert.equal(commit.millis, 1521084063230);
        assert.ok(commit.entryHash.equals(Buffer.from('57cf6740c4f30ae39d71f75710fb4ea9c843d5c01755329a42ccab52034e1f79', 'hex')));
        assert.equal(commit.credits, 1);
        assert.ok(commit.signature.equals(Buffer.from('3e6e7d85a201b398d6bc056213f698d6fed7d1e82813105b7310b843618b228c2559dd1f3a22f1dd28d97f2fdcde86cff59415753fc4b826b2bfe5f7425b780d', 'hex')))
        assert.equal(commit.ecPublicKey, 'EC3PH2S2iXP4WpfoLuU5ETWRNfNZnmNUF5epWoFweYmBx9m4xK3z');
    });

});