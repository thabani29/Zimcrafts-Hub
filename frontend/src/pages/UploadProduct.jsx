import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/api';
import ImageUploader from '../components/product/ImageUploader';

const UploadProduct = () => {
  const { id: productId } = useParams();
  const isEditMode = Boolean(productId);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    subcategory: '',
    stock: '',
    tags: '',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // Fetch categories and product data on mount
  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchProduct();
    }
  }, [isEditMode]);

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImagesSelected = (newImages) => {
    setImages(prev => [...prev, ...newImages]);
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProductById(productId);
      const product = response?.data?.product || response?.data || response;

      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category?._id || product.category || '',
        subcategory: product.subcategory || '',
        stock: product.stock || '',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : product.tags || '',
        isFeatured: product.isFeatured || false,
        isNewArrival: product.isNewArrival || false,
        isBestSeller: product.isBestSeller || false,
      });

      setExistingImages(product.productimages || product.images || []);
    } catch (err) {
      console.error('Error loading product for edit:', err);
      setError(err.message || 'Failed to load product for editing');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Product name is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.price || formData.price <= 0) return 'Valid price is required';
    if (!formData.category) return 'Category is required';
    if (!formData.stock || formData.stock < 0) return 'Valid stock quantity is required';
    if (images.length === 0 && existingImages.length === 0) return 'At least one product image is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      const form = new FormData();

      // Append text fields
      Object.keys(formData).forEach(key => form.append(key, formData[key]));
      form.append('tags', JSON.stringify(tagsArray));

      if (isEditMode) {
        form.append('productimages', JSON.stringify(existingImages));
      }

      // Append images
      images.forEach(image => form.append('images', image));

      let res;
      if (isEditMode) {
        res = await apiService.updateProduct(productId, form);
      } else {
        res = await apiService.createProduct(form);
      }

      alert(`✅ Product ${isEditMode ? 'updated' : 'uploaded'} successfully!`);
      navigate('/seller-dashboard');

    } catch (err) {
      console.error('❌ Error uploading product:', err);
      setError(
        err.response?.data?.message || 'Failed to upload product. Please login again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-brown">
            {isEditMode ? 'Edit Product' : 'Upload New Product'}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? 'Update the product details and save changes.'
              : 'Add your handmade craft to ZimCraftHub marketplace'}
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                placeholder="e.g., Handwoven Zimbabwean Basket"
                maxLength="100"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                placeholder="Describe your product, materials used, dimensions, etc."
                maxLength="2000"
              />
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (USD) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory (Optional)
                </label>
                <input
                  type="text"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                  placeholder="e.g., Cooking Pots"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                placeholder="handmade, ceramic, traditional"
              />
            </div>

            {/* Product Flags */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Product Highlights</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['isFeatured','isNewArrival','isBestSeller'].map(flag => (
                  <label key={flag} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name={flag}
                      checked={formData[flag]}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-orange focus:ring-primary-orange border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      {flag === 'isFeatured' ? 'Featured Product' :
                       flag === 'isNewArrival' ? 'New Arrival' : 'Best Seller'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Existing Images */}
            {isEditMode && existingImages.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Existing Images
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {existingImages.map((image, index) => (
                    <div key={image.fileId || image.url || index} className="relative group border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={image.url || image}
                        alt={image.altText || `Existing image ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-90 hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Remove existing images before saving. You can also upload additional images below.
                </p>
              </div>
            )}

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images * (Max 5)
              </label>
              <ImageUploader
                onImagesSelected={handleImagesSelected}
                onRemoveImage={handleRemoveImage}
                images={images}
                maxImages={Math.max(0, 5 - existingImages.length)}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-brown hover:bg-primary-orange text-white py-3 px-8 rounded-lg transition-colors duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                    {isEditMode ? 'Saving...' : 'Uploading...'}
                  </>
                ) : (
                  isEditMode ? 'Save Changes' : 'Upload Product'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/seller-dashboard')}
                className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-8 rounded-lg transition-colors duration-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadProduct;