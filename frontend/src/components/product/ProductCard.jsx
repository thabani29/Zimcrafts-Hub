import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [currentProduct, setCurrentProduct] = useState(product);
  const [showAlert, setShowAlert] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingMessage, setRatingMessage] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  useEffect(() => {
    setCurrentProduct(product);
  }, [product]);

  const handleAddToCart = () => {
    addToCart(product);
    setShowAlert(true);
  };

  // Auto-hide alert
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const getProductImage = () => {
    if (product.productimages && product.productimages.length > 0) {
      const primaryImage =
        product.productimages.find(img => img.isPrimary) ||
        product.productimages[0];
      return primaryImage.url;
    }
    return 'https://via.placeholder.com/300x200?text=No+Image';
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);

  const truncateDescription = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length <= maxLength
      ? text
      : text.substring(0, maxLength) + '...';
  };

  const submitRating = async (rating, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setRatingError('');
    setRatingMessage('');

    if (!user) {
      setRatingError('Please log in to rate this product.');
      return;
    }

    if (ratingSubmitting) {
      return;
    }

    setRatingSubmitting(true);

    try {
      await apiService.postProductReview(currentProduct._id, {
        rating,
        title: `Rated ${rating} star${rating > 1 ? 's' : ''}`,
        comment: 'Quick rating submitted from product listing.'
      });

      setRatingValue(rating);
      setRatingMessage('Thank you! Your rating has been submitted.');

      const updatedResponse = await apiService.getProductById(currentProduct._id);
      const updatedProduct = updatedResponse?.data?.product || updatedResponse?.product || updatedResponse?.data || currentProduct;
      setCurrentProduct(updatedProduct);
    } catch (err) {
      setRatingError(err.message || 'Failed to submit rating.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  return (
    <Link to={`/products/${product._id}`} className="block h-full group">
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

        {/* ✅ ALERT */}
        {showAlert && (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-bounce z-10">
            ✅ Added To Cart!
          </div>
        )}

        {/* Product Image */}
        <div className="relative h-40 overflow-hidden bg-gray-200">
          <img
            src={getProductImage()}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
            }}
          />

          {/* Badges */}
          {product.isFeatured && (
            <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
              Featured
            </span>
          )}
          {product.stock <= 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              Out of Stock
            </span>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-1 flex-col p-4">
          {product.artisan && (
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
              By {product.artisan.name || 'Artisan'}
            </p>
          )}

          <h3 className="mb-2 min-h-[3rem] text-lg font-semibold leading-tight text-gray-800 line-clamp-2">
            {product.name}
          </h3>

          <p className="mb-3 min-h-[2.5rem] text-sm leading-5 text-gray-600 line-clamp-2">
            {truncateDescription(product.description)}
          </p>

          {/* Rating */}
          <div className="mb-3 flex-1">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => {
                  const rating = Math.round(currentProduct?.ratings?.average || 0);
                  return (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${
                        star <= rating
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  );
                })}
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                ({currentProduct?.ratings?.count || currentProduct.reviews?.length || 0} reviews)
              </span>
            </div>
            <div className="mb-2 text-[11px] text-gray-500">Tap stars to rate this product</div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const selected = star <= (ratingHover || ratingValue);
                return (
                  <button
                    key={star}
                    type="button"
                    disabled={ratingSubmitting}
                    onClick={(e) => submitRating(star, e)}
                    onMouseEnter={() => setRatingHover(star)}
                    onMouseLeave={() => setRatingHover(0)}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors duration-150 ${
                      selected ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-500 hover:bg-yellow-300'
                    }`}
                  >
                    ★
                  </button>
                );
              })}
            </div>
            {(ratingMessage || ratingError) && (
              <p className={`mt-2 text-sm ${ratingMessage ? 'text-green-600' : 'text-red-600'}`}>
                {ratingMessage || ratingError}
              </p>
            )}
          </div>

          {/* Price & Cart */}
          <div className="mt-auto border-t border-gray-100 pt-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-h-[2.75rem]">
                <span className="text-xl font-bold text-primary-orange">
                {formatPrice(product.price)}
                </span>
                {product.oldPrice && (
                  <span className="ml-2 text-sm text-gray-400 line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
                {product.stock > 0 && product.stock < 5 && (
                  <p className="mt-1 text-[11px] font-medium text-orange-500">
                    Only {product.stock} left in stock!
                  </p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleAddToCart();
                }}
                disabled={product.stock <= 0}
                className={`min-w-[6.75rem] rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  product.stock <= 0
                    ? 'cursor-not-allowed bg-gray-300 text-gray-600'
                    : 'bg-primary-brown text-white hover:bg-primary-orange'
                }`}
              >
                {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
