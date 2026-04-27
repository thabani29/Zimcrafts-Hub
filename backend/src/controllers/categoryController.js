const Category = require("../models/Category");
const slugify = require("slugify");

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
exports.getCategories = async(req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get featured categories
 * @route   GET /api/categories/featured
 * @access  Public
 */
exports.getFeaturedCategories = async(req, res) => {
    try {
        const categories = await Category.find({ featured: true });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get single category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
exports.getCategory = async(req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get category by slug
 * @route   GET /api/categories/slug/:slug
 * @access  Public
 */
exports.getCategoryBySlug = async(req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug });

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Create category
 * @route   POST /api/categories
 * @access  Admin
 */
exports.createCategory = async(req, res) => {
    try {
        const { name, description, featured } = req.body;

        const category = await Category.create({
            name,
            description,
            featured: featured || false,
            slug: slugify(name, { lower: true }),
        });

        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Admin
 */
exports.updateCategory = async(req, res) => {
    try {
        let category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        if (req.body.name) {
            req.body.slug = slugify(req.body.name, { lower: true });
        }

        category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body, { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Admin
 */
exports.deleteCategory = async(req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        await category.deleteOne();

        res.status(200).json({ success: true, message: "Category deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};