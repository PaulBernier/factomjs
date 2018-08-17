const nacl = require('tweetnacl/nacl-fast').sign,
    Long = require('long'),
    crypto = require('crypto');

const RCD_TYPE_1 = Buffer.from('01', 'hex'),
    MSB = Long.fromString('8000000000000000', true, 16);

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

function secretToPublicKey(secret) {
    const key = nacl.keyPair.fromSeed(secret);
    return Buffer.from(key.publicKey);
}

// Reference implementation:
// https://github.com/FactomProject/factomd/blob/master/common/primitives/varint.go#L78-L105
function encodeVarInt(val) {
    const bytes = [];

    if (val === 0 || val === '0') {
        bytes.push(0);
    }

    let h = Long.fromValue(val, true);
    let start = false;

    if (!h.and(MSB).isZero()) {
        bytes.push(0x81);
        start = true;
    }

    for (let i = 0; i < 9; ++i) {
        let b = h.shiftRightUnsigned(56).toNumber();

        if (b || start) {
            start = true;
            if (i !== 8) {
                b = b | 0x80;
            } else {
                b = b & 0x7F;
            }
            bytes.push(b);
        }
        h = h.shiftLeft(7);
    }

    return Buffer.from(bytes);
}

function isIterable(obj) {
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

const flatMap = (a, f) => [].concat(...a.map(f));

module.exports = {
    RCD_TYPE_1,
    sha256,
    sha512,
    sha256d,
    toHex,
    encodeVarInt,
    isIterable,
    flatMap,
    secretToPublicKey
};