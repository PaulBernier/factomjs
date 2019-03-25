const assert = require('chai').assert;
const addresses = require('../src/addresses');

describe('Test addresses', function() {
    it('should validate addresses', function() {
        assert.isTrue(
            addresses.isValidAddress('EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD')
        );
        assert.isTrue(
            addresses.isValidAddress('FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG')
        );
        assert.isTrue(
            addresses.isValidAddress('Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym')
        );
        assert.isTrue(
            addresses.isValidAddress('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X')
        );
    });

    it('should invalidate addresses', function() {
        assert.isFalse(addresses.isValidAddress('NOPE'));
        assert.isFalse(addresses.isValidAddress('FAyolooooooooooooooo'));
        assert.isFalse(
            addresses.isValidAddress('Es32PjobTxPTd73dohEFRegtFRLv3X5WZ4FXEwNN8kE2pMDfeMym')
        );
    });

    it('should validate public addresses', function() {
        assert.isTrue(
            addresses.isValidPublicAddress('EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD')
        );
        assert.isTrue(
            addresses.isValidPublicAddress('FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG')
        );
        assert.isFalse(
            addresses.isValidPublicAddress('Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym')
        );
        assert.isFalse(
            addresses.isValidPublicAddress('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X')
        );
    });

    it('should validate private addresses', function() {
        assert.isTrue(
            addresses.isValidPrivateAddress('Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym')
        );
        assert.isTrue(
            addresses.isValidPrivateAddress('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X')
        );
        assert.isFalse(
            addresses.isValidPrivateAddress('EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD')
        );
        assert.isFalse(
            addresses.isValidPrivateAddress('FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG')
        );
    });

    it('should validate EC addresses', function() {
        assert.isTrue(
            addresses.isValidEcAddress('Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym')
        );
        assert.isTrue(
            addresses.isValidEcAddress('EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD')
        );
        assert.isFalse(
            addresses.isValidEcAddress('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X')
        );
        assert.isFalse(
            addresses.isValidEcAddress('FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG')
        );
    });

    it('should validate public EC addresses', function() {
        assert.isTrue(
            addresses.isValidPublicEcAddress('EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD')
        );
        assert.isFalse(
            addresses.isValidPublicEcAddress('Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym')
        );
        assert.isFalse(
            addresses.isValidPublicEcAddress('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X')
        );
        assert.isFalse(
            addresses.isValidPublicEcAddress('FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG')
        );
    });

    it('should validate private EC addresses', function() {
        assert.isTrue(
            addresses.isValidPrivateEcAddress(
                'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym'
            )
        );
        assert.isFalse(
            addresses.isValidPrivateEcAddress(
                'EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD'
            )
        );
        assert.isFalse(
            addresses.isValidPrivateEcAddress(
                'Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X'
            )
        );
        assert.isFalse(
            addresses.isValidPrivateEcAddress(
                'FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG'
            )
        );
    });

    it('should validate FCT addresses', function() {
        assert.isTrue(
            addresses.isValidFctAddress('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X')
        );
        assert.isTrue(
            addresses.isValidFctAddress('FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG')
        );
        assert.isFalse(
            addresses.isValidFctAddress('Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym')
        );
        assert.isFalse(
            addresses.isValidFctAddress('EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD')
        );
    });

    it('should validate public FCT addresses', function() {
        assert.isTrue(
            addresses.isValidPublicFctAddress(
                'FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG'
            )
        );
        assert.isFalse(
            addresses.isValidPublicFctAddress(
                'Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X'
            )
        );
        assert.isFalse(
            addresses.isValidPublicFctAddress(
                'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym'
            )
        );
        assert.isFalse(
            addresses.isValidPublicFctAddress(
                'EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD'
            )
        );
    });

    it('should validate private FCT addresses', function() {
        assert.isTrue(
            addresses.isValidPrivateFctAddress(
                'Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X'
            )
        );
        assert.isFalse(
            addresses.isValidPrivateFctAddress(
                'FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG'
            )
        );
        assert.isFalse(
            addresses.isValidPrivateFctAddress(
                'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym'
            )
        );
        assert.isFalse(
            addresses.isValidPrivateFctAddress(
                'EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD'
            )
        );
    });

    it('should get public address from already public address', function() {
        assert.strictEqual(
            addresses.getPublicAddress('EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD'),
            'EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD'
        );
        assert.strictEqual(
            addresses.getPublicAddress('FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG'),
            'FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG'
        );
    });

    it('should get public address from private address', function() {
        assert.strictEqual(
            addresses.getPublicAddress('Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym'),
            'EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD'
        );
        assert.strictEqual(
            addresses.getPublicAddress('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X'),
            'FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG'
        );
    });

    it('should get public Factoid address out of key', function() {
        const key = Buffer.from(
            '776b5cf08edea510711e2bc4a73f2b5118008906c5afd2e5786cf817fa279b80',
            'hex'
        );

        assert.strictEqual(
            addresses.keyToPublicFctAddress(key),
            'FA3qqJ2gFngBYc4AkvcBYWXTh6Bv1jdUMEmafxsLgw1jZ3dGq1ye'
        );
        assert.strictEqual(
            addresses.keyToPublicFctAddress(key).toString('hex'),
            'FA3qqJ2gFngBYc4AkvcBYWXTh6Bv1jdUMEmafxsLgw1jZ3dGq1ye'
        );
    });

    it('should get public Factoid address out of RCD hash', function() {
        const key = Buffer.from(
            '776b5cf08edea510711e2bc4a73f2b5118008906c5afd2e5786cf817fa279b80',
            'hex'
        );

        assert.strictEqual(
            addresses.rcdHashToPublicFctAddress(key),
            'FA2sfxwHGxz5kVXnKy2osu14mV8xZ3zhLs76DekB6LdgmBy5uz1q'
        );
        assert.strictEqual(
            addresses.rcdHashToPublicFctAddress(key).toString('hex'),
            'FA2sfxwHGxz5kVXnKy2osu14mV8xZ3zhLs76DekB6LdgmBy5uz1q'
        );
    });

    it('should get private Factoid address out of seed', function() {
        const seed = Buffer.from(
            '776b5cf08edea510711e2bc4a73f2b5118008906c5afd2e5786cf817fa279b80',
            'hex'
        );

        assert.strictEqual(
            addresses.seedToPrivateFctAddress(seed),
            'Fs2E6iXCLAKDiPqVtfxtuQCKsTe7o6DJFDnht1wST53s4ibtdu9f'
        );
        assert.strictEqual(
            addresses.seedToPrivateFctAddress(seed).toString('hex'),
            'Fs2E6iXCLAKDiPqVtfxtuQCKsTe7o6DJFDnht1wST53s4ibtdu9f'
        );
    });

    it('should get public Entry Credit address out of key', function() {
        const key = Buffer.from(
            '776b5cf08edea510711e2bc4a73f2b5118008906c5afd2e5786cf817fa279b80',
            'hex'
        );
        assert.strictEqual(
            addresses.keyToPublicEcAddress(key),
            'EC2fkBUHv13xLBhio8QfD69CjFXubnJa9z5kKzSk8GeWiapAw457'
        );
        assert.strictEqual(
            addresses.keyToPublicEcAddress(key).toString('hex'),
            'EC2fkBUHv13xLBhio8QfD69CjFXubnJa9z5kKzSk8GeWiapAw457'
        );
    });

    it('should get private Entry Credit address out of key', function() {
        const seed = Buffer.from(
            '776b5cf08edea510711e2bc4a73f2b5118008906c5afd2e5786cf817fa279b80',
            'hex'
        );

        assert.strictEqual(
            addresses.seedToPrivateEcAddress(seed),
            'Es3LFXNj5vHBw8c9kM98HKR69CJjUTyTPv4BdxoRbMQJ8zifxkgV'
        );
        assert.strictEqual(
            addresses.seedToPrivateEcAddress(seed).toString('hex'),
            'Es3LFXNj5vHBw8c9kM98HKR69CJjUTyTPv4BdxoRbMQJ8zifxkgV'
        );
    });

    it('should reject to get public key from public Factoid addresses', function() {
        assert.throws(
            () => addresses.addressToKey('FA3qqJ2gFngBYc4AkvcBYWXTh6Bv1jdUMEmafxsLgw1jZ3dGq1ye'),
            Error
        );
    });

    it('should extract cryptographic keys from addresses', function() {
        assert.strictEqual(
            addresses
                .addressToKey('EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD')
                .toString('hex'),
            '98fb8ffa591adc5f20ee4887affe06c18ca3b97cbda1a74a12944c1c26fdf864'
        );
        assert.strictEqual(
            addresses
                .addressToKey('Es3LFXNj5vHBw8c9kM98HKR69CJjUTyTPv4BdxoRbMQJ8zifxkgV')
                .toString('hex'),
            '776b5cf08edea510711e2bc4a73f2b5118008906c5afd2e5786cf817fa279b80'
        );
        assert.strictEqual(
            addresses
                .addressToKey('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X')
                .toString('hex'),
            'd48189215e445ea7e8dbf707c48922ab25a23552d8eae40cc5e9cd6b1a36963c'
        );
    });

    it('should generate random FCT address', function() {
        const randomAddress = addresses.generateRandomFctAddress();
        assert.isTrue(addresses.isValidPublicFctAddress(randomAddress.public));
        assert.isTrue(addresses.isValidPrivateFctAddress(randomAddress.private));
        assert.strictEqual(addresses.getPublicAddress(randomAddress.private), randomAddress.public);
    });

    it('should generate random EC address', function() {
        const randomAddress = addresses.generateRandomEcAddress();
        assert.isTrue(addresses.isValidPublicEcAddress(randomAddress.public));
        assert.isTrue(addresses.isValidPrivateEcAddress(randomAddress.private));
        assert.strictEqual(addresses.getPublicAddress(randomAddress.private), randomAddress.public);
    });
});
