const axios = require('axios'),
    HttpsAgent = require('https').Agent,
    Promise = require('bluebird'),
    retry = require('retry');

const DEBUG_API_CALLS = new Set([
    'holding-queue',
    'network-info',
    'predictive-fer',
    'audit-servers',
    'federated-servers',
    'configuration',
    'process-list',
    'authorities',
    'reload-configuration',
    'drop-rate',
    'set-drop-rate',
    'delay',
    'set-delay',
    'summary',
    'messages'
]);

const DEFAULT_RETRY_STRATEGY = {
    retries: 3,
    factor: 2,
    minTimeout: 500,
    maxTimeout: 2000
};

class ApiError extends Error {
    constructor(method, params, error) {
        const message = [`API call to [${method}] `];
        if (typeof params === 'object') {
            message.push(`with params ${JSON.stringify(params)} `);
        }
        message.push(`got rejected: ${error.message} (code: ${error.code})`);
        super(message.join(''));
        this.code = error.code;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }
}

/**
 * Describe the options of connection to factomd or factom-walletd.
 * @typedef {Object} ConnectionOptions
 * @property {string} [host=localhost] - IP or hostname. Default to localhost.
 * @property {number} [port=8088|8089] - Port. Default to 8088 for factomd and 8089 for walletd.
 * @property {string} [path=/v2] - Path to V2 API. Default to /v2.
 * @property {string} [debugPath=/debug] - Path to debug API. Default to /debug.
 * @property {string} [user] - User for basic authentication.
 * @property {string} [password] - Password for basic authentication.
 * @property {string} [protocol=http] - http or https. Default to http.
 * @property {number} [timeout=0] - Specifies the number of milliseconds before any API request times out.
 * If a request takes longer than `timeout`, the request will be aborted. Default is `0` (no timeout).
 * @property {boolean} [rejectUnauthorized=true] - Set to false to allow connection to a node with a self-signed certificate. Default to true.
 * @property {Object} [retry] - Retry strategy. For the detail of the options see {@link https://github.com/tim-kos/node-retry#retrytimeoutsoptions}. Default to {retries: 3, factor: 2, minTimeout: 500, maxTimeout: 2000}
 * @example
 * const cli = new FactomdCli({
 *      host: '52.202.51.228',
 *      port: 8088,
 *      path: '/',
 *      debugPath: '/debug',
 *      user: 'paul',
 *      password: 'pwd',
 *      protocol: 'https',
 *      rejectUnauthorized: false,
 *      timeout: 5000,
 *      retry: {
 *          retries: 3,
 *          factor: 2,
 *          minTimeout: 500,
 *          maxTimeout: 2000
 *      }
 * });
 */

class BaseCli {
    constructor(conf, defaultPort) {
        const host = conf.host || 'localhost';
        const protocol = conf.protocol || 'http';
        const port = conf.port || defaultPort;
        const baseURL = `${protocol}://${host}:${port}`;

        const httpCliOptions = {
            baseURL,
            headers: { 'Content-Type': 'application/json' }
        };

        if (typeof conf.user === 'string' && conf.user !== '') {
            httpCliOptions.auth = {
                username: conf.user,
                password: conf.password || ''
            };
            httpCliOptions.withCredentials = true;
        }

        if (protocol === 'https' && typeof conf.rejectUnauthorized !== 'undefined') {
            httpCliOptions.httpsAgent = new HttpsAgent({
                rejectUnauthorized: conf.rejectUnauthorized
            });
        }

        if (conf.timeout) {
            httpCliOptions.timeout = parseInt(conf.timeout);
        }

        this.httpCli = axios.create(httpCliOptions);
        this.path = conf.path || '/v2';

        this.apiCounter = newCounter();
        this.retry = conf.retry || DEFAULT_RETRY_STRATEGY;

        this.cookies = {};
    }

    _processCookieHeader(cookieHeader) {
        if (Array.isArray(cookieHeader)) {
            // Add or update cookie values
            cookieHeader
                .map(c => c.split(';')[0])
                .forEach(c => {
                    const keyVal = c.split('=');
                    this.cookies[keyVal[0]] = keyVal[1];
                });
            // Set Axios Cookie header with the updated cookies
            this.httpCli.defaults.headers.Cookie = Object.entries(this.cookies)
                .map(c => `${c[0]}=${c[1]}`)
                .join(';');
        }
    }

    call(url, method, params, requestConfig) {
        const { timeout, retry: retryConfig } = requestConfig || {};

        return new Promise((resolve, reject) => {
            const operation = retry.operation(retryConfig || this.retry);

            const data = {
                jsonrpc: '2.0',
                id: this.apiCounter(),
                method: method,
                params: params
            };

            operation.attempt(() => {
                this.httpCli
                    .post(url, data, { timeout })
                    .then(r => {
                        this._processCookieHeader(r.headers['set-cookie']);
                        resolve(r.data.result);
                    })
                    .catch(error => handleCallError({ error, reject, method, params, operation }));
            });
        });
    }
}

function handleCallError({ error, reject, method, params, operation }) {
    let rejectionMessage;
    if (error.response) {
        const errorData = error.response.data;
        switch (error.response.status) {
            case 400:
                // Bad requests should not be retried
                if (typeof errorData.error === 'object') {
                    // JSON RPC error
                    return reject(new ApiError(method, params, errorData.error));
                } else {
                    return reject(new Error(errorData));
                }
            case 401:
                // No need to retry unauthorized access errors
                return reject(new Error(error.response.data));
            default:
                rejectionMessage =
                    typeof errorData === 'object' ? JSON.stringify(errorData) : errorData;
        }
    } else {
        rejectionMessage = error.message;
    }

    const rejection = new Error(rejectionMessage);
    if (!operation.retry(rejection)) {
        // If there is no more retry left, reject the promise with the most common error
        return reject(operation.mainError());
    }
}

function newCounter() {
    let i = 0;
    return function() {
        return ++i;
    };
}

/**
 * Factomd API client.
 * @param {ConnectionOptions} [conf] - Factomd connection options.
 */
class FactomdCli extends BaseCli {
    constructor(conf) {
        const configuration = conf || {};
        super(configuration, 8088);
        this.debugPath = configuration.debugPath || '/debug';
    }

    /**
     * Make a call to factomd API. See {@link https://docs.factom.com/api#factomd-api}.
     * @async
     * @param {string} method - Factomd API method name.
     * @param {Object} [params] - The object that the factomd API is expecting.
     * @param {Object} [requestConfig] - Request configuration.
     * @param {number} [requestConfig.timeout] - Timeout in milliseconds for the request. Override the timeout set at the instance level.
     * @param {Object} [requestConfig.retry] - Retry strategy. For the detail of the options see {@link https://github.com/tim-kos/node-retry#retrytimeoutsoptions}.
     * Override the retry strategy set at the instance level.
     * @returns {Promise<Object>} - Factomd API response.
     */
    call(method, params, requestConfig) {
        const url = DEBUG_API_CALLS.has(method) ? this.debugPath : this.path;
        return super.call(url, method, params, requestConfig);
    }
}

/**
 * Walletd API client.
 * @param {ConnectionOptions} [conf] - Walletd connection options.
 */
class WalletdCli extends BaseCli {
    constructor(conf) {
        const configuration = conf || {};
        super(configuration, 8089);
    }

    /**
     * Make a call to factom-walletd API. See {@link https://docs.factom.com/api#factom-walletd-api}.
     * @async
     * @param {string} method - Walletd API method name.
     * @param {Object} [params] - The object that the walletd API is expecting.
     * @param {Object} [requestConfig] - Request configuration.
     * @param {number} [requestConfig.timeout] - Timeout in milliseconds for the request. Override the timeout set at the instance level.
     * @param {Object} [requestConfig.retry] - Retry strategy. For the detail of the options see {@link https://github.com/tim-kos/node-retry#retrytimeoutsoptions}.
     * Override the retry strategy set at the instance level.
     * @returns {Promise<Object>} - Walletd API response.
     */
    call(method, params, requestConfig) {
        return super.call(this.path, method, params, requestConfig);
    }
}

module.exports = {
    FactomdCli,
    WalletdCli
};
