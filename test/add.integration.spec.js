const assert = require('chai').assert,
    { Entry, computeEntryTxId } = require('../src/entry'),
    { Chain, computeChainTxId } = require('../src/chain'),
    add = require('../src/add'),
    factomdjs = require('factomdjs');

const nconf = require('nconf').file({ file: `${__dirname}/config.json` });

const factomd = new factomdjs.Factomd();
factomd.setFactomNode(nconf.get('factomd-url'));
const PAYING_EC_ADDRESS = nconf.get('ec-private-address');

describe('Add chains and entries in Factom blockchain', function() {

    it('should add chain', async function() {
        this.timeout(10000);

        const e = Entry.builder()
            .timestamp(Date.now())
            .extId('factom.js')
            .extId('add chain test', 'utf8')
            .extId(Date.now().toString(), 'utf8')
            .build();

        const c = new Chain(e);

        const added = await add.addChain(factomd, c, PAYING_EC_ADDRESS);

        assert.equal(added.entryHash, c.firstEntry.hashHex());
        assert.equal(added.chainId, c.idHex);
        assert.equal(added.repeatedCommit, false);
        assert.equal(added.txId, computeChainTxId(c).toString('hex'));
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

        const added = await add.addEntry(factomd, e, PAYING_EC_ADDRESS);

        assert.equal(added.entryHash, e.hashHex());
        assert.equal(added.chainId, '3b6432afd44edb3086571663a377ead1d08123e4210e5baf0c8f522369079791');
        assert.equal(added.repeatedCommit, false);
        assert.equal(added.txId, computeEntryTxId(e).toString('hex'));
    });

});