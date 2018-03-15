const factom = require('./src/factom');
const {
    Entry,
    Chain,
    FactomCli
} = factom;
const Promise = require('bluebird');

const cli = new FactomCli({
    host: 'courtesy-node.factom.com',
    port: 80
});

// const e = Entry.builder()
//     .extId('my ext id 1')
//     .build();
// const c = new Chain(e);

// cli.addChain(c, 'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym').then(console.log)

async function aa() {
    const head = await cli.getDirectoryBlockHead();

    console.log(head.getEntryCreditBlockKeymr())
    const ecb = await cli.getEntryCreditBlock(head.getEntryCreditBlockKeymr());
    ecb.commits.forEach(c => console.log(c.ecPublicKey))
   
}

aa();