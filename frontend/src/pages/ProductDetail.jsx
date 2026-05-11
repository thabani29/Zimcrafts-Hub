import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewRatingHover, setReviewRatingHover] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { getCartTotalItems } = useCart();

  const fetchProduct = useCallback(async () => {
    try {
      const response = await apiService.getProductById(id);
      setProduct(response.data.product);
    } catch (err) {
      console.error('Error loading product:', err.message || err);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Auto-hide alert after 3 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  if (!product) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 text-lg">Loading product...</p>
      </div>
    );
  }

  const mainImage =
    product.productimages[selectedImageIndex]?.url ||
    'https://via.placeholder.com/600x400?text=No+Image';

  const handleAddToCart = () => {
    addToCart(product);
    setShowAlert(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewMessage('');

    if (!user) {
      setReviewError('Please log in to submit a review.');
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError('Please enter a comment for your review.');
      return;
    }

    setIsSubmittingReview(true);

    try {
      await apiService.postProductReview(id, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment.trim()
      });

      setReviewMessage('Thank you! Your review has been posted.');
      setReviewRating(5);
      setReviewTitle('');
      setReviewComment('');
      await fetchProduct();
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 relative">

      {/* ✅ ALERT NOTIFICATION */}
      {showAlert && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-xl animate-bounce z-50 border-2 border-green-400">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">✅</span>
            <span className="font-semibold">Added to Cart!</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* IMAGE SECTION */}
        <div>
          <div className="rounded-xl overflow-hidden border mb-4 shadow-sm">
            <img
              src={mainImage}
              alt={product.productimages[selectedImageIndex]?.altText || 'product image'}
              className="w-full h-64 md:h-[400px] object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>

          {product.productimages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto">
              {product.productimages.map((img, idx) => (
                <img
                  key={idx}
                  src={img.url}
                  alt={img.altText || 'thumbnail'}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 transition ${
                    idx === selectedImageIndex
                      ? 'border-primary-orange scale-105'
                      : 'border-gray-200 hover:border-primary-orange'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* PRODUCT INFO */}
        <div className="flex flex-col justify-between">

          <div>
            <h1 className="text-3xl font-bold text-primary-brown mb-3">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(product.ratings?.average || 0)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {product.ratings?.average?.toFixed(1) || '0.0'} / 5
                </p>
                <p className="text-xs text-gray-500">
                  {product.ratings?.count || product.reviews?.length || 0} reviews
                </p>
              </div>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed">
              {product.description}
            </p>

            <div className="mb-6">
              <span className="text-2xl font-bold text-primary-orange">
                ${product.price.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full py-3 bg-primary-orange hover:bg-primary-brown text-white font-semibold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105"
          >
            🛒 Add to Cart
          </button>

        </div>
      </div>

      <div className="grid gap-8 mt-8 lg:grid-cols-[1.6fr_1fr] items-start">
        <section className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary-brown">Customer Reviews</h2>
              <p className="text-sm text-gray-500">{product.ratings?.count || product.reviews?.length || 0} review{product.ratings?.count === 1 ? '' : 's'}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-primary-orange">{product.ratings?.average?.toFixed(1) || '0.0'} / 5</p>
              <p className="text-sm text-gray-500">{product.ratings?.count || product.reviews?.length || 0} ratings</p>
            </div>
          </div>

          {product.reviews?.length > 0 ? (
            <div className="space-y-4">
              {product.reviews.map((review) => (
                <div key={review._id} className="border rounded-2xl p-4 bg-slate-50">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div>
                      <p className="font-semibold text-primary-brown">{review.user?.name || 'Customer'}</p>
                      <p className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-yellow-500 font-semibold">{review.rating} / 5</span>
                  </div>
                  {review.title && <h3 className="font-semibold mb-1">{review.title}</h3>}
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No reviews yet. Be the first to write one!</p>
          )}
        </section>

        <aside className="bg-white rounded-2xl shadow-lg p-6 h-full">
          <h2 className="text-2xl font-bold text-primary-brown mb-4">Leave a Review</h2>

          {!user ? (
            <p className="text-gray-600">Please log in to submit a review.</p>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const selected = star <= (reviewRatingHover || reviewRating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewRatingHover(star)}
                        onMouseLeave={() => setReviewRatingHover(0)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-150 ${
                          selected ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-500 hover:bg-yellow-300'
                        }`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-500 mt-2">Selected rating: {reviewRating} star{reviewRating > 1 ? 's' : ''}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Summarize your review"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={5}
                  placeholder="Tell shoppers what you liked or didn’t like"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-orange resize-none"
                />
              </div>

              {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
              {reviewMessage && <p className="text-sm text-green-600">{reviewMessage}</p>}

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full rounded-full bg-primary-orange px-5 py-3 text-white font-semibold transition hover:bg-primary-brown disabled:opacity-50"
              >
                {isSubmittingReview ? 'Posting review...' : 'Submit Review'}
              </button>
            </form>
          )}
        </aside>
      </div>

      {/* Floating Cart Icon */}
      <Link
        to="/cart"
        className="fixed bottom-6 right-6 bg-primary-orange hover:bg-primary-brown text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-50"
      >
        <div className="relative">
          🛒
          {getCartTotalItems() > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {getCartTotalItems()}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductDetail;