const assert = require('chai').assert,
    { EntryCreditBlock, AdminBlock } = require('../src/blocks');

describe('Test Blocks', function() {
    it('should populate EntryCreditBlock', function() {
        const ecb = new EntryCreditBlock(require('./data/entry-credit-block.json'));

        assert.instanceOf(ecb, EntryCreditBlock);
        assert.strictEqual(
            ecb.headerHash,
            'b5ba1c807443113650ecc565db3023233a1ab1179674c788891fd89e083021ec'
        );
        assert.strictEqual(
            ecb.fullHash,
            '7772b118e454c2730286647801b7e5e543163db0dcfe96de64d08a4322614012'
        );

        assert.strictEqual(
            ecb.bodyHash,
            '164f3d2a9fdfbf5c5c6dfe0814ac9b522620ae486619d44d076eaea97e2e9482'
        );
        assert.strictEqual(
            ecb.previousHeaderHash,
            'e716f2ef7baa5663e52aebeac46a6548c71fe4a2e7a9e687014afea862f2a836'
        );
        assert.strictEqual(
            ecb.previousFullHash,
            '952856e6e35afb8e5cfa8c893a6d383695562b4ea3c4981290c7da3fef03a2f7'
        );
        assert.strictEqual(ecb.directoryBlockHeight, 132099);
        assert.strictEqual(ecb.headerExpansionArea, '');
        assert.strictEqual(ecb.objectCount, 59);
        assert.strictEqual(ecb.bodySize, 6733);

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
        assert.strictEqual(commit.version, 0);
        assert.strictEqual(commit.millis, 1521084063230);
        assert.strictEqual(
            commit.entryHash,
            '57cf6740c4f30ae39d71f75710fb4ea9c843d5c01755329a42ccab52034e1f79'
        );
        assert.strictEqual(commit.credits, 1);
        assert.strictEqual(
            commit.signature,
            '3e6e7d85a201b398d6bc056213f698d6fed7d1e82813105b7310b843618b228c2559dd1f3a22f1dd28d97f2fdcde86cff59415753fc4b826b2bfe5f7425b780d'
        );
        assert.strictEqual(
            commit.ecPublicKey,
            'EC3PH2S2iXP4WpfoLuU5ETWRNfNZnmNUF5epWoFweYmBx9m4xK3z'
        );
    });

    it('should populate M1 EntryCreditBlock', function() {
        const ecb = new EntryCreditBlock(require('./data/m1-entry-credit-block.json'));

        assert.instanceOf(ecb, EntryCreditBlock);
        assert.strictEqual(
            ecb.headerHash,
            'b9202c7882f5e3f11f806bdb9bec287f3674888c974fd1168710043ef1210052'
        );
        assert.strictEqual(
            ecb.fullHash,
            'c57abb3398fd718d8aef3d9e75aba3b0e051403be42eb0503730ad2fa68912a4'
        );

        assert.strictEqual(
            ecb.bodyHash,
            '4b0fcbae01e6aeff813b87a7b1e621eb210fad39135d7fd467636af037c6f83b'
        );
        assert.strictEqual(
            ecb.previousHeaderHash,
            '3ce8487a8e2c71ae4d2f130c7b7ebfe30bad632dcf6cad689b2a66de218a169a'
        );
        assert.strictEqual(
            ecb.previousFullHash,
            'f887c945240496c8ec865100bbdad292d034ee7881f88d7452b949e48c022227'
        );
        assert.strictEqual(ecb.directoryBlockHeight, 53037);
        assert.strictEqual(ecb.headerExpansionArea, '');
        assert.strictEqual(ecb.objectCount, 147);
        assert.strictEqual(ecb.bodySize, 18586);

        assert.lengthOf(ecb.commits, 135);

        const commit = ecb.getCommitsForMinute(1)[0];
        assert.strictEqual(commit.version, 0);
        assert.strictEqual(commit.millis, 1473040801697);
        assert.strictEqual(
            commit.entryHash,
            'df72b3c35f3ac80820b1196570d5028e66e04f8cb5a3b90b5dd486a60743e014'
        );
        assert.strictEqual(commit.credits, 1);
        assert.strictEqual(
            commit.signature,
            '07a2c43f156117ca3567dedd42533b66b718ab991a7b8fa86bbc0307b007a6e03837a38311b0b7515643e46714b8e6bc0a417cd4f899fe75cd4a29cfdfbef209'
        );
        assert.strictEqual(
            commit.ecPublicKey,
            'EC2LXsumFsDK36ueRdNZC5Q3zMhxCzoZXM52JRtsgCfyQUruYXLY'
        );
    });

    it('should parse AdminBlock', function() {
        const adminBlocks = require('./data/admin-blocks.json');

        const ablock1 = new AdminBlock(
            adminBlocks['15a887568ba62cfe0df15b27956a0c65a3862688e96d550519b3d3cb07b4c070']
        );
        assert.strictEqual(
            ablock1.lookupHash,
            '15a887568ba62cfe0df15b27956a0c65a3862688e96d550519b3d3cb07b4c070'
        );
        assert.strictEqual(
            ablock1.backReferenceHash,
            'a93018e3032bc783d317a9c38a3e927f40017a212b0c73b732386f14750174ec'
        );
        assert.strictEqual(ablock1.directoryBlockHeight, 31096);
        assert.strictEqual(
            ablock1.previousBackReferenceHash,
            'ed78955c3d3dc91d9cc55be8d30171b1685d2984c0940c89edc14ec2cce067ef'
        );
        assert.strictEqual(ablock1.headerExpansionSize, 0);
        assert.strictEqual(ablock1.headerExpansionArea, '');
        assert.strictEqual(ablock1.bodySize, 1032);
        assert.lengthOf(ablock1.entries, 8);
        assert.lengthOf(ablock1.getEntriesOfTypes(1), 8);
        assert.lengthOf(ablock1.getEntriesOfTypes('DIRECTORY_BLOCK_SIGNATURE'), 8);

        const ablock2 = new AdminBlock(
            adminBlocks['8a0a37bd123b0e210eeed8a6cad22fb742bd52d123d9b42af4e9901052a66a0d']
        );
        assert.lengthOf(ablock2.getEntriesOfTypes(1), 9);
        assert.lengthOf(ablock2.getEntriesOfTypes(6), 1);
        assert.lengthOf(ablock2.getEntriesOfTypes('ADD_REPLACE_MATRYOSHKA_HASH'), 1);
    });

    it('should parse AdminBlock entry type 1', function() {
        const adminBlocks = require('./data/admin-blocks.json');

        const ablock = new AdminBlock(
            adminBlocks['15a887568ba62cfe0df15b27956a0c65a3862688e96d550519b3d3cb07b4c070']
        );
        const entry = ablock.entries[0];
        assert.strictEqual(entry.adminId, 1);
        assert.strictEqual(entry.adminCode, 'DIRECTORY_BLOCK_SIGNATURE');
        assert.strictEqual(
            entry.identityChainId,
            '8888881c98618455b818cbe56b924374d87445ffdc7263363302292974dc3f94'
        );
        assert.strictEqual(
            entry.previousDirectoryBlockSignature.publicKey,
            '0de6369919f526225a14c38b7cf7081287e4029471e000b5c4336c041b233253'
        );
        assert.strictEqual(
            entry.previousDirectoryBlockSignature.signature,
            'ccdf572fd75b6618ce182096e395974717d0b1b9306b50660b8958f0e45961b495484894ea6b51cd8b77aed0909f965c0ee5566a2d54d58dc7c7f19a2dfb1f0a'
        );
    });

    it('should parse AdminBlock entry type 3', function() {
        const adminBlocks = require('./data/admin-blocks.json');

        const ablock = new AdminBlock(
            adminBlocks['8a0a37bd123b0e210eeed8a6cad22fb742bd52d123d9b42af4e9901052a66a0d']
        );
        const entry = ablock.getEntriesOfTypes('ADD_REPLACE_MATRYOSHKA_HASH')[0];
        assert.strictEqual(entry.adminId, 3);
        assert.strictEqual(entry.adminCode, 'ADD_REPLACE_MATRYOSHKA_HASH');
        assert.strictEqual(
            entry.identityChainId,
            '8888880732ebbec169b8e583c6ac6f9a348692aca6457cab5025e104fbadc282'
        );
        assert.strictEqual(
            entry.matryoshkaHash,
            '4e99c3725c51d4cecf7de78e3196166e6de12a12f68b437b9c43f71b459979c6'
        );
    });

    it('should parse AdminBlock entry type 5', function() {
        const adminBlocks = require('./data/admin-blocks.json');

        const ablock = new AdminBlock(
            adminBlocks['60df6174ef83475e54fe01f246710f8ea1cb29b2681433bbabd57ed8081f9739']
        );
        const entry = ablock.getEntriesOfTypes('ADD_FEDERATED_SERVER')[0];
        assert.strictEqual(entry.adminId, 5);
        assert.strictEqual(entry.adminCode, 'ADD_FEDERATED_SERVER');
        assert.strictEqual(
            entry.identityChainId,
            '8888881c98618455b818cbe56b924374d87445ffdc7263363302292974dc3f94'
        );
        assert.strictEqual(entry.directoryBlockHeight, 30943);
    });

    it('should parse AdminBlock entry type 6', function() {
        const adminBlocks = require('./data/admin-blocks.json');

        const ablock = new AdminBlock(
            adminBlocks['8a0a37bd123b0e210eeed8a6cad22fb742bd52d123d9b42af4e9901052a66a0d']
        );
        const entry = ablock.getEntriesOfTypes('ADD_AUDIT_SERVER')[0];
        assert.strictEqual(entry.adminId, 6);
        assert.strictEqual(entry.adminCode, 'ADD_AUDIT_SERVER');
        assert.strictEqual(
            entry.identityChainId,
            '8888880732ebbec169b8e583c6ac6f9a348692aca6457cab5025e104fbadc282'
        );
        assert.strictEqual(entry.directoryBlockHeight, 30896);
    });

    it('should parse AdminBlock entry type 7', function() {
        const adminBlocks = require('./data/admin-blocks.json');

        const ablock = new AdminBlock(
            adminBlocks['957919e27b7252423db4038db168bf4dfc3ce17b493ee0866e4fb91ae3c6edd3']
        );
        const entry = ablock.getEntriesOfTypes('REMOVE_FEDERATED_SERVER')[0];
        assert.strictEqual(entry.adminId, 7);
        assert.strictEqual(entry.adminCode, 'REMOVE_FEDERATED_SERVER');
        assert.strictEqual(
            entry.identityChainId,
            '888888b9f4fe1fea85d9ab55f84e1ec06aa135a905ef0865848d947c9c798f1f'
        );
        assert.strictEqual(entry.directoryBlockHeight, 30751);
    });

    it('should parse AdminBlock entry type 8', function() {
        const adminBlocks = require('./data/admin-blocks.json');

        const ablock = new AdminBlock(
            adminBlocks['8a0a37bd123b0e210eeed8a6cad22fb742bd52d123d9b42af4e9901052a66a0d']
        );
        const entry = ablock.getEntriesOfTypes('ADD_FEDERATED_SERVER_SIGNING_KEY')[0];
        assert.strictEqual(entry.adminId, 8);
        assert.strictEqual(entry.adminCode, 'ADD_FEDERATED_SERVER_SIGNING_KEY');
        assert.strictEqual(
            entry.identityChainId,
            '8888880732ebbec169b8e583c6ac6f9a348692aca6457cab5025e104fbadc282'
        );
        assert.strictEqual(
            entry.publicKey,
            '08ec6928e010c1694763d571e9a0142c697f524cc40d33ca7bd911d8685a1921'
        );
        assert.strictEqual(entry.keyPriority, 0);
        assert.strictEqual(entry.directoryBlockHeight, 30896);
    });

    it('should parse AdminBlock entry type 9', function() {
        const adminBlocks = require('./data/admin-blocks.json');

        const ablock = new AdminBlock(
            adminBlocks['8a0a37bd123b0e210eeed8a6cad22fb742bd52d123d9b42af4e9901052a66a0d']
        );
        const entry = ablock.getEntriesOfTypes('ADD_FEDERATED_SERVER_BITCOIN_ANCHOR_KEY')[0];
        assert.strictEqual(entry.adminId, 9);
        assert.strictEqual(entry.adminCode, 'ADD_FEDERATED_SERVER_BITCOIN_ANCHOR_KEY');
        assert.strictEqual(
            entry.identityChainId,
            '8888880732ebbec169b8e583c6ac6f9a348692aca6457cab5025e104fbadc282'
        );
        assert.strictEqual(entry.ecdsaPublicKey, '45185ad9f6453ac56a7572dbd9abbe2d421b0692');
        assert.strictEqual(entry.keyPriority, 0);
        assert.strictEqual(entry.keyType, 0);
    });

    it('should parse AdminBlock entry type 11', function() {
        const adminBlocks = require('./data/admin-blocks.json');

        const ablock = new AdminBlock(
            adminBlocks['8a0a37bd123b0e210eeed8a6cad22fb742bd52d123d9b42af4e9901052a66a0d']
        );
        const entry = ablock.getEntriesOfTypes('COINBASE_DESCRIPTOR')[0];
        assert.strictEqual(entry.adminId, 11);
        assert.strictEqual(entry.adminCode, 'COINBASE_DESCRIPTOR');
        assert.lengthOf(entry.outputs, 9);
        assert.strictEqual(
            entry.outputs[0].address,
            'FA3NCrf7W6CV4A7HKLQd4eveHhzfrayE3CXd85axLQrD4zYr4XbW'
        );
        assert.strictEqual(
            entry.outputs[0].rcdHash,
            'b834c8637b2b8c7f18e92243383391fba263a25d49f7a6280807e6824224dd28'
        );
        assert.strictEqual(entry.outputs[0].amount, 320000000);
    });

    it('should parse AdminBlock entry type 12', function() {
        const adminBlocks = require('./data/admin-blocks.json');

        const ablock = new AdminBlock(
            adminBlocks['dcd88117e8233efe279c371eb54bc0c73bc2c8627a9c5a8be3de74b8b9afa2d4']
        );
        const entry = ablock.getEntriesOfTypes('COINBASE_DESCRIPTOR_CANCEL')[0];
        assert.strictEqual(entry.adminId, 12);
        assert.strictEqual(entry.adminCode, 'COINBASE_DESCRIPTOR_CANCEL');
        assert.strictEqual(entry.descriptorHeight, 46460);
        assert.strictEqual(entry.descriptorIndex, 8);
    });

    it('should parse AdminBlock entry type 13', function() {
        const adminBlocks = require('./data/admin-blocks.json');

        const ablock = new AdminBlock(
            adminBlocks['8a0a37bd123b0e210eeed8a6cad22fb742bd52d123d9b42af4e9901052a66a0d']
        );
        const entry = ablock.getEntriesOfTypes('ADD_AUTHORITY_FACTOID_ADDRESS')[0];
        assert.strictEqual(entry.adminId, 13);
        assert.strictEqual(entry.adminCode, 'ADD_AUTHORITY_FACTOID_ADDRESS');
        assert.strictEqual(
            entry.identityChainId,
            '8888880732ebbec169b8e583c6ac6f9a348692aca6457cab5025e104fbadc282'
        );
        assert.strictEqual(
            entry.factoidAddress,
            'FA3NCrf7W6CV4A7HKLQd4eveHhzfrayE3CXd85axLQrD4zYr4XbW'
        );
        assert.strictEqual(
            entry.rcdHash,
            'b834c8637b2b8c7f18e92243383391fba263a25d49f7a6280807e6824224dd28'
        );
    });

    it('should parse AdminBlock entry type 14', function() {
        const adminBlocks = require('./data/admin-blocks.json');

        const ablock = new AdminBlock(
            adminBlocks['8a0a37bd123b0e210eeed8a6cad22fb742bd52d123d9b42af4e9901052a66a0d']
        );
        const entry = ablock.getEntriesOfTypes('ADD_AUTHORITY_EFFICIENCY')[0];
        assert.strictEqual(entry.adminId, 14);
        assert.strictEqual(entry.adminCode, 'ADD_AUTHORITY_EFFICIENCY');
        assert.strictEqual(
            entry.identityChainId,
            '8888880732ebbec169b8e583c6ac6f9a348692aca6457cab5025e104fbadc282'
        );
        assert.strictEqual(entry.efficiency, 50);
    });
});
