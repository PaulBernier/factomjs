const factom = require('./src/factom');
const {
    Entry,
    Chain,
    FactomCli
} = factom;
const Promise = require('bluebird');

const cli = new FactomCli({
    host: '52.202.51.229',
    port: 8088
});

// const e = Entry.builder()
//     .extId('my ext id 1')
//     .build();
// const c = new Chain(e);

// cli.addChain(c, 'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym').then(console.log)

async function aa() {
    const head = await cli.getEntryBlock('3944669331eea620f7f3ec67864a03a646a104f17e36aec3e0f5bdf638f16883').catch(console.error);
    console.log(head)
    // const head2 = await cli.getEntryCreditBlock(21628).catch(console.error);

    // const a = await cli.factomdApi('fblock-by-height', 21658).catch(console.error);
    // console.log(a)
    const b = await cli.factomdApi('entry-block', '3944669331eea620f7f3ec67864a03a646a104f17e36aec3e0f5bdf638f16883').catch(console.error);
    console.log(JSON.stringify(b, null, 4))
}

aa();