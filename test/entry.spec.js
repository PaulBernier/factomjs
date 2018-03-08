const assert = require('chai').assert,
    { Entry, entryCost, entrySize } = require('../src/entry');

describe('Test Entry', function() {

    it('should populate Entry attributes', function() {
        const entry = Entry.Builder()
            .chainId('cfb5d93e747d20433e3b14603f90a5eb152d0399e7278f9671ecf9763f8780e8', 'hex')
            .extId('extId')
            .extId(Buffer.from('extId2'))
            .content('hello')
            .build();

        assert.instanceOf(entry.chainId, Buffer);
        assert.instanceOf(entry.extIds, Array);
        assert.instanceOf(entry.content, Buffer);
        assert.lengthOf(entry.extIds, 2);
        assert.lengthOf(entry.extIds[0], 5);
        assert.lengthOf(entry.extIds[1], 6);
    });

});