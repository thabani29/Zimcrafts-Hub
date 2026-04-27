const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

// =======================
// PUBLIC ROUTES
// =======================

router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/best-sellers', productController.getBestSellers);
router.get('/category/:categoryId', productController.getProductsByCategory);

// Seller products
router.get('/my-products', protect, productController.getMyProducts);

// =======================
// PROTECTED PRODUCT ROUTES
// =======================

router.post(
    '/',
    protect,
    authorize('admin', 'artisan', 'artisan/seller'),
    upload.array('images', 5),
    handleUploadError,
    productController.createProduct
);

router.put(
    "/:id/activate",
    protect,
    authorize("artisan/seller", "admin"),
    productController.activateProduct
);

router.put(
    '/:id',
    protect,
    authorize('admin', 'artisan', 'artisan/seller'),
    upload.array('images', 5),
    handleUploadError,
    productController.updateProduct
);

router.post(
    '/:id/reviews',
    protect,
    productController.addProductReview
);

router.delete(
    '/:id',
    protect,
    authorize('admin', 'artisan', 'artisan/seller'),
    productController.deleteProduct
);

// =======================
// IMAGE ROUTES
// =======================

router.put(
    '/:id/images',
    protect,
    authorize('admin', 'artisan', 'artisan/seller'),
    upload.array('images', 5),
    handleUploadError,
    productController.uploadProductImages
);

router.put(
    '/:id/images/:imageId/primary',
    protect,
    authorize('admin', 'artisan', 'artisan/seller'),
    productController.setPrimaryImage
);

router.delete(
    '/:id/images/:imageId',
    protect,
    authorize('admin', 'artisan', 'artisan/seller'),
    productController.deleteProductImage
);

// =======================
// SINGLE PRODUCT (KEEP LAST)
// =======================

router.get('/:id', productController.getProduct);

module.exports = router;