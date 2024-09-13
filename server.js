const express = require('express');
const bodyParser = require('body-parser');
const { TonClient, abiContract, signerNone } = require('ton-client-node-js');

const app = express();
app.use(bodyParser.json());

const tonClient = new TonClient({
    network: {
        server_address: 'https://net.ton.dev', // Use testnet for testing, switch to mainnet for production
    },
});

app.post('/connect-wallet', async (req, res) => {
    // Example endpoint for wallet connection
    const { publicKey } = req.body;

    try {
        // Logic to handle wallet connection
        res.status(200).json({ message: 'Wallet connected successfully', publicKey });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/send-transaction', async (req, res) => {
    const { destination, amount, privateKey } = req.body;

    try {
        const transferAbi = {
            "ABI version": 2,
            "functions": [
                {
                    "name": "transfer",
                    "inputs": [
                        {"name":"dest","type":"address"},
                        {"name":"amount","type":"uint64"}
                    ],
                    "outputs": []
                }
            ],
        };

        const transferParams = {
            abi: abiContract(transferAbi),
            call_set: {
                function_name: "transfer",
                input: {
                    dest: destination,
                    amount: amount,
                }
            },
            signer: {
                type: 'Keys',
                keys: {
                    public: publicKey,
                    secret: privateKey,
                },
            },
        };

        const result = await tonClient.processing.process_message({
            send_events: false,
            message_encode_params: transferParams,
        });

        res.status(200).json({ message: 'Transaction sent successfully', result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.listen(3000, () => {
    console.log('Server running on port 3000');
});
