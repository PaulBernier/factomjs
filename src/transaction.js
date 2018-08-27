// https://github.com/FactomProject/FactomDocs/blob/master/factomDataStructureDetails.md#factoid-transaction
// https://github.com/FactomProject/factoid/blob/3ee9763f86849036723d1b059216e08a6d34b184/transaction.go

const nacl = require('tweetnacl/nacl-fast').sign,
    base58 = require('base-58'),
    { RCD_TYPE_1, encodeVarInt, sha256, sha256d, flatMap } = require('./util'),
    { MAX_TRANSACTION_SIZE } = require('./constant'),
    { isValidFctAddress, isValidPublicAddress, getPublicAddress, addressToKey, addressToRcd } = require('./addresses');

class TransactionAddress {
    constructor(address, amount) {
        if (!isValidPublicAddress(address)) {
            throw new TypeError('Address must be a valid Factoid or EntryCredit public address.');
        }
        validateAmount(amount);

        this.address = address;
        this.amount = amount;
        Object.freeze(this);
    }

    marshalBinary() {
        return Buffer.concat([encodeVarInt(this.amount), Buffer.from(base58.decode(this.address).slice(2, 34))]);
    }
}

function validateAmount(amount) {
    if (Number.isSafeInteger(amount)) {
        if (amount < 0) {
            throw new Error('Amount must be a positive number.');
        }
    } else {
        throw new Error('Amount must be a safe integer (less than 2^53 - 1).');
    }
}

class Transaction {
    constructor(builder, blockContext) {
        if (builder instanceof TransactionBuilder) {
            this.timestamp = builder._timestamp || Date.now();
            this.inputs = builder._inputs;
            this.factoidOutputs = builder._factoidOutputs;
            this.entryCreditOutputs = builder._entryCreditOutputs;

            this.marshalBinarySig = marshalBinarySig(this.timestamp, this.inputs, this.factoidOutputs, this.entryCreditOutputs);
            this.id = sha256(this.marshalBinarySig).toString('hex');

            if (builder._keys.length !== 0) {
                this.rcds = builder._keys.map(key => Buffer.concat([RCD_TYPE_1, Buffer.from(key.publicKey)]));
                this.signatures = builder._keys.map(key => Buffer.from(nacl.detached(this.marshalBinarySig, key.secretKey)));
            } else {
                this.rcds = builder._rcds;
                this.signatures = builder._signatures;

                if (this.rcds.length !== 0 && this.signatures.length !== 0) {
                    // Validate manually entered RCDs and signatures
                    validateRcds(this.inputs, this.rcds);
                    validateSignatures(this.marshalBinarySig, this.rcds, this.signatures);
                }
            }

        } else if (typeof builder === 'object') {
            // Building transaction from the result of transaction API
            this.id = builder.txid;
            this.timestamp = builder.millitimestamp;
            this.inputs = builder.inputs.map(input => new TransactionAddress(input.useraddress, input.amount));
            this.factoidOutputs = builder.outputs.map(output => new TransactionAddress(output.useraddress, output.amount));
            this.entryCreditOutputs = builder.outecs.map(output => new TransactionAddress(output.useraddress, output.amount));
            this.rcds = builder.rcds.map(rcd => Buffer.from(rcd, 'hex'));
            this.signatures = flatMap(builder.sigblocks, sb => sb.signatures).map(signature => Buffer.from(signature, 'hex'));
            this.blockContext = blockContext;
        } else {
            throw new Error('Use `Transaction.builder()` syntax to create a new Transaction.');
        }

        if (this.signatures.length !== 0 && this.inputs.length !== this.signatures.length) {
            throw new Error('All inputs must be signed or none of them.');
        }

        this.totalInputs = this.inputs.reduce((acc, value) => acc + value.amount, 0);
        this.totalFactoidOutputs = this.factoidOutputs.reduce((acc, value) => acc + value.amount, 0);
        this.totalEntryCreditOutputs = this.entryCreditOutputs.reduce((acc, value) => acc + value.amount, 0);
        const totalOutputs = this.totalFactoidOutputs + this.totalEntryCreditOutputs;

        if (!Number.isSafeInteger(this.totalInputs) || !Number.isSafeInteger(totalOutputs)) {
            throw new Error('Total inputs/outputs are not safe integers (too big to be handled by the library).');
        }

        this.feesPaid = Math.max(this.totalInputs - totalOutputs, 0); // Coinbase transactions have 0 fee

        Object.freeze(this);
    }

    isSigned() {
        return this.signatures.length !== 0;
    }

    validateFees(ecRate) {
        return this.computeRequiredFees(ecRate) <= this.feesPaid;
    }


    computeRequiredFees(ecRate, opts) {
        return this.computeEcRequiredFees(opts) * ecRate;
    }

    computeEcRequiredFees(opts) {
        const options = opts || {};

        let size, numberOfSignatures;
        if (this.isSigned()) {
            size = this.marshalBinary().length;
            numberOfSignatures = this.signatures.length;
        } else {
            if (typeof options.rcdSignatureLength === 'number' && typeof options.numberOfSignatures === 'number') {
                size = this.marshalBinarySig.length + options.rcdSignatureLength;
                numberOfSignatures = options.numberOfSignatures;
            } else if (options.rcdType === 1) {
                size = this.marshalBinarySig.length + this.inputs.length * 97;
                numberOfSignatures = this.inputs.length;
            } else {
                throw new Error('Missing parameters to compute fees of unsigned transaction.');
            }
        }

        if (size > MAX_TRANSACTION_SIZE) {
            throw new Error(`Transaction size is bigger than the maximum (${MAX_TRANSACTION_SIZE} bytes).`);
        }

        let fee = Math.floor((size + 1023) / 1024);
        fee += 10 * (this.factoidOutputs.length + this.entryCreditOutputs.length);
        fee += numberOfSignatures;

        return fee;
    }

    marshalBinary() {
        if (!this.isSigned()) {
            throw new Error('Cannot marshal an unsigned Transaction.');
        }

        const data = this.marshalBinarySig;
        const result = [data];
        for (let i = 0; i < this.rcds.length; ++i) {
            result.push(this.rcds[i]);
            result.push(this.signatures[i]);
        }

        return Buffer.concat(result);
    }

    static builder(transaction) {
        return new TransactionBuilder(transaction);
    }

}

function marshalBinarySig(timestamp, inputs, factoidOutputs, entryCreditOutputs) {

    const header = Buffer.alloc(10);
    header.writeInt8(2);
    header.writeIntBE(timestamp, 1, 6);
    header.writeInt8(inputs.length, 7);
    header.writeInt8(factoidOutputs.length, 8);
    header.writeInt8(entryCreditOutputs.length, 9);

    const marshalledInput = inputs.map(address => address.marshalBinary());
    const marshalledFactoidOutputs = factoidOutputs.map(address => address.marshalBinary());
    const marshalledEntryCreditOutputs = entryCreditOutputs.map(address => address.marshalBinary());

    return Buffer.concat([
        header,
        ...marshalledInput,
        ...marshalledFactoidOutputs,
        ...marshalledEntryCreditOutputs
    ]);
}

class TransactionBuilder {
    constructor(transaction) {
        this._timestamp;
        this._inputs = [];
        this._factoidOutputs = [];
        this._entryCreditOutputs = [];

        this._keys = [];
        this._rcds = [];
        this._signatures = [];

        if (transaction instanceof Transaction) {
            this._timestamp = transaction.timestamp;
            this._inputs = transaction.inputs;
            this._factoidOutputs = transaction.factoidOutputs;
            this._entryCreditOutputs = transaction.entryCreditOutputs;
        }
    }

    input(fctAddress, amount) {
        if (!isValidFctAddress(fctAddress)) {
            throw new TypeError('First argument must be a valid Factoid address.');
        }

        this._inputs.push(new TransactionAddress(getPublicAddress(fctAddress), amount));

        if (fctAddress[1] === 's') {
            const secret = addressToKey(fctAddress);
            const key = nacl.keyPair.fromSeed(secret);
            this._keys.push(key);
        }

        return this;
    }

    output(publicAddress, amount) {
        const transactionAddress = new TransactionAddress(publicAddress, amount);
        if (publicAddress[0] === 'F') {
            this._factoidOutputs.push(transactionAddress);
        } else {
            this._entryCreditOutputs.push(transactionAddress);
        }

        return this;
    }

    rcdSignature(rcd, signature) {
        this._rcds.push(Buffer.from(rcd, 'hex'));
        this._signatures.push(Buffer.from(signature, 'hex'));
        return this;
    }

    timestamp(timestamp) {
        this._timestamp = timestamp;
        return this;
    }

    build() {
        return new Transaction(this);
    }
}

function validateRcds(inputs, rcds) {
    if (rcds.length !== inputs.length) {
        throw new Error(`The number of RCDs (${rcds.length}) does not equal the number of inputs (${inputs.length}).`);
    }
    for (let i = 0; i < rcds.length; ++i) {
        validateRcd(inputs[i], rcds[i]);
    }
}

function validateRcd(input, rcd) {
    if (!sha256d(rcd).equals(addressToRcd(input.address))) {
        throw new Error(`RCD does not match the RCD hash from input address ${input.address}.`);
    }
}

function validateSignatures(data, rcds, signatures) {
    if (rcds.length !== signatures.length) {
        throw new Error(`The number of RCDs (${rcds.length}) does not equal the number of signatures (${signatures.length})`);
    }
    for (let i = 0; i < signatures.length; ++i) {
        validateSignature(data, rcds[i], signatures[i]);
    }
}

function validateSignature(data, rcd, signature) {
    if (rcd[0] !== 1) {
        throw new Error(`Only RCD type 1 is currently supported. Invalid RCD: ${rcd}.`);
    }

    const publicKey = Buffer.from(rcd, 1).slice(1);

    if (!nacl.detached.verify(data, signature, publicKey)) {
        throw new Error('Signature of Transaction is invalid.');
    }
}

module.exports = {
    Transaction
};