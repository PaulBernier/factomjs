const assert = require('chai').assert,
    { encodeVarInt } = require('../src/util');

describe('Test Util', function() {
    it('should encode to VarInt_F from number', function() {
        assert.deepEqual(encodeVarInt(0), Buffer.from([0]));
        assert.deepEqual(encodeVarInt(3), Buffer.from([3]));
        assert.deepEqual(encodeVarInt(127), Buffer.from([127]));
        assert.deepEqual(encodeVarInt(128), Buffer.from([129, 0]));
        assert.deepEqual(encodeVarInt(130), Buffer.from([129, 2]));
        assert.deepEqual(encodeVarInt(Math.pow(2, 16) - 1), Buffer.from([131, 255, 127]));
        assert.deepEqual(encodeVarInt(Math.pow(2, 16)), Buffer.from([132, 128, 0]));
        assert.deepEqual(encodeVarInt(Math.pow(2, 32) - 1), Buffer.from([143, 255, 255, 255, 127]));
        assert.deepEqual(encodeVarInt(Math.pow(2, 32)), Buffer.from([144, 128, 128, 128, 0]));
    });

    it('should encode to VarInt_F from string', function() {
        assert.deepEqual(encodeVarInt('0'), Buffer.from([0]));
        assert.deepEqual(encodeVarInt('3'), Buffer.from([3]));
        assert.deepEqual(encodeVarInt('127'), Buffer.from([127]));
        assert.deepEqual(encodeVarInt('128'), Buffer.from([129, 0]));
        assert.deepEqual(encodeVarInt('130'), Buffer.from([129, 2]));
        assert.deepEqual(encodeVarInt('65535'), Buffer.from([131, 255, 127]));
        assert.deepEqual(encodeVarInt('65536'), Buffer.from([132, 128, 0]));
        assert.deepEqual(encodeVarInt('4294967295'), Buffer.from([143, 255, 255, 255, 127]));
        assert.deepEqual(encodeVarInt('4294967296'), Buffer.from([144, 128, 128, 128, 0]));

        // 2^64 - 1
        assert.deepEqual(
            encodeVarInt('18446744073709551615'),
            Buffer.from([129, 255, 255, 255, 255, 255, 255, 255, 255, 127])
        );
    });

    it('should have correct length once encoded', function() {
        assert.lengthOf(encodeVarInt(0), 1);
        assert.lengthOf(encodeVarInt(1), 1);
        assert.lengthOf(encodeVarInt(127), 1);
        assert.lengthOf(encodeVarInt(128), 2);
        assert.lengthOf(encodeVarInt(16383), 2);
        assert.lengthOf(encodeVarInt(16384), 3);
        assert.lengthOf(encodeVarInt(2097151), 3);
        assert.lengthOf(encodeVarInt(2097152), 4);
        assert.lengthOf(encodeVarInt(268435455), 4);
        assert.lengthOf(encodeVarInt(268435456), 5);
        assert.lengthOf(encodeVarInt(34359738367), 5);
        assert.lengthOf(encodeVarInt(34359738368), 6);
        assert.lengthOf(encodeVarInt(4398046511103), 6);
        assert.lengthOf(encodeVarInt(4398046511104), 7);
        assert.lengthOf(encodeVarInt(562949953421311), 7);
        assert.lengthOf(encodeVarInt(562949953421312), 8);
        assert.lengthOf(encodeVarInt(Number.MAX_SAFE_INTEGER), 8);

        assert.lengthOf(encodeVarInt('72057594037927935'), 8);
        assert.lengthOf(encodeVarInt('72057594037927936'), 9);
        assert.lengthOf(encodeVarInt('9223372036854775807'), 9);
        assert.lengthOf(encodeVarInt('9223372036854775808'), 10);
        assert.lengthOf(encodeVarInt('18446744073709551615'), 10);
    });
});
