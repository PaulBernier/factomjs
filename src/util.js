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

module.exports = {
    sha256,
    sha512,
    sha256d
};