const {
    toHex
} = require('./util');

function waitOnCommitAck(factomd, txid, timeout) {
    return waitOnAck(factomd, txid, 'c', 'commitdata', timeout);
}

function waitOnRevealAck(factomd, hash, chainId, timeout) {
    return waitOnAck(factomd, hash, toHex(chainId), 'entrydata', timeout);
}

function waitOnAck(factomd, hash, chainId, ackResponseField, to) {
    if (!hash || !chainId) {
        return Promise.reject('Invalid argument: hash or chain ID is missing');
    }

    const timeout = to || 60;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const clearId = setInterval(async function () {
            process.stdout.write('.');
            const ackResponse = await factomd.ack(hash, chainId).catch(function (e) {
                clearInterval(clearId);
                process.stdout.write('\n');
                reject(e);
            });
            const status = ackResponse[ackResponseField].status;

            if (status !== 'Unknown' && status !== 'NotConfirmed') {
                clearInterval(clearId);
                process.stdout.write('\n');
                resolve(status);
            }

            if ((Date.now() - startTime) > timeout * 1000) {
                clearInterval(clearId);
                process.stdout.write('\n');
                reject('Ack timeout');
            }

        }, 500);
    });
}

module.exports = {
    waitOnCommitAck,
    waitOnRevealAck
};