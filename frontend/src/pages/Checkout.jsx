import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import apiService from "../services/api";

const isValidMongoId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

const Checkout = () => {
  const { items, getCartTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const getCartItemImage = (item) =>
    item.image ||
    (Array.isArray(item.productimages) &&
      (item.productimages.find((image) => image?.isPrimary)?.url ||
        item.productimages[0]?.url)) ||
    "/placeholder.png";

  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [shippingErrors, setShippingErrors] = useState({});

  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    country: "Zimbabwe",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress({
      ...shippingAddress,
      [name]: value,
    });
    setShippingErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateShipping = () => {
    const errors = {};

    if (!shippingAddress.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!shippingAddress.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    if (!shippingAddress.street.trim()) {
      errors.street = 'Street address is required';
    }
    if (!shippingAddress.city.trim()) {
      errors.city = 'City is required';
    }
    if (!shippingAddress.state.trim()) {
      errors.state = 'Province is required';
    }
    if (!shippingAddress.zipCode.trim()) {
      errors.zipCode = 'Zip code is required';
    }

    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!items || items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    if (!validateShipping()) {
      setError("Please fill in all required shipping fields.");
      return;
    }

    try {
      setPlacingOrder(true);
      setError("");

      const shippingCost = 5.00;
      const tax = getCartTotalPrice() * 0.15;

      const normalizedItems = items.map((item) => ({
        product: item._id || item.id || item.product?._id || item.product?.id || item.product,
        quantity: item.quantity,
      }));

      const invalidItem = normalizedItems.find((item) => !isValidMongoId(item.product));
      if (invalidItem) {
        throw new Error("One of the cart items has an invalid product id. Please remove it and add it again.");
      }

      const orderData = {
        items: normalizedItems,
        shippingAddress,
        shippingCost,
        tax,
      };

      const res = await apiService.createOrder(orderData);
      const order = res?.data || res;
      const orderId = order?._id;

      if (!orderId) {
        throw new Error("Order was created, but no order id was returned.");
      }

      clearCart();
      navigate(`/order-success/${orderId}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to place order");
    }

    setPlacingOrder(false);
  };

  return (
    <div className="bg-gray-100 min-h-screen py-10">

      <div className="max-w-7xl mx-auto px-6">

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-100 text-red-600 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white p-10 rounded shadow text-center">
            <p className="text-gray-500 text-lg">Your cart is empty</p>
          </div>
        ) : (

          <div className="grid lg:grid-cols-3 gap-8">

            {/* Shipping Form */}
            <div className="lg:col-span-2 bg-white p-8 rounded shadow">

              <h2 className="text-xl font-semibold mb-6">
                Shipping Information
              </h2>

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={shippingAddress.name}
                    onChange={handleChange}
                    className={`border p-3 rounded w-full ${shippingErrors.name ? 'border-red-500 ring-1 ring-red-200' : ''}`}
                  />
                  {shippingErrors.name && <p className="mt-1 text-sm text-red-600">{shippingErrors.name}</p>}
                </div>

                <div>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone Number"
                    value={shippingAddress.phone}
                    onChange={handleChange}
                    className={`border p-3 rounded w-full ${shippingErrors.phone ? 'border-red-500 ring-1 ring-red-200' : ''}`}
                  />
                  {shippingErrors.phone && <p className="mt-1 text-sm text-red-600">{shippingErrors.phone}</p>}
                </div>

                <div className="md:col-span-2">
                  <input
                    type="text"
                    name="street"
                    placeholder="Street Address"
                    value={shippingAddress.street}
                    onChange={handleChange}
                    className={`border p-3 rounded w-full ${shippingErrors.street ? 'border-red-500 ring-1 ring-red-200' : ''}`}
                  />
                  {shippingErrors.street && <p className="mt-1 text-sm text-red-600">{shippingErrors.street}</p>}
                </div>

                <div>
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={shippingAddress.city}
                    onChange={handleChange}
                    className={`border p-3 rounded w-full ${shippingErrors.city ? 'border-red-500 ring-1 ring-red-200' : ''}`}
                  />
                  {shippingErrors.city && <p className="mt-1 text-sm text-red-600">{shippingErrors.city}</p>}
                </div>

                <div>
                  <input
                    type="text"
                    name="state"
                    placeholder="Province"
                    value={shippingAddress.state}
                    onChange={handleChange}
                    className={`border p-3 rounded w-full ${shippingErrors.state ? 'border-red-500 ring-1 ring-red-200' : ''}`}
                  />
                  {shippingErrors.state && <p className="mt-1 text-sm text-red-600">{shippingErrors.state}</p>}
                </div>

                <div>
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="Zip Code"
                    value={shippingAddress.zipCode}
                    onChange={handleChange}
                    className={`border p-3 rounded w-full ${shippingErrors.zipCode ? 'border-red-500 ring-1 ring-red-200' : ''}`}
                  />
                  {shippingErrors.zipCode && <p className="mt-1 text-sm text-red-600">{shippingErrors.zipCode}</p>}
                </div>

              </div>

            </div>

            {/* Order Summary */}
            <div className="bg-white p-8 rounded shadow h-fit sticky top-10">

              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

              <div className="space-y-4">

                {items.map((item) => (

                  <div
                    key={item.id || item._id}
                    className="flex items-center justify-between border-b pb-3"
                  >

                    <div className="flex items-center gap-3">

                      <img
                        src={getCartItemImage(item)}
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder.png";
                        }}
                      />

                      <div>

                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          ${item.price.toFixed(2)} each
                        </p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>

                      </div>

                    </div>

                    <p className="font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>

                  </div>

                ))}

                <div className="flex justify-between text-gray-600 pt-4">
                  <span>Subtotal</span>
                  <span>${getCartTotalPrice().toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>$5.00</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Tax (15%)</span>
                  <span>${(getCartTotalPrice() * 0.15).toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-bold text-lg border-t pt-4">
                  <span>Total</span>
                  <span>${(getCartTotalPrice() + 5 + getCartTotalPrice() * 0.15).toFixed(2)}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition"
                >
                  {placingOrder ? "Placing order..." : "Place Order"}
                </button>

                <p className="text-sm text-gray-500">
                  Your order will be placed immediately and sent to the artisan for fulfillment.
                </p>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
};

export default Checkout;
