const assert = require('chai').assert;
const { FactomCli } = require('../src/factom-cli');

describe('Test FactomCli', function() {

    it('should set default factomd endpoint and port', function() {
        const cli = new FactomCli();
        assert.equal(cli.factomd.apiEnpoint, 'http://localhost:8088/v2');
        assert.equal(cli.factomd.debugApiEnpoint, 'http://localhost:8088/debug');
    });

    it('should set factomd endpoint and port', function() {
        const cli = new FactomCli({
            host: '52.202.51.229',
            port: 1777
        });
        assert.equal(cli.factomd.apiEnpoint, 'http://52.202.51.229:1777/v2');
    });

    it('should set factomd endpoint and default port', function() {
        const cli = new FactomCli({
            host: '52.202.51.229'
        });
        assert.equal(cli.factomd.apiEnpoint, 'http://52.202.51.229:8088/v2');
    });

    it('should set factomd port and default endpoint', function() {
        const cli = new FactomCli({
            port: 9888
        });
        assert.equal(cli.factomd.apiEnpoint, 'http://localhost:9888/v2');
    });

    it('should set factomd endpoint and port', function() {
        const cli = new FactomCli({
            factomd: {
                host: '52.202.51.229',
                port: 1777
            }
        });
        assert.equal(cli.factomd.apiEnpoint, 'http://52.202.51.229:1777/v2');
    });

    it('should set walletd endpoint and port', function() {
        const cli = new FactomCli({
            walletd: {
                host: '52.202.51.229',
                port: 3111
            }
        });
        assert.equal(cli.factomd.apiEnpoint, 'http://localhost:8088/v2');
        assert.equal(cli.walletd.apiEnpoint, 'http://52.202.51.229:3111/v2');
    });

    it('should set both factomd and walletd endpoint and port', function() {
        const cli = new FactomCli({
            factomd: {
                host: '52.202.51.229',
                port: 1777
            },
            walletd: {
                host: '88.202.51.229',
                port: 5656
            }
        });
        assert.equal(cli.factomd.apiEnpoint, 'http://52.202.51.229:1777/v2');
        assert.equal(cli.walletd.apiEnpoint, 'http://88.202.51.229:5656/v2');
    });

});