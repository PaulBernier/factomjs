const { toHex } = require('./util');

function waitOnCommitAck(factomd, txid, timeout) {
    return waitOnAck(factomd, txid, 'c', 'commitdata', timeout);
}

function waitOnRevealAck(factomd, hash, chainId, timeout) {
    return waitOnAck(factomd, hash, toHex(chainId), 'entrydata', timeout);
}

function waitOnFactoidTransactionAck(factomd, txId, timeout) {
    return waitOnAck(factomd, txId, 'f', null, timeout);
}

function waitOnAck(factomd, hash, chainId, ackResponseField, to) {
    if (!hash || !chainId) {
        return Promise.reject('Invalid argument: hash or chain ID is missing');
    }

    const timeout = to || 60;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const clearId = setInterval(async function() {
            let error;
            const ackResponse = await factomd.ack(hash, chainId).catch(function(e) {
                clearInterval(clearId);
                error = e;
            });
            if (error) {
                return reject(error);
            }

            const status = ackResponseField ? ackResponse[ackResponseField].status : ackResponse.status;

            if (status !== 'Unknown' && status !== 'NotConfirmed') {
                clearInterval(clearId);
                resolve(status);
            }

            if ((Date.now() - startTime) > timeout * 1000) {
                clearInterval(clearId);
                reject('Ack timeout');
            }

        }, 500);
    });
}

module.exports = {
    waitOnCommitAck,
    waitOnRevealAck,
    waitOnFactoidTransactionAck
};