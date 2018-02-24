function waitOnCommitAck(txid, timeout) {
    return waitOnAck(txid, 'c', 'commitdata', timeout);
}

function waitOnRevealAck(hash, chainId, timeout) {
    return waitOnAck(hash, chainId, 'entrydata', timeout);
}

function waitOnAck(hash, chainId, ackResponseField, to) {
    if (!hash || !chainId) {
        return Promise.reject('Invalid argument: hash or chain ID is missing');
    }

    const timeout = to || 60;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const clearId = setInterval(async function () {
            process.stdout.write('.');
            const ackResponse = await factomdjs.ack(hash, chainId).catch(function (e) {
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



