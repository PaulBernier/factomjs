const {
    Entry
} = require('./entry.js'), {
    Chain
} = require('./chain');

const entry = new Entry.Builder()
    .content('glglg', 'ascii')
    .extIds(['helooo'])
    .build();

console.log(entry)

const chain = new Chain(entry);

console.log(chain)
// console.log(chain.firstEntry.hash)
// console.log(chain.firstEntry.marshalBinary)