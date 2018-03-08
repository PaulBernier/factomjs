// https://github.com/FactomProject/FactomDocs/blob/master/factomDataStructureDetails.md#factoid-transaction
// https://github.com/FactomProject/factoid/blob/3ee9763f86849036723d1b059216e08a6d34b184/transaction.go

const EdDSA = require('elliptic').eddsa,
    { encodeVarInt, keyToRCD1 } = require('./util'),
    { MAX_TRANSACTION_SIZE } = require('./constant'),
    { publicHumanAddressStringToRCD, privateHumanAddressStringToPrivate } = require('factomjs-util'),
    { isValidFctPrivateAddress, isValidPublicAddress } = require('./addresses');

const ec = new EdDSA('ed25519');

const RCD_TYPE = Buffer.from('01', 'hex');

class TransactionAddress {
    constructor(rcdHash, amount) {
        this.rcdHash = rcdHash;
        this.amount = amount;
        Object.freeze(this);
    }

    marshalBinary() {
        return Buffer.concat([encodeVarInt(this.amount), this.rcdHash]);
    }
}

class Transaction {
    constructor(builder) {
        this.timestamp = builder._timestamp || Date.now();
        this.inputs = builder._inputs;
        this.factoidOutputs = builder._factoidOutputs;
        this.entryCreditOutputs = builder._entryCreditOutputs;

        this.totalInputs = this.inputs.reduce((acc, value) => acc + value.amount, 0);
        this.totalFactoidOutputs = this.factoidOutputs.reduce((acc, value) => acc + value.amount, 0);
        this.totalEntryCreditOutputs = this.entryCreditOutputs.reduce((acc, value) => acc + value.amount, 0);
        this.feesPaid = this.totalInputs - this.totalFactoidOutputs - this.totalEntryCreditOutputs;

        this.rcds = builder._keys.map(key => Buffer.concat([RCD_TYPE, Buffer.from(key.getPublic())]));
        const data = this.marshalBinarySig();
        this.signatures = builder._keys.map(key => Buffer.from(key.sign(data).toBytes()));

        Object.freeze(this);
    }

    validateFees(ecRate) {
        return this.feesRequired(ecRate) <= this.feesPaid;
    }


    feesRequired(ecRate) {
        return this.ecFeesRequired() * ecRate;
    }

    ecFeesRequired() {
        const size = this.marshalBinary().length;

        if (size > MAX_TRANSACTION_SIZE) {
            throw `Transaction size is bigger than the maximum (${MAX_TRANSACTION_SIZE} bytes)`;
        }

        let fee = Math.floor((size + 1023) / 1024);
        fee += 10 * (this.factoidOutputs.length + this.entryCreditOutputs.length);
        fee += this.signatures.length;

        return fee;
    }

    marshalBinary() {
        const data = this.marshalBinarySig();
        const result = [data];
        for (let i = 0; i < this.rcds.length; ++i) {
            result.push(this.rcds[i]);
            result.push(this.signatures[i]);
        }

        return Buffer.concat(result);
    }

    marshalBinarySig() {
        const header = Buffer.alloc(10);
        header.writeInt8(2);
        header.writeIntBE(this.timestamp, 1, 6);
        header.writeInt8(this.inputs.length, 7);
        header.writeInt8(this.factoidOutputs.length, 8);
        header.writeInt8(this.entryCreditOutputs.length, 9);

        const marshalledInput = this.inputs.map(address => address.marshalBinary());
        const marshalledFactoidOutputs = this.factoidOutputs.map(address => address.marshalBinary());
        const marshalledEntryCreditOutputs = this.entryCreditOutputs.map(address => address.marshalBinary());

        return Buffer.concat([
            header,
            ...marshalledInput,
            ...marshalledFactoidOutputs,
            ...marshalledEntryCreditOutputs
        ]);
    }

    static get Builder() {
        class Builder {
            constructor() {
                this._inputs = [];
                this._factoidOutputs = [];
                this._entryCreditOutputs = [];
                this._keys = [];
                this._ecRate = 0;
                this._addFeesInputIndex = 0;
                this._overrideFees;
                this._timestamp;
            }

            input(fctPrivateAddress, amount) {
                if (!isValidFctPrivateAddress(fctPrivateAddress)) {
                    throw 'First argument must be a valid private factoid address';
                }
                if (!amount || typeof amount !== 'number') {
                    throw 'Second argument must be a non null amount in Factoshis';
                }

                const secret = privateHumanAddressStringToPrivate(fctPrivateAddress);
                const key = ec.keyFromSecret(secret);

                this._inputs.push(new TransactionAddress(keyToRCD1(Buffer.from(key.getPublic())), amount));
                this._keys.push(key);
                return this;
            }

            output(publicAddress, amount) {
                if (!isValidPublicAddress(publicAddress)) {
                    throw 'First argument must be either a Factoid or EntryCredit public address';
                }
                if (!amount || typeof amount !== 'number') {
                    throw 'Second argument must be a non null amount in Factoshis';
                }

                const rcdHash = publicHumanAddressStringToRCD(publicAddress);
                const transactionAddress = new TransactionAddress(rcdHash, amount);
                if (publicAddress[0] === 'F') {
                    this._factoidOutputs.push(transactionAddress);
                } else {
                    this._entryCreditOutputs.push(transactionAddress);
                }

                return this;
            }

            timestamp(timestamp) {
                this._timestamp = timestamp;
                return this;
            }

            adjustFeesOnInput(ecRate, addFeesInputIndex, overrideFees) {
                this._ecRate = ecRate;
                this._addFeesInputIndex = addFeesInputIndex || 0;
                this._overrideFees = overrideFees;
                return this;
            }

            build() {
                return new Transaction(this);
            }
        }
        return Builder;
    }
}

module.exports = {
    Transaction,
};