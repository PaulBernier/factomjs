const crypto = require('crypto');

function sha256(data) {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest();
}

function sha256d(data) {
    return sha256(sha256(data));
}

function sha512(data) {
    const hash = crypto.createHash('sha512');
    hash.update(data);
    return hash.digest();
}

function toHex(arg) {
    return Buffer.isBuffer(arg) ? arg.toString('hex') : arg;
}

module.exports = {
    sha256,
    sha512,
    sha256d,
    toHex
};