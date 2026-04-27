import React, { useEffect, useMemo, useState } from "react";
import apiService from "../services/api";

const buildOrderGroups = (orders = []) => {
  const grouped = orders.reduce((accumulator, order) => {
    const date = new Date(order.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    if (!accumulator[monthKey]) {
      accumulator[monthKey] = {
        key: monthKey,
        label: monthLabel,
        orders: [],
      };
    }

    accumulator[monthKey].orders.push(order);
    return accumulator;
  }, {});

  return Object.values(grouped).sort((left, right) => right.key.localeCompare(left.key));
};

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [openGroups, setOpenGroups] = useState({});

  const formatWhatsAppUrl = (phone, message) => {
    if (!phone) return null;
    const sanitized = String(phone).replace(/[^\d]/g, "");
    if (!sanitized) return null;
    return `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
  };

  const getCustomerPhone = (order) => order.shippingAddress?.phone || order.user?.Cell;

  useEffect(() => {
    const fetchSellerOrders = async () => {
      try {
        const response = await apiService.getSellerOrders();
        const ordersData = response.data || [];
        setOrders(ordersData);

        const groupedOrders = buildOrderGroups(ordersData);
        setOpenGroups(
          groupedOrders.reduce((accumulator, group, index) => {
            accumulator[group.key] = index === 0;
            return accumulator;
          }, {})
        );
      } catch (err) {
        setError(err.message || "Failed to fetch seller orders");
      } finally {
        setLoading(false);
      }
    };

    fetchSellerOrders();
  }, []);

  const groupedOrders = useMemo(() => buildOrderGroups(orders), [orders]);

  const toggleGroup = (groupKey) => {
    setOpenGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      const response = await apiService.updateSellerOrderStatus(orderId, { status: newStatus });
      setOrders(orders.map((order) => (order._id === orderId ? response.data : order)));
      setStatusUpdates((current) => ({ ...current, [orderId]: null }));
    } catch (err) {
      alert(err.message || "Failed to update order status");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleTrackingUpdate = (orderId, field, value) => {
    setStatusUpdates((current) => ({
      ...current,
      [orderId]: { ...current[orderId], [field]: value },
    }));
  };

  const updateTrackingInfo = async (orderId) => {
    const updates = statusUpdates[orderId] || {};
    if (!updates.trackingNumber && !updates.shippingCarrier) return;

    setUpdatingOrder(orderId);
    try {
      const response = await apiService.updateSellerOrderStatus(orderId, updates);
      setOrders(orders.map((order) => (order._id === orderId ? response.data : order)));
      setStatusUpdates((current) => ({ ...current, [orderId]: null }));
    } catch (err) {
      alert(err.message || "Failed to update tracking info");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusOptions = (currentStatus) => {
    const allStatuses = ["pending", "confirmed", "processing", "shipped", "awaiting_confirmation", "cancelled"];
    return allStatuses.filter((status) => status !== currentStatus);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-16 w-16 rounded-full border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-10">
        <div className="rounded-3xl bg-red-50 p-8 text-red-700 shadow-sm">
          <h2 className="text-xl font-semibold">Unable to load seller orders</h2>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Seller Orders</h1>
        <p className="mt-2 text-slate-600">Orders are grouped by month so you can jump to the period you need quickly.</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-xl font-semibold text-slate-900">No seller orders found.</p>
          <p className="mt-3 text-slate-600">Once a customer orders your products, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedOrders.map((group) => (
            <div key={group.key} className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => toggleGroup(group.key)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <div>
                  <p className="text-lg font-semibold text-slate-900">{group.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{group.orders.length} order{group.orders.length === 1 ? "" : "s"}</p>
                </div>
                <span className="text-sm font-medium text-primary-orange">
                  {openGroups[group.key] ? "Collapse" : "Expand"}
                </span>
              </button>

              {openGroups[group.key] && (
                <div className="border-t border-slate-200 px-6 py-6 space-y-6">
                  {group.orders.map((order) => (
                    <div key={order._id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.2em] text-primary-orange">Order Number</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">{order.orderNumber}</p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3 sm:gap-6">
                          <div>
                            <p className="text-sm text-slate-500">Status</p>
                            <div className="flex items-center gap-2">
                              <select
                                value={order.status}
                                onChange={(event) => handleStatusChange(order._id, event.target.value)}
                                disabled={updatingOrder === order._id}
                                className="mt-1 px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange"
                              >
                                <option value={order.status}>{order.status}</option>
                                {getStatusOptions(order.status).map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                              {updatingOrder === order._id && (
                                <div className="w-4 h-4 border-t-2 border-primary-orange rounded-full animate-spin"></div>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Customer</p>
                            <p className="mt-1 font-semibold text-slate-900">{order.user?.name || "Guest"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Total</p>
                            <p className="mt-1 font-semibold text-slate-900">${order.total?.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      {order.status === "shipped" && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-2">Tracking Information</h4>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="block text-sm text-blue-700 mb-1">Tracking Number</label>
                              <input
                                type="text"
                                value={statusUpdates[order._id]?.trackingNumber || order.trackingNumber || ""}
                                onChange={(event) => handleTrackingUpdate(order._id, "trackingNumber", event.target.value)}
                                placeholder="Enter tracking number"
                                className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-blue-700 mb-1">Shipping Carrier</label>
                              <input
                                type="text"
                                value={statusUpdates[order._id]?.shippingCarrier || order.shippingCarrier || ""}
                                onChange={(event) => handleTrackingUpdate(order._id, "shippingCarrier", event.target.value)}
                                placeholder="Enter carrier name"
                                className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => updateTrackingInfo(order._id)}
                            disabled={updatingOrder === order._id}
                            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updatingOrder === order._id ? "Updating..." : "Update Tracking"}
                          </button>
                        </div>
                      )}

                      {order.status === "awaiting_confirmation" && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-900 mb-2">Awaiting Customer Confirmation</h4>
                          <p className="text-sm text-green-700">
                            A verification code has been sent to the customer. They must enter it to complete the order.
                          </p>
                        </div>
                      )}

                      <div className="mt-6 rounded-3xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Customer contact</p>
                        {getCustomerPhone(order) ? (
                          <a
                            href={formatWhatsAppUrl(
                              getCustomerPhone(order),
                              `Hello ${order.user?.name || "Customer"}, I have an update about your order ${order.orderNumber}.`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                          >
                            Chat with customer
                          </a>
                        ) : (
                          <p className="mt-2 text-sm text-slate-500">Customer phone not available.</p>
                        )}
                      </div>

                      <div className="mt-6 rounded-3xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Your items in this order</p>
                        <div className="mt-4 space-y-4">
                          {order.items?.map((item, index) => (
                            <div key={item._id || index} className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr_0.8fr] items-center rounded-3xl border border-slate-200 bg-white p-4">
                              <div>
                                <p className="font-semibold text-slate-900">{item.name}</p>
                                <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                              </div>
                              <p className="text-sm text-slate-700">${item.price?.toFixed(2)}</p>
                              <p className="text-sm font-semibold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
