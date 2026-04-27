const { Paynow } = require('paynow');

const createPaynowClient = () => new Paynow(
    process.env.PAYNOW_INTEGRATION_ID,
    process.env.PAYNOW_INTEGRATION_KEY
);

module.exports = createPaynowClient;
