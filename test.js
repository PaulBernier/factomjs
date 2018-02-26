const factom = require('./src/factom');
const {Entry, Chain, FactomCli} = factom;

const entry = new Entry.Builder()
    .content('88888', 'ascii')
    .extIds(['helooo'])
    .build();


const chain = new Chain(entry);

const cli = new FactomCli({
    host: 'localhost',
    port: 8088
});

// cli.addChain(chain, 'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym').then(console.log);

cli.getFirstEntry(chain.chainId).then(console.log);

