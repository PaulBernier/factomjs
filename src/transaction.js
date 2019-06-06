// https://github.com/FactomProject/FactomDocs/blob/master/factomDataStructureDetails.md#factoid-transaction
// https://github.com/FactomProject/factoid/blob/3ee9763f86849036723d1b059216e08a6d34b184/transaction.go

const sign = require('tweetnacl/nacl-fast').sign,
    base58 = require('base-58'),
    { RCD_TYPE_1, encodeVarInt, sha256, sha256d, flatMap } = require('./util'),
    { MAX_TRANSACTION_SIZE } = require('./constant'),
    {
        isValidFctAddress,
        isValidPublicAddress,
        getPublicAddress,
        addressToKey,
        addressToRcdHash
    } = require('./addresses');

/**
 * Class to hold address and amount of an input/output of a {@link Transaction}.
 * @param {string} address - Factoid or Entry Credit public address.
 * @param {number} amount - Amount in factoshis (10^-8 Factoids).
 */
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
        return Buffer.concat([
            encodeVarInt(this.amount),
            Buffer.from(base58.decode(this.address).slice(2, 34))
        ]);
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

/**
 * Block context of a {@link Transaction}.
 * @typedef {Object} TransactionBlockContext
 * @property {string} factoidBlockKeyMR - Factoid Block KeyMR the transaction is part of.
 * @property {string} directoryBlockKeyMR - Directory Block KeyMR the transaction was secured in.
 * @property {number} directoryBlockHeight - Directory Block height the transaction was secured in.
 */

/**
 * Class representing a Factoid transaction.
 * @param {TransactionBuilder} builder
 * @param {TransactionBlockContext} [blockContext]
 * @property {string} id - Transaction ID.
 * @property {number} timestamp - Timestamp in milliseconds.
 * @property {TransactionAddress[]} inputs - Inputs.
 * @property {TransactionAddress[]} factoidOutputs - Factoid outputs.
 * @property {TransactionAddress[]} entryCreditOutputs - Entry Credit outputs.
 * @property {number} totalInputs - Total amount of factoshis as input of this transaction.
 * @property {number} totalFactoidOutputs - Total amount of factoshis as factoid outputs of this transaction.
 * @property {number} totalEntryCreditOutputs - Total amount of factoshis as entry credit outputs of this transaction.
 * @property {number} feesPaid - Fees paid in this transaction.
 * @property {TransactionBlockContext} blockContext - Block context.
 * @property {Buffer[]} rcds - RCDs.
 * @property {Buffer[]} signatures - Signatures.
 * @example
 * const transaction = Transaction.builder()
 *   .input('Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X', 14000000)
 *   .input('Fs2E6iXCLAKDiPqVtfxtuQCKsTe7o6DJFDnht1wST53s4ibtdu9f', 1010000 + fees)
 *   .output('FA3syRxpYEvFFvoN4ZfNRJVQdumLpTK4CMmMUFmKGeqyTNgsg5uH', 5000000)
 *   .output('FA24PAtyZWWVAPm95ZCVpwyY6RYHeCMTiZt2v4VQAY8aBXMUZteF', 10000000)
 *    // Note that the line below is to buy Entry Credits (see the address type) and the amount is in Factoshis like other outputs:
 *    // it is *not* the number of Entry Credits you are purchasing.
 *   .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e3QR', 10000)
 *   .build()
 */
class Transaction {
    constructor(builder, blockContext) {
        if (builder instanceof TransactionBuilder) {
            this.timestamp = builder._timestamp || Date.now();
            this.inputs = builder._inputs;
            this.factoidOutputs = builder._factoidOutputs;
            this.entryCreditOutputs = builder._entryCreditOutputs;
            this.blockContext = blockContext;

            this.marshalBinarySig = marshalBinarySig(
                this.timestamp,
                this.inputs,
                this.factoidOutputs,
                this.entryCreditOutputs
            );
            this.id = sha256(this.marshalBinarySig).toString('hex');

            if (builder._keys.length !== 0) {
                this.rcds = builder._keys.map(key =>
                    Buffer.concat([RCD_TYPE_1, Buffer.from(key.publicKey)])
                );
                this.signatures = builder._keys.map(key =>
                    Buffer.from(sign.detached(this.marshalBinarySig, key.secretKey))
                );
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
            // The reason for not using a TransactionBuilder for transactions read from the blockchain is performance
            // because of the validation cost of the rcs/signatures. We trust the data coming from the blockchain to be valid.
            this.id = builder.txid;
            this.timestamp = builder.millitimestamp;
            this.inputs = builder.inputs.map(
                input => new TransactionAddress(input.useraddress, input.amount)
            );
            this.factoidOutputs = builder.outputs.map(
                output => new TransactionAddress(output.useraddress, output.amount)
            );
            this.entryCreditOutputs = builder.outecs.map(
                output => new TransactionAddress(output.useraddress, output.amount)
            );
            this.rcds = builder.rcds.map(rcd => Buffer.from(rcd, 'hex'));
            this.signatures = flatMap(builder.sigblocks, sb => sb.signatures).map(signature =>
                Buffer.from(signature, 'hex')
            );
            this.blockContext = blockContext;
        } else {
            throw new Error('Use `Transaction.builder()` syntax to create a new Transaction.');
        }

        if (this.signatures.length !== 0 && this.inputs.length !== this.signatures.length) {
            throw new Error('All inputs must be signed or none of them.');
        }

        this.totalInputs = this.inputs.reduce((acc, value) => acc + value.amount, 0);
        this.totalFactoidOutputs = this.factoidOutputs.reduce(
            (acc, value) => acc + value.amount,
            0
        );
        this.totalEntryCreditOutputs = this.entryCreditOutputs.reduce(
            (acc, value) => acc + value.amount,
            0
        );
        const totalOutputs = this.totalFactoidOutputs + this.totalEntryCreditOutputs;

        if (!Number.isSafeInteger(this.totalInputs) || !Number.isSafeInteger(totalOutputs)) {
            throw new Error(
                'Total inputs/outputs are not safe integers (too big to be handled by the library).'
            );
        }

        if (this.totalInputs === 0) {
            // If total inputs amount is 0 we can only assume that it is a valid coinbase transaction.
            this.feesPaid = 0;
        } else if (this.totalInputs >= totalOutputs) {
            this.feesPaid = this.totalInputs - totalOutputs;
        } else {
            throw new Error(
                `Sum of Transaction outputs (${totalOutputs}) is greater than the sum of inputs (${this.totalInputs})`
            );
        }

        Object.freeze(this);
    }

    /**
     * Check if the transaction is signed or not.
     * @returns {boolean} True if the transaction is signed.
     */
    isSigned() {
        return this.signatures.length !== 0;
    }

    /**
     * Compute if the fees of the transaction are enough (for a given EC rate).
     * @param {number} ecRate - Entry Credit rate. See {@link FactomCli#getEntryCreditRate}.
     * @returns {boolean} - True if the fees are sufficient.
     */
    validateFees(ecRate) {
        return this.computeRequiredFees(ecRate) <= this.feesPaid;
    }

    /**
     * Compute the required fees (minimum difference between inputs and outputs amounts) for the transaction (for a given EC rate).
     * @param {number} ecRate - Entry Credit rate. See {@link FactomCli#getEntryCreditRate}.
     * @param {Object} [opts] - Extra options necessary to compute fees of an unsigned transaction.
     * @returns {number} - Number of factoshis (10^-8 Factoids) required as fees for this transaction.
     */
    computeRequiredFees(ecRate, opts) {
        return this.computeEcRequiredFees(opts) * ecRate;
    }

    /**
     * Compute the required Entry Credit fees.
     * @param {Object} [opts] - Extra options necessary to compute fees of an unsigned transaction.
     * @returns {number} - Fees in Entry Credit.
     */
    computeEcRequiredFees(opts) {
        const options = opts || {};

        let size, numberOfSignatures;
        if (this.isSigned()) {
            size = this.marshalBinary().length;
            numberOfSignatures = this.signatures.length;
        } else {
            if (
                typeof options.rcdSignatureLength === 'number' &&
                typeof options.numberOfSignatures === 'number'
            ) {
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
            throw new Error(
                `Transaction size is bigger than the maximum (${MAX_TRANSACTION_SIZE} bytes).`
            );
        }

        let fee = Math.floor((size + 1023) / 1024);
        fee += 10 * (this.factoidOutputs.length + this.entryCreditOutputs.length);
        fee += numberOfSignatures;

        return fee;
    }

    /**
     * @returns {Buffer} Result of marshaling the transaction.
     */
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

    /**
     * Transaction builder static factory.
     * @param {Transaction} [transaction] - Optional transaction to use to initialize the attributes of the builder.
     * @returns {TransactionBuilder} A new TransactionBuilder.
     */
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

/**
 * Class to build a {@link Transaction}.
 * @param {Transaction} [transaction] - Optional transaction to use to initialize the attributes of the builder.
 */
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

    /**
     * Add an input to the transaction.
     * @param {string} fctAddress - Factoid address.
     * User should provide a private address (Fs) to allow the signature of the transaction.
     * If a public address is provided the user will need to provide the RCD and signature using {@link TransactionBuilder#rcdSignature}.
     * @param {number} amount - Amount in factoshis (10^-8 Factoids).
     * @returns {TransactionBuilder} - TransactionBuilder instance.
     */
    input(fctAddress, amount) {
        if (!isValidFctAddress(fctAddress)) {
            throw new TypeError('First argument must be a valid Factoid address.');
        }

        this._inputs.push(new TransactionAddress(getPublicAddress(fctAddress), amount));

        if (fctAddress[1] === 's') {
            const secret = addressToKey(fctAddress);
            const key = sign.keyPair.fromSeed(secret);
            this._keys.push(key);
        }

        return this;
    }

    /**
     * Add an output to the transaction. Both FCT and EC outputs are supported.
     * Please note that in case of an EC output, the amount is still in factoshis, it is not the number of Entry Credits.
     * @param {string} publicAddress - Factoid or Entry Credit public address.
     * @param {number} amount - Amount in factoshis (10^-8 Factoids).
     * @returns {TransactionBuilder} - TransactionBuilder instance.
     */
    output(publicAddress, amount) {
        const transactionAddress = new TransactionAddress(publicAddress, amount);
        if (publicAddress[0] === 'F') {
            this._factoidOutputs.push(transactionAddress);
        } else {
            this._entryCreditOutputs.push(transactionAddress);
        }

        return this;
    }

    /**
     * Add a RCD and signature to the transaction. This is used only in the case of unsigned transactions (usefull for hardware wallets).
     * RCDs/signatures need to be added in the same order as their corresponding inputs.
     * @param {string} rcd - RCD.
     * @param {string} signature - Signature.
     * @returns {TransactionBuilder} - TransactionBuilder instance.
     */
    rcdSignature(rcd, signature) {
        this._rcds.push(Buffer.from(rcd, 'hex'));
        this._signatures.push(Buffer.from(signature, 'hex'));
        return this;
    }

    /**
     * Set the transaction timestamp.
     * If not set the library will use Date.now() as the transaction timestamp.
     * @param {number} timestamp - Timestamp in milliseconds.
     * @returns {TransactionBuilder} - TransactionBuilder instance.
     */
    timestamp(timestamp) {
        this._timestamp = timestamp;
        return this;
    }

    /**
     * Build the Transaction.
     * @returns {Transaction} - Built transaction.
     */
    build() {
        return new Transaction(this);
    }
}

function validateRcds(inputs, rcds) {
    if (rcds.length !== inputs.length) {
        throw new Error(
            `The number of RCDs (${rcds.length}) does not equal the number of inputs (${inputs.length}).`
        );
    }
    for (let i = 0; i < rcds.length; ++i) {
        validateRcdHash(inputs[i], rcds[i]);
    }
}

function validateRcdHash(input, rcd) {
    if (!sha256d(rcd).equals(addressToRcdHash(input.address))) {
        throw new Error(`RCD does not match the RCD hash from input address ${input.address}.`);
    }
}

function validateSignatures(data, rcds, signatures) {
    if (rcds.length !== signatures.length) {
        throw new Error(
            `The number of RCDs (${rcds.length}) does not equal the number of signatures (${signatures.length})`
        );
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

    if (!sign.detached.verify(data, signature, publicKey)) {
        throw new Error('Signature of Transaction is invalid.');
    }
}

module.exports = {
    Transaction
};
