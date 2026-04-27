import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { items, removeFromCart, updateQuantity, getCartTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();

  const getCartItemImage = (item) =>
    item.image ||
    (Array.isArray(item.productimages) &&
      (item.productimages.find((image) => image?.isPrimary)?.url ||
        item.productimages[0]?.url)) ||
    'https://via.placeholder.com/160x160?text=No+Image';

  const handleQuantityChange = (product, newQuantity) => {
    if (newQuantity < 1) return;

    if (newQuantity > product.stock) {
      alert(`Cannot add more than available stock (${product.stock})`);
      return;
    }

    updateQuantity(product.id, newQuantity);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    if (!user) {
      alert('Please login to proceed to checkout.');
      navigate('/login');
      return;
    }

    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-brown mb-8">Shopping Cart</h1>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Start shopping to add items to your cart</p>
          <Link
            to="/products"
            className="bg-primary-orange text-white px-8 py-3 rounded-xl hover:bg-primary-brown transform hover:scale-105 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl inline-block"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary-brown">Shopping Cart</h1>
        <button
          onClick={clearCart}
          className="text-red-500 hover:text-red-700 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-lg p-4 flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                <img
                  src={getCartItemImage(item)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/160x160?text=No+Image';
                  }}
                />
              </div>

              <div className="flex-grow">
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                <p className="text-primary-brown font-bold text-lg">${item.price}</p>
                <p className="text-sm text-gray-500">Stock: {item.stock}</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuantityChange(item, item.quantity - 1)}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item, item.quantity + 1)}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  +
                </button>
              </div>

              <div className="text-right">
                <p className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 h-fit">
          <h2 className="text-xl font-bold text-primary-brown mb-4">Order Summary</h2>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${getCartTotalPrice().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>$5.00</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${(getCartTotalPrice() * 0.15).toFixed(2)}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary-brown">
                ${(getCartTotalPrice() + 5 + (getCartTotalPrice() * 0.15)).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full bg-primary-orange text-white py-3 rounded-xl hover:bg-primary-brown transform hover:scale-105 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl mb-4"
          >
            Proceed to Checkout
          </button>

          <Link
            to="/products"
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-xl hover:bg-gray-300 transform hover:scale-105 transition-all duration-300 font-semibold text-center block"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
