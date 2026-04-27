const asyncHandler = require('../utils/asyncHandler');
const imagekit = require('../services/imagekitService');

// @desc    Get ImageKit upload authentication parameters
// @route   GET /api/imagekit-auth
// @access  Private (artisan)
exports.getImageKitAuth = asyncHandler(async (req, res, next) => {
    const authParams = imagekit.getAuthenticationParameters();

    res.json({
        success: true,
        data: {
            token: authParams.token,
            expire: authParams.expire,
            signature: authParams.signature,
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
        }
    });
});
