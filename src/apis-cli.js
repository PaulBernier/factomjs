const axios = require('axios'),
    Promise = require('bluebird'),
    retry = require('retry');

const DEBUG_API_CALLS = new Set([
    'holding-queue', 'network-info', 'predictive-fer', 'audit-servers', 'federated-servers', 'configuration', 'process-list', 'authorities',
    'reload-configuration', 'drop-rate', 'set-drop-rate', 'current-minute', 'delay', 'set-delay', 'summary', 'messages'
]);

const DEFAULT_RETRY_STRATEGY = {
    retries: 4,
    factor: 2,
    minTimeout: 500,
    maxTimeout: 2000
};

class ApiError extends Error {
    constructor(method, params, error) {
        super(`API call to [${method}] with params ${JSON.stringify(params)} got rejected: ${error.message} (code: ${error.code})`);
        this.code = error.code;
        Error.captureStackTrace(this, ApiError);
    }
}

class BaseCli {

    constructor(conf, defaultPort) {
        const host = conf.host || 'localhost';
        const protocol = conf.protocol || 'http';
        const port = conf.port || defaultPort;
        const baseURL = `${protocol}://${host}:${port}`;
        const user = conf.user || '';
        const password = conf.password || '';
        const authentication = Buffer.from(`${user}:${password}`).toString('base64');

        this.httpCli = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authentication}`
            }
        });

        this.apiCounter = newCounter();
        this.retry = conf.retry || DEFAULT_RETRY_STRATEGY;
    }

    call(url, method, params) {
        return new Promise((resolve, reject) => {
            const operation = retry.operation(this.retry);

            const data = {
                jsonrpc: '2.0',
                id: this.apiCounter(),
                method: method,
                params: params
            };

            operation.attempt(() => {
                this.httpCli.post(url, data)
                    .then(r => resolve(r.data.result))
                    .catch(function(error) {
                        let rejection;
                        if (error.response) {
                            if (error.response.status === 400) {
                                // API bad requests should not be retried
                                return reject(new ApiError(method, params, error.response.data.error));
                            } else {
                                rejection = new Error(error.response.data);
                            }
                        } else {
                            rejection = new Error(error.message);
                        }

                        // If there is no more retry left, reject the promise with the most common error
                        if (!operation.retry(rejection)) {
                            return reject(operation.mainError());
                        }
                    });
            });
        });
    }
}

function newCounter() {
    let i = 0;
    return function() {
        return ++i;
    };
}

class FactomdCli extends BaseCli {

    constructor(conf) {
        const configuration = conf || {};
        super(configuration, 8088);
    }

    call(method, params) {
        const url = DEBUG_API_CALLS.has(method) ? '/debug' : '/v2';
        return super.call(url, method, params);
    }
}

class WalletdCli extends BaseCli {

    constructor(conf) {
        const configuration = conf || {};
        super(configuration, 8089);
    }

    call(method, params) {
        return super.call('/v2', method, params);
    }
}

module.exports = {
    FactomdCli,
    WalletdCli
};