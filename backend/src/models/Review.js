const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {type: mongoose.Types.ObjectId,
    ref: 'Product',
    required: false,
    },
    user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Please provide a comment'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  images: [{
    url: String,
    publicId: String
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Number,
    default: 0
  },
  notHelpful: {
    type: Number,
    default: 0
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Update product rating when review is saved
reviewSchema.post('save', async function() {
  const Review = this.constructor;
  
  const stats = await Review.aggregate([
    {
      $match: { product: this.product }
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        numberOfReviews: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    await mongoose.model('Product').findByIdAndUpdate(this.product, {
      'ratings.average': stats[0].averageRating,
      'ratings.count': stats[0].numberOfReviews
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);