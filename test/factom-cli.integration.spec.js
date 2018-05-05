const assert = require('chai').assert;
const { FactomCli } = require('../src/factom-cli');

const nconf = require('nconf').file({ file: `${__dirname}/config.json` });
const FACTOMD_HOST = nconf.get('factomd-host'),
    FACTOMD_PORT = nconf.get('factomd-port');

describe('Test FactomCli', function() {

    it('should call raw factomd API', async function() {
        const cli = new FactomCli({
            host: FACTOMD_HOST,
            port: FACTOMD_PORT
        });

        assert.ok(await cli.factomdApi('properties'));
    });

    xit('should call raw walletd API', async function() {
        const cli = new FactomCli({
            walletd: {
                host: 'localhost',
                port: 8089
            }
        });

        assert.ok(await cli.walletdApi('properties'));
    });

});