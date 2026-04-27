const Product = require('../models/Product');
const Review = require('../models/Review');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { uploadMultipleToImageKit } = require('../middleware/upload');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async(req, res, next) => {
    // Copy req.query
    const reqQuery = {...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search', 'minPrice', 'maxPrice'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Convert frontend price filters into Mongo operators
    if (req.query.minPrice || req.query.maxPrice) {
        reqQuery.price = {};
        if (req.query.minPrice) reqQuery.price.gte = req.query.minPrice;
        if (req.query.maxPrice) reqQuery.price.lte = req.query.maxPrice;
    }

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Build query - only show active products for public
    let query = Product.find({
        ...JSON.parse(queryStr),
        status: 'active'
    });

    // Select fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // Search
    if (req.query.search) {
        query = query.find({
            $or: [
                { name: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } },
                { tags: { $in: [new RegExp(req.query.search, 'i')] } }
            ]
        });
    }

    // Populate
    query = query.populate('category', 'name slug')
        .populate('artisan', 'name avatar')
        .populate({
            path: 'reviews',
            select: 'rating comment user createdAt',
            populate: {
                path: 'user',
                select: 'name avatar'
            }
        });

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments({
        ...JSON.parse(queryStr),
        status: 'active'
    });

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const products = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        };
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        };
    }

    res.json({
        success: true,
        count: products.length,
        pagination,
        total,
        data: products
    });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async(req, res, next) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name slug')
        .populate('artisan', 'name avatar email location story yearsExperience')
        .populate({
            path: 'reviews',
            populate: {
                path: 'user',
                select: 'name avatar'
            }
        });

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    // Get related products (same category, excluding current)
    const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: product._id },
            status: 'active'
        })
        .limit(4)
        .populate('category', 'name slug')
        .populate('artisan', 'name avatar');

    res.json({
        success: true,
        data: {
            product,
            relatedProducts
        }
    });
});

// @desc    Add a review to a product
// @route   POST /api/products/:id/reviews
// @access  Private
exports.addProductReview = asyncHandler(async(req, res, next) => {
    const { rating, title, comment } = req.body;
    const productId = req.params.id;

    if (!rating || !comment) {
        return next(new ErrorResponse('Rating and comment are required', 400));
    }

    const product = await Product.findById(productId);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${productId}`, 404));
    }

    const existingReview = await Review.findOne({ product: productId, user: req.user.id });
    if (existingReview) {
        return next(new ErrorResponse('You have already reviewed this product', 400));
    }

    const review = await Review.create({
        product: productId,
        user: req.user.id,
        rating,
        title,
        comment
    });

    product.reviews.push(review._id);
    await product.save();

    const populatedReview = await Review.findById(review._id).populate('user', 'name avatar');

    res.status(201).json({
        success: true,
        data: populatedReview
    });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = asyncHandler(async(req, res, next) => {
    const products = await Product.find({
            isFeatured: true,
            status: 'active'
        })
        .limit(parseInt(req.query.limit) || 8)
        .populate('category', 'name slug')
        .populate('artisan', 'name avatar');

    res.json({
        success: true,
        count: products.length,
        data: products
    });
});
// @route   GET /api/products/new-arrivals
// @access  Public
exports.getNewArrivals = asyncHandler(async(req, res, next) => {
    const products = await Product.find({
            isNewArrival: true,
            status: 'active'
        })
        .sort('-createdAt')
        .limit(parseInt(req.query.limit) || 8)
        .populate('category', 'name slug')
        .populate('artisan', 'name avatar');

    res.json({
        success: true,
        count: products.length,
        data: products
    });
});

// @desc    Get best sellers
// @route   GET /api/products/best-sellers
// @access  Public
exports.getBestSellers = asyncHandler(async(req, res, next) => {
    const products = await Product.find({
            isBestSeller: true,
            status: 'active'
        })
        .limit(parseInt(req.query.limit) || 8)
        .populate('category', 'name slug')
        .populate('artisan', 'name avatar');

    res.json({
        success: true,
        count: products.length,
        data: products
    });
});

// @desc    Get seller's products
// @route   GET /api/products/my-products
// @access  Private


exports.activateProduct = asyncHandler(async(req, res, next) => {

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse("Product not found", 404));
    }

    if (product.createdBy.toString() !== req.user.id) {
        return next(new ErrorResponse("Not authorized", 403));
    }

    product.status = "active";

    await product.save();

    res.status(200).json({
        success: true,
        data: product
    });

});


exports.getMyProducts = asyncHandler(async(req, res, next) => {
    const products = await Product.find({
            createdBy: req.user.id
        })
        .populate('category', 'name slug')
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
});

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
exports.getProductsByCategory = asyncHandler(async(req, res, next) => {
    const products = await Product.find({
            category: req.params.categoryId,
            status: 'active'
        })
        .populate('category', 'name slug')
        .populate('artisan', 'name avatar')
        .sort('-createdAt');

    res.json({
        success: true,
        count: products.length,
        data: products
    });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin/Artisan
exports.createProduct = asyncHandler(async(req, res, next) => {
    console.log('📦 Creating product for user:', req.user.id);
    console.log('Request body:', req.body);
    console.log('Files:', req.files ? req.files.length : 0);

    // Set creator info
    req.body.createdBy = req.user.id;

    // Set artisan if user is artisan
    if (req.user.role === 'artisan' || req.user.role === 'artisan/seller') {
        req.body.artisan = req.user.id;
    }

    // Handle Image Upload
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
        console.log('Uploading images to ImageKit...');
        const results = await uploadMultipleToImageKit(req.files);
        uploadedImages = results.map(img => ({
            url: img.url,
            fileId: img.fileId,
            altText: img.name || 'product image',
            isPrimary: false
        }));
        console.log(`✅ Uploaded ${uploadedImages.length} images`);
    }

    req.body.productimages = uploadedImages;

    // Parse tags if they came as string
    if (req.body.tags && typeof req.body.tags === 'string') {
        try {
            req.body.tags = JSON.parse(req.body.tags);
        } catch {
            req.body.tags = req.body.tags.split(',').map(tag => tag.trim());
        }
    }

    console.log('Creating product in database...');
    const product = await Product.create(req.body);
    console.log('✅ Product created with ID:', product._id);

    res.status(201).json({
        success: true,
        data: product
    });
});
// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin/Artisan
exports.updateProduct = asyncHandler(async(req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.createdBy.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to update this product', 403));
    }

    // Parse productimages if they came as JSON string
    if (req.body.productimages && typeof req.body.productimages === 'string') {
        try {
            req.body.productimages = JSON.parse(req.body.productimages);
        } catch (e) {
            req.body.productimages = [];
        }
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
        try {
            const uploadedImages = await uploadMultipleToImageKit(req.files);

            const formattedImages = uploadedImages.map(img => ({
                url: img.url,
                fileId: img.fileId,
                altText: img.name || 'product image',
                isPrimary: false
            }));

            const preservedImages = Array.isArray(req.body.productimages) ?
                req.body.productimages :
                (product.productimages || []);

            req.body.productimages = [
                ...preservedImages,
                ...formattedImages
            ];
        } catch (uploadError) {
            console.error('Image upload error:', uploadError);
            // Continue with existing images if upload fails
        }
    }

    // Parse tags if they came as string
    if (req.body.tags && typeof req.body.tags === 'string') {
        try {
            req.body.tags = JSON.parse(req.body.tags);
        } catch (e) {
            req.body.tags = req.body.tags.split(',').map(tag => tag.trim());
        }
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.json({
        success: true,
        data: product
    });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin/Artisan
exports.deleteProduct = asyncHandler(async(req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.createdBy.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to delete this product', 403));
    }

    await product.deleteOne();

    res.json({
        success: true,
        message: 'Product deleted successfully'
    });
});

// @desc    Upload product images
// @route   PUT /api/products/:id/images
// @access  Private/Admin/Artisan
exports.uploadProductImages = asyncHandler(async(req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.createdBy.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to update this product', 403));
    }

    if (!req.files || req.files.length === 0) {
        return next(new ErrorResponse('Please upload images', 400));
    }

    const uploadedImages = await uploadMultipleToImageKit(req.files);

    const formattedImages = uploadedImages.map(img => ({
        url: img.url,
        fileId: img.fileId,
        altText: img.name || 'product image',
        isPrimary: false
    }));

    product.productimages = [
        ...(product.productimages || []),
        ...formattedImages
    ];

    await product.save();

    res.json({
        success: true,
        data: product.productimages
    });
});

// @desc    Set primary image
// @route   PUT /api/products/:id/images/:imageId/primary
// @access  Private/Admin/Artisan
exports.setPrimaryImage = asyncHandler(async(req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.createdBy.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to update this product', 403));
    }

    // Find the image
    const imageIndex = product.productimages.findIndex(img => img.fileId === req.params.imageId);

    if (imageIndex === -1) {
        return next(new ErrorResponse('Image not found', 404));
    }

    // Set all images to non-primary
    product.productimages.forEach(img => img.isPrimary = false);

    // Set selected image as primary
    product.productimages[imageIndex].isPrimary = true;

    await product.save();

    res.json({
        success: true,
        data: product
    });
});

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private/Admin/Artisan
exports.deleteProductImage = asyncHandler(async(req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.createdBy.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to update this product', 403));
    }

    // Find the image
    const imageIndex = product.productimages.findIndex(img => img.fileId === req.params.imageId);

    if (imageIndex === -1) {
        return next(new ErrorResponse('Image not found', 404));
    }

    // Check if it was primary
    const wasPrimary = product.productimages[imageIndex].isPrimary;

    // Remove image
    product.productimages.splice(imageIndex, 1);

    // If we removed the primary image and there are other images, set first as primary
    if (wasPrimary && product.productimages.length > 0) {
        product.productimages[0].isPrimary = true;
    }

    await product.save();

    res.json({
        success: true,
        data: product
    });
});