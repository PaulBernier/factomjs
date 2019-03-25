const assert = require('chai').assert,
    sinon = require('sinon');
const wallet = require('../src/wallet'),
    { WalletdCli } = require('../src/apis-cli');

describe('Test wallet', function() {
    it('should reject invalid address as input', async function() {
        try {
            await wallet.getPrivateAddress(null, 'not an address');
        } catch (e) {
            assert.instanceOf(e, Error);
            return;
        }
        assert.fail();
    });

    it('should get private address if already private address', async function() {
        const walletd = new WalletdCli();
        const mock = sinon.mock(walletd);

        mock.expects('call').never();

        assert.strictEqual(
            await wallet.getPrivateAddress(
                walletd,
                'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym'
            ),
            'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym'
        );
        mock.verify();

        assert.strictEqual(
            await wallet.getPrivateAddress(
                walletd,
                'Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X'
            ),
            'Fs2w6VL6cwBqt6SpUyPLvdo9TK834gCr52Y225z8C5aHPAFav36X'
        );
        mock.verify();
    });

    it('should get private address from walletd', async function() {
        const walletd = new WalletdCli();
        const mock = sinon.mock(walletd);

        mock.expects('call')
            .once()
            .withArgs('address', {
                address: 'EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD'
            })
            .returns(
                Promise.resolve({
                    secret: 'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym'
                })
            );

        assert.strictEqual(
            await wallet.getPrivateAddress(
                walletd,
                'EC2vXWYkAPduo3oo2tPuzA44Tm7W6Cj7SeBr3fBnzswbG5rrkSTD'
            ),
            'Es32PjobTxPTd73dohEFRegMFRLv3X5WZ4FXEwNN8kE2pMDfeMym'
        );
        mock.verify();
    });
});
