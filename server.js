const express = require('express');
const { TonClient, WalletContractV3R2, fromNano, toNano } = require('ton');
const { mnemonicNew, mnemonicToWalletKey } = require('ton-crypto');

const app = express();
const port = process.env.PORT || 3000;

// Initialize the TON client for the testnet
const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
});

// Function to fetch wallet information (as an example)
async function getWalletInfo(walletAddress) {
    try {
        const result = await client.getAddressInformation(walletAddress);
        console.log(result);
    } catch (error) {
        console.error('Error fetching wallet info:', error);
    }
}

// // Test the wallet information for a specific address
// const walletAddress = '0QC-wrPp5k0bek8pYKuKhUBTQYzz0RoDxYSFKC0CRBjtgA7W'; // Replace with your wallet address
// getWalletInfo(walletAddress);

// Endpoint to create a new wallet
app.get('/createWallet', async (req, res) => {
    try {
        const mnemonic = await mnemonicNew(); // Generate a new mnemonic
        const keyPair = await mnemonicToWalletKey(mnemonic); // Derive key pair from mnemonic

        // Convert public key to appropriate format (Buffer or Uint8Array)
        const publicKeyBuffer = Buffer.from(keyPair.publicKey); // Or Uint8Array

        const wallet = WalletContractV3R2.create({ publicKey: publicKeyBuffer }); // Create a wallet contract instance
        const walletAddress = wallet.address.toString(); // Get the wallet address

        res.json({ mnemonic: mnemonic.join(' '), walletAddress });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to get wallet balance
app.get('/getBalance/:walletAddress', async (req, res) => {
    const { walletAddress } = req.params;

    try {
        const balance = await client.getBalance(walletAddress);
        res.json({ balance: fromNano(balance) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to send a transaction
app.post('/sendTransaction', express.json(), async (req, res) => {
    const { mnemonic, toAddress, amount } = req.body;

    try {
        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            throw new Error('Invalid amount. Please provide a valid positive number.');
        }

        const keyPair = await mnemonicToWalletKey(mnemonic.split(' '));
        const wallet = WalletContractV3R2.create({ publicKey: keyPair.publicKey });
        const seqno = await wallet.getSeqno();

        await wallet.sendTransfer({
            secretKey: keyPair.secretKey,
            toAddress,
            amount: toNano(amount),
            seqno,
            payload: 'Test transfer',
        });

        res.json({ message: `Sent ${amount} TON to ${toAddress}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
