// frontend/src/context/CartContext.jsx
import React, { createContext, useContext, useReducer } from 'react';
import { useAuth } from './AuthContext';

// ----------------------------
// Create Cart Context
// ----------------------------
const CartContext = createContext();

const normalizeCartProduct = (product) => {
  const productId =
    product?._id ||
    product?.id ||
    product?.productId ||
    product?.product?._id ||
    product?.product?.id ||
    product?.product;

  const primaryProductImage =
    (Array.isArray(product?.productimages) &&
      (product.productimages.find((image) => image?.isPrimary)?.url ||
        product.productimages[0]?.url)) ||
    (Array.isArray(product?.images) &&
      (product.images.find((image) => image?.isPrimary)?.url ||
        product.images[0]?.url ||
        product.images[0])) ||
    product?.image ||
    product?.imageUrl ||
    product?.product?.image ||
    product?.product?.imageUrl ||
    (Array.isArray(product?.product?.productimages) &&
      (product.product.productimages.find((image) => image?.isPrimary)?.url ||
        product.product.productimages[0]?.url)) ||
    'https://via.placeholder.com/300x200?text=No+Image';

  return {
    ...product,
    id: productId,
    _id: productId,
    image: primaryProductImage,
  };
};

// ----------------------------
// Cart Reducer
// ----------------------------
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.items.find(item => item.id === action.payload.id);

      if (existingItem) {
        const maxQuantity = existingItem.stock || Infinity;
        const newQuantity = Math.min(existingItem.quantity + 1, maxQuantity);

        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: newQuantity }
              : item
          )
        };
      } else {
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: 1 }]
        };
      }
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item => {
          if (item.id === action.payload.id) {
            const maxQuantity = item.stock || Infinity;
            const newQuantity = Math.min(action.payload.quantity, maxQuantity);
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
      };

    case 'CLEAR_CART':
      return { ...state, items: [] };

    default:
      return state || { items: [] };
  }
};

// ----------------------------
// Initial State
// ----------------------------
const initialState = { items: [] };

// ----------------------------
// Cart Provider
// ----------------------------
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // ✅ Get user from AuthContext (NO API CALL)
  const { user } = useAuth();

  // ------------------------
  // Utility Functions
  // ------------------------
  const isAuthenticated = () => !!user;

  const getCartTotalItems = () =>
    (state?.items || []).reduce((total, item) => total + item.quantity, 0);

  const getCartTotalPrice = () =>
    (state?.items || []).reduce((total, item) => total + item.price * item.quantity, 0);

  const addToCart = product =>
    dispatch({ type: 'ADD_TO_CART', payload: normalizeCartProduct(product) });

  const removeFromCart = productId =>
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });

  const updateQuantity = (productId, quantity) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });

  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  return (
    <CartContext.Provider
      value={{
        items: state?.items || [],
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotalItems,
        getCartTotalPrice,
        user, // ✅ comes from AuthContext
        isAuthenticated
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ----------------------------
// Custom Hook
// ----------------------------
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
