const Promise = require('bluebird'),
    { toHex } = require('./util');

function waitOnCommitAck(factomd, txid, timeout) {
    return waitOnAck(factomd, txid, 'c', 'commitdata', timeout, 'entry-commit');
}

function waitOnRevealAck(factomd, hash, chainId, timeout) {
    return waitOnAck(factomd, hash, toHex(chainId), 'entrydata', timeout, 'entry-reveal');
}

function waitOnFactoidTransactionAck(factomd, txId, timeout) {
    return waitOnAck(factomd, txId, 'f', null, timeout, 'factoid-transaction');
}

function waitOnAck(factomd, hash, chainId, ackResponseField, to, ackType) {
    if (!hash || !chainId) {
        return Promise.reject(
            new AckError('Invalid argument: hash or chain ID is missing', ackType, hash)
        );
    }

    const timeout = to || 60;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const clearId = setInterval(async function() {
            try {
                let error;
                const ackResponse = await factomd
                    .call('ack', { hash: hash, chainid: chainId })
                    .catch(function(e) {
                        clearInterval(clearId);
                        error = e;
                    });
                if (error) {
                    return reject(new AckError(error, ackType, hash));
                }

                const status = ackResponseField
                    ? ackResponse[ackResponseField].status
                    : ackResponse.status;

                if (status !== 'Unknown' && status !== 'NotConfirmed') {
                    clearInterval(clearId);
                    return resolve(status);
                }

                if (Date.now() - startTime > timeout * 1000) {
                    clearInterval(clearId);
                    return reject(new AckError('Timeout', ackType, hash));
                }
            } catch (e) {
                clearInterval(clearId);
                return reject(new AckError('Unexpected error: ' + e.message, ackType, hash));
            }
        }, 500);
    });
}

class AckError extends Error {
    constructor(error, ackType, hash) {
        super(`Acknowledgement of type [${ackType}] failed for [${hash}]: ${error}`);
        this.ackType = ackType;
        this.hash = hash;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AckError);
        }
    }
}

module.exports = {
    waitOnCommitAck,
    waitOnRevealAck,
    waitOnFactoidTransactionAck
};
