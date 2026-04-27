const mongoose = require('mongoose');

const unsupportedTransactionError = (error) => (
    /Transaction numbers are only allowed/i.test(error?.message || '') ||
    /replica set/i.test(error?.message || '')
);

module.exports = async(work) => {
    const session = await mongoose.startSession();

    try {
        let result;

        try {
            await session.withTransaction(async() => {
                result = await work(session);
            });
            return result;
        } catch (error) {
            if (!unsupportedTransactionError(error)) {
                throw error;
            }

            return work(null);
        }
    } finally {
        await session.endSession();
    }
};
