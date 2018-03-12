const factom = require('./src/factom');
const {
    FactomCli
} = factom;
const Promise = require('bluebird');

const cli = new FactomCli({
    host: '52.202.51.229',
    port: 8088
});

async function aa() {
    const head = await cli.getDirectoryBlockHead();
    // const previous = await cli.getDirectoryBlock(head.previousBlockKeymr);
    
    // const f = await cli.getFactoidBlock(head.getFactoidBlockKeymr());
    // console.log(f.transactions.length)

    const ec = await cli.getEntryCreditBlock(head.getEntryCreditBlockKeymr());
    console.log(ec.objectCount)
    console.log(ec.entries.length)

    // const duration = head.timestamp - previous.timestamp;
    // const ebs = await Promise.map(
    //     head.getRegularEntryBlockRefs(),
    //     eb => cli.getEntryBlock(eb.keymr));

    // let entriesRevealed = 0;
    // let entriesSize = 0;
    // let maxEntrySize = 0;
    // for (let eb of ebs) {
    //     entriesRevealed += eb.entryRefs.length;
    //     const entries = await Promise.map(eb.entryRefs, ref => cli.getEntry(ref.entryHash));
    //     for (let entry of entries) {
    //         entriesSize += entry.size;
    //         if (entry.size < maxEntrySize) {
    //             maxEntrySize = entry.size;
    //         }
    //     }
    // }

    // console.log(entriesRevealed);
    // console.log(entriesRevealed / duration);
    // console.log(entriesSize);
    // console.log(entriesSize / entriesRevealed);
}

aa();