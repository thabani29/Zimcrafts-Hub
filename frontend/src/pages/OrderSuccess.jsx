import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import apiService from "../services/api";

const formatStatus = (status) => {
  if (!status) return "Pending";
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const paymentMethodLabel = (method) => {
  const labels = {
    stripe: "Stripe",
    paypal: "PayPal",
    bank_transfer: "Bank Transfer",
    cash_on_delivery: "Cash on Delivery",
    paynow: "PayNow",
    manual: "Payment on fulfillment",
  };
  return labels[method] || method || "Unknown";
};

const formatWhatsAppUrl = (phone, message) => {
  if (!phone) return null;
  const sanitized = String(phone).replace(/[^\d]/g, "");
  if (!sanitized) return null;
  return `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
};

const getUniqueSellers = (items = []) => {
  const seen = new Set();
  return items
    .map((item) => {
      const seller = item?.seller;
      if (!seller) return null;
      const id = typeof seller === 'object' ? seller._id : seller;
      if (!id || seen.has(id)) return null;
      seen.add(id);
      return typeof seller === 'object'
        ? seller
        : { _id: id, name: 'Artisan', Cell: null };
    })
    .filter(Boolean);
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-ZW', {
    style: 'currency',
    currency: 'USD',
  }).format(value || 0);
};

const generateReceiptHtml = (order) => {
  const shipping = order.shippingAddress || {};
  const items = order.items || [];
  const subtotal = order.subtotal || 0;
  const shippingCost = order.shippingCost || 0;
  const tax = order.tax || 0;
  const discount = order.discount || 0;
  const total = order.total || 0;

  const sellers = [];
  items.forEach((item) => {
    const seller = item?.seller;
    if (seller && typeof seller === 'object' && seller._id && !sellers.some((s) => s._id === seller._id)) {
      sellers.push(seller);
    }
  });

  const sellerRows = sellers.length
    ? sellers.map((seller) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${seller.name || 'Artisan'}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${seller.Cell || 'Not provided'}</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="2" style="padding: 10px; border: 1px solid #e2e8f0;">Seller details unavailable</td>
      </tr>
    `;

  const itemsRows = items
    .map((item, index) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${index + 1}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.name || 'Item'}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${item.quantity || 0}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>
    `)
    .join('');

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Receipt - ${order.orderNumber || ''}</title>
      <style>
        body { font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; margin: 0; padding: 24px; background: #f8fafc; }
        .receipt-card { max-width: 900px; margin: auto; background: #ffffff; padding: 32px; border-radius: 24px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08); }
        .header { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 32px; }
        .brand { font-size: 24px; font-weight: 700; color: #0f172a; }
        .status { font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: #f97316; font-weight: 700; }
        .section { margin-bottom: 32px; }
        .section-title { margin-bottom: 16px; font-size: 16px; font-weight: 700; color: #111827; }
        .grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .box { border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; background: #f8fafc; }
        .field-label { display: block; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #6b7280; }
        .field-value { font-size: 16px; font-weight: 600; color: #111827; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 14px 12px; border: 1px solid #e2e8f0; }
        th { background: #f1f5f9; text-align: left; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; }
        .text-right { text-align: right; }
        .summary { width: 100%; max-width: 400px; margin-left: auto; margin-top: 24px; }
        .summary-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 15px; }
        .summary-row.total { font-weight: 700; font-size: 17px; border-top: 1px solid #e2e8f0; margin-top: 10px; padding-top: 16px; }
        .footer { margin-top: 48px; font-size: 13px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div>
            <div class="brand">ZimCrafts Hub</div>
            <div>Professional Receipt</div>
          </div>
          <div class="status">${formatStatus(order.status)}</div>
        </div>

        <div class="section grid">
          <div class="box">
            <div class="field-label">Receipt</div>
            <div class="field-value">${order.orderNumber || 'N/A'}</div>
            <div class="field-label" style="margin-top: 12px;">Date</div>
            <div class="field-value">${new Date(order.createdAt || Date.now()).toLocaleDateString()}</div>
          </div>
          <div class="box">
            <div class="field-label">Customer</div>
            <div class="field-value">${order.user?.name || shipping.name || 'Guest'}</div>
            <div class="field-label" style="margin-top: 12px;">Phone</div>
            <div class="field-value">${shipping.phone || order.user?.Cell || 'Not provided'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Delivery Address</div>
          <div class="box">
            <div>${shipping.name || ''}</div>
            <div>${shipping.street || ''}</div>
            <div>${shipping.city || ''} ${shipping.state || ''}</div>
            <div>${shipping.country || 'Zimbabwe'} ${shipping.zipCode || ''}</div>
            <div>${shipping.email || ''}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Seller details</div>
          <table>
            <thead>
              <tr>
                <th style="padding: 12px; border: 1px solid #e2e8f0; background: #f1f5f9; text-align:left;">Seller</th>
                <th style="padding: 12px; border: 1px solid #e2e8f0; background: #f1f5f9; text-align:left;">Phone</th>
              </tr>
            </thead>
            <tbody>
              ${sellerRows}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Order items</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>

        <div class="summary">
          <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
          <div class="summary-row"><span>Shipping</span><span>${formatCurrency(shippingCost)}</span></div>
          <div class="summary-row"><span>Tax</span><span>${formatCurrency(tax)}</span></div>
          ${discount ? `<div class="summary-row"><span>Discount</span><span>-${formatCurrency(discount)}</span></div>` : ''}
          <div class="summary-row total"><span>Total</span><span>${formatCurrency(total)}</span></div>
        </div>

        <div class="footer">
          Thank you for shopping with ZimCrafts Hub. If you have questions about your order, please contact support.
        </div>
      </div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
  </html>`;
};

const openReceiptWindow = (order) => {
  const receiptHtml = generateReceiptHtml(order);
  const receiptWindow = window.open('', '_blank');
  if (!receiptWindow) {
    alert('Please allow popups to open the receipt.');
    return;
  }
  receiptWindow.document.open();
  receiptWindow.document.write(receiptHtml);
  receiptWindow.document.close();
  receiptWindow.focus();
};

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiService.getOrderById(id);
        setOrder(res?.data?.data || res?.data || res);
      } catch (error) {
        console.error("Failed to load order", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setVerificationError("Please enter the verification code");
      return;
    }

    setVerifying(true);
    setVerificationError("");

    try {
      const res = await apiService.verifyOrderCode(id, { code: verificationCode.trim() });
      setOrder(res?.data?.data || res?.data || res);
      alert("Order completed successfully!");
    } catch (error) {
      setVerificationError(error.message || "Invalid verification code");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-10 text-center shadow-[0_25px_50px_-25px_rgba(15,23,42,0.25)]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-orange/10 text-3xl text-primary-orange">
            ✓
          </div>
          <p className="text-lg font-semibold text-slate-700">Loading your order details</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-lg rounded-[2rem] bg-white p-10 text-center shadow-[0_25px_50px_-25px_rgba(15,23,42,0.25)]">
          <h2 className="text-2xl font-semibold text-slate-800">Order not found</h2>
          <p className="mt-3 text-slate-500">Please check your order link or return to the shop.</p>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-primary-brown px-6 py-3 text-white transition hover:bg-primary-orange">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const estimatedDate = new Date(order.createdAt || Date.now());
  estimatedDate.setDate(estimatedDate.getDate() + 5);
  const shipping = order.shippingAddress || {};

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_25px_75px_-35px_rgba(15,23,42,0.2)] animate-fade-in">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_0.95fr]">
            <section className="px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex flex-col gap-4 rounded-[2rem] bg-gradient-to-r from-primary-orange/10 via-white to-primary-brown/10 p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-orange/10 text-3xl text-primary-orange shadow-md">
                    ✓
                  </div>
                  <p className="text-sm uppercase tracking-[0.3em] text-primary-orange">Order Success</p>
                  <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Your order is confirmed</h1>
                  <p className="mt-3 max-w-2xl text-slate-600">Thank you for shopping at ZimCrafts Hub. Your artisan has received your order and will begin preparation shortly.</p>
                </div>
                <div className="rounded-3xl bg-slate-900/5 p-5 text-slate-900">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Order Total</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">${order.total?.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Order Number</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">{order.orderNumber}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Estimated Delivery</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">{estimatedDate.toDateString()}</p>
                </div>
              </div>

              <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Order Status</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{formatStatus(order.status)}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">{formatStatus(order.status)}</span>
                </div>

                {getUniqueSellers(order.items).length > 0 && (
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-700">Chat with your artisan</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {getUniqueSellers(order.items).map((seller) => {
                        const whatsappUrl = formatWhatsAppUrl(
                          seller.Cell,
                          `Hello ${seller.name || 'Artisan'}, I have a question about order ${order.orderNumber}.`
                        );
                        if (!whatsappUrl) {
                          return (
                            <span key={seller._id} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-500">
                              {seller.name || 'Artisan'} phone unavailable
                            </span>
                          );
                        }
                        return (
                          <a
                            key={seller._id}
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                          >
                            Chat with {seller.name || 'Artisan'}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Delivery Verification Section */}
                {order.status === 'awaiting_confirmation' && (
                  <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Complete Your Order</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Your seller has marked this order as complete. Please enter the verification code sent to your email to confirm delivery.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-1">
                          Verification Code
                        </label>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          className="w-full px-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          maxLength="6"
                        />
                      </div>

                      {verificationError && (
                        <p className="text-sm text-red-600">{verificationError}</p>
                      )}

                      <button
                        onClick={handleVerifyCode}
                        disabled={verifying}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {verifying ? "Verifying..." : "Verify & Complete Order"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Payment</p>
                    <p className="mt-2 text-slate-700">{paymentMethodLabel(order.paymentMethod)}</p>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Delivery</p>
                    <p className="mt-2 text-slate-700">{shipping.city || "Location not set"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 rounded-[2rem] bg-slate-50 p-6 shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-900">Items in your order</h2>
                <p className="mt-2 text-sm text-slate-600">These items have been shared with your artisan for fulfillment.</p>

                <div className="mt-6 space-y-4">
                  {order.items.map((item, index) => (
                    <div key={item._id || index} className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm sm:flex-row sm:items-center">
                      <div className="relative h-24 w-full overflow-hidden rounded-3xl bg-slate-100 sm:h-28 sm:w-28">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">No image</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-slate-900">{item.name}</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm text-slate-600">
                          <span className="rounded-full bg-white px-3 py-2 border border-slate-200">Qty: {item.quantity}</span>
                          <span className="rounded-full bg-white px-3 py-2 border border-slate-200">Unit: ${item.price?.toFixed(2)}</span>
                          <span className="rounded-full bg-white px-3 py-2 border border-slate-200">Subtotal: ${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="rounded-[2rem] bg-slate-950 p-8 text-white sm:p-10">
              <div className="rounded-[1.75rem] bg-slate-900/95 p-6 shadow-xl shadow-slate-900/10">
                <h3 className="text-xl font-semibold">Delivery summary</h3>
                <p className="mt-3 text-sm text-slate-400">We will deliver to the address below once the artisan ships your items.</p>

                <div className="mt-6 space-y-3 text-slate-200">
                  <p className="font-semibold">{shipping.name || ""}</p>
                  <p>{shipping.street || ""}</p>
                  <p>{shipping.city || ""}, {shipping.state || ""}</p>
                  <p>{shipping.country || "Zimbabwe"} {shipping.zipCode || ""}</p>
                  <p className="mt-3 text-sm text-slate-400">Phone: {shipping.phone || "Not provided"}</p>
                  <p className="text-sm text-slate-400">Email: {shipping.email || "Not provided"}</p>
                </div>

<div className="mt-8 rounded-[1.75rem] border border-slate-800 bg-slate-950/90 p-5">
              <div className="space-y-4 text-slate-300">
                <div className="flex items-center justify-between text-sm">
                  <span>Items total</span>
                  <span>${order.subtotal?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Shipping</span>
                  <span>${order.shippingCost?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Tax</span>
                  <span>${order.tax?.toFixed(2) || "0.00"}</span>
                </div>
                {order.discount ? (
                  <div className="flex items-center justify-between text-sm">
                    <span>Discount</span>
                    <span>-${order.discount?.toFixed(2)}</span>
                  </div>
                ) : null}
              </div>
                  <div className="mt-5 border-t border-slate-800 pt-5 text-base font-semibold text-white">
                    <div className="flex items-center justify-between">
                      <span>Final total</span>
                      <span>${order.total?.toFixed(2) || "0.00"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <Link to="/orders" className="block rounded-full bg-primary-orange px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-primary-brown">
                    View my orders
                  </Link>
                  <Link to="/" className="block rounded-full border border-white/10 bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/20">
                    Continue shopping
                  </Link>
                  <button
                    type="button"
                    onClick={() => openReceiptWindow(order)}
                    className="w-full rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Download receipt
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
