const assert = require('chai').assert,
    BN = require('bn.js'),
    { encodeVarInt } = require('../src/util');

describe('Test Util', function() {

    it('should encode to VarInt_F', function() {
        assert.isTrue(encodeVarInt(0).equals(Buffer.from([0])));
        assert.isTrue(encodeVarInt(3).equals(Buffer.from([3])));
        assert.isTrue(encodeVarInt(127).equals(Buffer.from([127])));
        assert.isTrue(encodeVarInt(128).equals(Buffer.from([129, 0])));
        assert.isTrue(encodeVarInt(130).equals(Buffer.from([129, 2])));
        assert.isTrue(encodeVarInt(Math.pow(2, 16) - 1).equals(Buffer.from([131, 255, 127])));
        assert.isTrue(encodeVarInt(Math.pow(2, 16)).equals(Buffer.from([132, 128, 0])));
        assert.isTrue(encodeVarInt(Math.pow(2, 32) - 1).equals(Buffer.from([143, 255, 255, 255, 127])));
        assert.isTrue(encodeVarInt(Math.pow(2, 32)).equals(Buffer.from([144, 128, 128, 128, 0])));

        const bn = (new BN(2)).pow(new BN(64)).sub(new BN(1)).toString(10);
        assert.isTrue(encodeVarInt(bn).equals(Buffer.from([129, 255, 255, 255, 255, 255, 255, 255, 255, 127])));

    });
});