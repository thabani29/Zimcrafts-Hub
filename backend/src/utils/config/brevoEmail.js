const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Set API key
const apiKey = defaultClient.authentications['api-key'];
if (!apiKey) {
    throw new Error("Brevo API key auth object not found!");
}
apiKey.apiKey = process.env.BREVO_API_KEY;

module.exports = defaultClient;