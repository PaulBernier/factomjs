const assert = require('chai').assert;
const addresses = require('../src/addresses');

describe('Test addresses', function() {

    it('should validate addresses', function() {
        assert.isTrue(addresses.isValidAddress('EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD'));
        assert.isTrue(addresses.isValidAddress('FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG'));
        assert.isTrue(addresses.isValidAddress('Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym'));
        assert.isTrue(addresses.isValidAddress('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X'));
    });

    it('should invalidate addresses', function() {
        assert.isFalse(addresses.isValidAddress('NOPE'));
        assert.isFalse(addresses.isValidAddress('FAyolooooooooooooooo'));
        assert.isFalse(addresses.isValidAddress('Es32PjobTxPTd73dohEFRegtFRLv3X5WZ4FXEwNN8kE2pMDfeMym'));
    });

    it('should get public address from already public address', function() {
        assert.equal(addresses.getPublicAddress('EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD'), 'EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD');
        assert.equal(addresses.getPublicAddress('FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG'), 'FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG');
    });

    it('should get public address from private address', function() {
        assert.equal(addresses.getPublicAddress('Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym'), 'EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD');
        assert.equal(addresses.getPublicAddress('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X'), 'FA29jNtT88wGjs9YLQch8ur4VFaTDkuiDwWe1YmksPDJuh3tAczG');
    });

});