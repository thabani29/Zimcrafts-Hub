import React, { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addToCart = (product, quantity = 1) => {
    const id = product?._id || product?.id;
    if (!id) {
      return;
    }

    setItems((current) => {
      const existing = current.find((item) => item._id === id);
      if (existing) {
        return current.map((item) =>
          item._id === id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      return [
        ...current,
        {
          _id: id,
          name: product.name,
          price: product.price,
          quantity,
          stock: product.stock,
          image:
            product?.productimages?.find((entry) => entry?.isPrimary)?.url ||
            product?.productimages?.[0]?.url ||
            product?.image ||
            "",
        },
      ];
    });
  };

  const updateItemQuantity = (id, quantity) => {
    setItems((current) =>
      current
        .map((item) => (item._id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setItems((current) => current.filter((item) => item._id !== id));
  };

  const clearCart = () => setItems([]);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      addToCart,
      updateItemQuantity,
      removeFromCart,
      clearCart,
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
