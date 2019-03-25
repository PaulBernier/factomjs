const assert = require('chai').assert,
    sign = require('tweetnacl/nacl-fast').sign,
    { Transaction } = require('../src/transaction');

describe('Test Factoid transaction creation', function() {
    it('should build signed transaction', async function() {
        const timestamp = 1521693377958;

        const tx = Transaction.builder()
            .timestamp(timestamp)
            .input('Fs2aWUK9n6nriazARdt2hzk6kEqYy6ch9z7wTzowu8R4DELXwK4P', 14000000)
            .input('Fs1N4siZru5sQJoP5U4KQQ2nV6v9n5dC82Cnqxva4FnsJPjC65TK', 11000000)
            .output('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 5000000)
            .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR', 6000000)
            .build();

        assertTransaction(tx);
        assert.lengthOf(tx.rcds, 2);
        assert.lengthOf(tx.signatures, 2);
        assert.isTrue(tx.isSigned());
        assert.isTrue(tx.validateFees(1000));
        assert.strictEqual(tx.computeEcRequiredFees(), 23);
        assert.strictEqual(tx.computeRequiredFees(1000), 23000);
        assert.strictEqual(
            tx.marshalBinary().toString('hex'),
            '0201624bfe45a602010186d6bf00ada661a0c8f36a31ee89054001f2b283f05fbcbb40076bc7a8a7e2fc6ec05cb6859fb1407e5a8f7716e9bed9db6289dfe9b9b2d8393ebbc68b9b0546df8e1145dd964c3382b19640d954883481f3aa501f3f5d4f9e796bafe8aa01bfe89780771e733d6396f8fb9b82ee9b005d54e4b02234a10b542573645f7ba55650f25eb931985cddcf451df77594b5b601a4a8befef8404ab4d68a0e65ed121190ffb60ad5c99f9c7d252fb99748f8258f8154d661fbc2a95a4451ee2a00d4f613f066741ffcd52c74466c349ae779f967431bcaa3047982c2172cab74386ee49e5986c053a1b7c1be4b39856bc370eb020137dc52975d81dc28c827fedeae5e0527027e766064179382854169a5aaf5256f624da47b578221aee786d83f8aff3d37aeb585b421f7a243c8915a0779c8a18aa30283c0286aea07ecebdeb4c177dfd190f2398eebe63b96d939233a026e2503'
        );

        for (let i = 0; i < tx.signatures.length; ++i) {
            assert.isTrue(
                sign.detached.verify(
                    tx.marshalBinarySig,
                    tx.signatures[i],
                    Buffer.from(tx.rcds[i], 1).slice(1)
                )
            );
        }
    });

    it('should build unsigned transaction', async function() {
        const timestamp = 1521693377958;

        const tx = Transaction.builder()
            .timestamp(timestamp)
            .input('FA3HZDE4MdXAthauFoA3aKYpx33U4fT2kAABmfwk7NBqyLT2zed5', 14000000)
            .input('FA2vj6RNSijgB7Zufg2po9XVJYmQm6bLYo721Yv5LEuMe8ijH1yq', 11000000)
            .output('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 5000000)
            .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR', 6000000)
            .build();

        assertTransaction(tx);
        assert.lengthOf(tx.rcds, 0);
        assert.lengthOf(tx.signatures, 0);
        assert.isFalse(tx.isSigned());
        assert.strictEqual(tx.computeEcRequiredFees({ rcdType: 1 }), 23);
        assert.strictEqual(tx.computeRequiredFees(1000, { rcdType: 1 }), 23000);
    });

    function assertTransaction(tx) {
        assert.strictEqual(tx.timestamp, 1521693377958);
        assert.lengthOf(tx.inputs, 2);
        assert.lengthOf(tx.factoidOutputs, 1);
        assert.lengthOf(tx.entryCreditOutputs, 1);

        assert.strictEqual(tx.totalInputs, 25000000);
        assert.strictEqual(tx.totalFactoidOutputs, 5000000);
        assert.strictEqual(tx.totalEntryCreditOutputs, 6000000);
        assert.strictEqual(tx.feesPaid, 14000000);

        assert.strictEqual(
            tx.marshalBinarySig.toString('hex'),
            '0201624bfe45a602010186d6bf00ada661a0c8f36a31ee89054001f2b283f05fbcbb40076bc7a8a7e2fc6ec05cb6859fb1407e5a8f7716e9bed9db6289dfe9b9b2d8393ebbc68b9b0546df8e1145dd964c3382b19640d954883481f3aa501f3f5d4f9e796bafe8aa01bfe89780771e733d6396f8fb9b82ee9b005d54e4b02234a10b542573645f7ba55650f25eb931985cddcf451df77594b5b6'
        );

        assert.strictEqual(
            tx.inputs[0].address,
            'FA3HZDE4MdXAthauFoA3aKYpx33U4fT2kAABmfwk7NBqyLT2zed5'
        );
        assert.strictEqual(tx.inputs[0].amount, 14000000);
        assert.strictEqual(
            tx.inputs[1].address,
            'FA2vj6RNSijgB7Zufg2po9XVJYmQm6bLYo721Yv5LEuMe8ijH1yq'
        );
        assert.strictEqual(tx.inputs[1].amount, 11000000);
        assert.strictEqual(
            tx.factoidOutputs[0].address,
            'FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw'
        );
        assert.strictEqual(tx.factoidOutputs[0].amount, 5000000);
        assert.strictEqual(
            tx.entryCreditOutputs[0].address,
            'EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR'
        );
        assert.strictEqual(tx.entryCreditOutputs[0].amount, 6000000);
    }

    it('should compute fees of generic unsigned transaction', async function() {
        const timestamp = 1521693377958;

        const tx = Transaction.builder()
            .timestamp(timestamp)
            .input('FA3HZDE4MdXAthauFoA3aKYpx33U4fT2kAABmfwk7NBqyLT2zed5', 14000000)
            .input('FA2vj6RNSijgB7Zufg2po9XVJYmQm6bLYo721Yv5LEuMe8ijH1yq', 11000000)
            .output('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 5000000)
            .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR', 6000000)
            .build();

        assert.isFalse(tx.isSigned());
        assert.strictEqual(
            tx.computeEcRequiredFees({
                rcdSignatureLength: 2 * (33 + 64),
                numberOfSignatures: 2
            }),
            23
        );
        assert.strictEqual(
            tx.computeRequiredFees(1000, {
                rcdSignatureLength: 2 * (33 + 64),
                numberOfSignatures: 2
            }),
            23000
        );
    });

    it('should copy transaction without signature', async function() {
        const timestamp = 1521693377958;

        const tx = Transaction.builder()
            .timestamp(timestamp)
            .input('Fs2aWUK9n6nriazARdt2hzk6kEqYy6ch9z7wTzowu8R4DELXwK4P', 14000000)
            .output('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 5000000)
            .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR', 6000000)
            .build();

        const unsignedCopy = Transaction.builder(tx).build();

        assert.isFalse(unsignedCopy.isSigned());
        assert.strictEqual(unsignedCopy.timestamp, timestamp);
        assert.lengthOf(unsignedCopy.inputs, 1);
        assert.lengthOf(unsignedCopy.factoidOutputs, 1);
        assert.lengthOf(unsignedCopy.entryCreditOutputs, 1);
        assert.lengthOf(unsignedCopy.rcds, 0);
        assert.lengthOf(unsignedCopy.signatures, 0);
        assert.strictEqual(unsignedCopy.totalInputs, 14000000);
        assert.strictEqual(unsignedCopy.totalFactoidOutputs, 5000000);
        assert.strictEqual(unsignedCopy.totalEntryCreditOutputs, 6000000);
    });

    it('should manually signed transaction', async function() {
        const timestamp = 1521693377958;

        const tx = Transaction.builder()
            .timestamp(timestamp)
            .input('Fs2aWUK9n6nriazARdt2hzk6kEqYy6ch9z7wTzowu8R4DELXwK4P', 14000000)
            .output('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 5000000)
            .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR', 6000000)
            .build();

        const manuallySignedCopy = Transaction.builder(tx)
            .rcdSignature(tx.rcds[0], tx.signatures[0])
            .build();

        assert.deepStrictEqual(manuallySignedCopy.marshalBinary(), tx.marshalBinary());
    });

    it('should reject transaction with outputs greater than inputs (and not coinbase)', async function() {
        const timestamp = 1521693377958;

        try {
            Transaction.builder()
                .timestamp(timestamp)
                .input('Fs2aWUK9n6nriazARdt2hzk6kEqYy6ch9z7wTzowu8R4DELXwK4P', 20)
                .output('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 20)
                .output('EC2UFobcsWom2NvyNDN67Q8eTdpCQvwYe327ZeGTLXbYaZ56e9QR', 20)
                .build();
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have rejected transaction');
    });

    it('should reject transaction with negative amount', async function() {
        try {
            Transaction.builder()
                .input('Fs2aWUK9n6nriazARdt2hzk6kEqYy6ch9z7wTzowu8R4DELXwK4P', -1)
                .output('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', -1)
                .build();
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have rejected transaction');
    });

    it('should reject transaction with non safe integer', async function() {
        try {
            Transaction.builder()
                .input(
                    'Fs2aWUK9n6nriazARdt2hzk6kEqYy6ch9z7wTzowu8R4DELXwK4P',
                    Number.MAX_SAFE_INTEGER + 1
                )
                .output(
                    'FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw',
                    Number.MAX_SAFE_INTEGER + 1
                )
                .build();
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have rejected transaction');
    });

    it('should throw on marshal binary computation of unsigned transaction', async function() {
        try {
            Transaction.builder()
                .input('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 10)
                .output('FA3cnxxcRxm6RQs2hpExdEPo9utyeBZecWKeKa1pFDCrRoQh9aVw', 10)
                .build()
                .marshalBinary();
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        throw new Error('Should have rejected transaction');
    });
});
