const sinon = require('sinon'),
    axios = require('axios'),
    { FactomdCli } = require('../src/apis-cli');

describe('Test API clients', function () {
    it('should retry calls with default strategy', async function () {
        this.timeout(4000);

        const httpCli = axios.create();
        const mock = sinon.mock(httpCli);

        mock.expects('post')
            .exactly(4)
            .returns(Promise.reject(new Error('error')));

        const cli = new FactomdCli();
        cli.httpCli = httpCli;

        try {
            await cli.call('properties');
        } catch (e) {
            mock.verify();
            return;
        }

        throw new Error('Should have thrown');
    });

    it('should override retry strategy', async function () {
        const httpCli = axios.create();
        const mock = sinon.mock(httpCli);

        mock.expects('post')
            .exactly(2)
            .returns(Promise.reject(new Error('error')));

        const cli = new FactomdCli();
        cli.httpCli = httpCli;

        try {
            await cli.call('properties', null, { retry: { retries: 1 } });
        } catch (e) {
            mock.verify();
            return;
        }

        throw new Error('Should have thrown');
    });
});
