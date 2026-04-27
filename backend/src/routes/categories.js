const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', categoryController.getCategories);
router.get('/featured', categoryController.getFeaturedCategories);
router.get('/:id', categoryController.getCategory);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Protected routes (Admin only)
router.use(protect, authorize('admin'));

router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;