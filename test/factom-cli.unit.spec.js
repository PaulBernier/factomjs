const assert = require('chai').assert;
const { FactomCli } = require('../src/factom-cli');

describe('Test FactomCli', function() {
    it('should set default factomd endpoint and port', function() {
        const cli = new FactomCli();
        assert.strictEqual(cli.factomd.httpCli.defaults.baseURL, 'http://localhost:8088');
    });

    it('should set factomd endpoint and port', function() {
        const cli = new FactomCli({
            host: '52.202.51.229',
            port: 1777
        });
        assert.strictEqual(cli.factomd.httpCli.defaults.baseURL, 'http://52.202.51.229:1777');
    });

    it('should set factomd endpoint and default port', function() {
        const cli = new FactomCli({
            host: '52.202.51.229'
        });
        assert.strictEqual(cli.factomd.httpCli.defaults.baseURL, 'http://52.202.51.229:8088');
    });

    it('should set factomd port and default endpoint', function() {
        const cli = new FactomCli({
            port: 9888
        });
        assert.strictEqual(cli.factomd.httpCli.defaults.baseURL, 'http://localhost:9888');
    });

    it('should set factomd endpoint and port', function() {
        const cli = new FactomCli({
            factomd: {
                host: '52.202.51.229',
                port: 1777
            }
        });
        assert.strictEqual(cli.factomd.httpCli.defaults.baseURL, 'http://52.202.51.229:1777');
    });

    it('should set walletd endpoint and port', function() {
        const cli = new FactomCli({
            walletd: {
                host: '52.202.51.229',
                port: 3111
            }
        });
        assert.strictEqual(cli.factomd.httpCli.defaults.baseURL, 'http://localhost:8088');
        assert.strictEqual(cli.walletd.httpCli.defaults.baseURL, 'http://52.202.51.229:3111');
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
        assert.strictEqual(cli.factomd.httpCli.defaults.baseURL, 'http://52.202.51.229:1777');
        assert.strictEqual(cli.walletd.httpCli.defaults.baseURL, 'http://88.202.51.229:5656');
    });

    it('should use https', function() {
        const cli = new FactomCli({
            factomd: {
                host: '52.202.51.229',
                protocol: 'https',
                rejectUnauthorized: false
            }
        });
        assert.strictEqual(cli.factomd.httpCli.defaults.baseURL, 'https://52.202.51.229:8088');
    });
});
