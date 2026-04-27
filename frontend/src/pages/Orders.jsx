import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openGroups, setOpenGroups] = useState({});

  const formatWhatsAppUrl = (phone, message) => {
    if (!phone) return null;
    const sanitized = String(phone).replace(/[^\d]/g, "");
    if (!sanitized) return null;
    return `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
  };

  const getUniqueSellers = (items = []) => {
    const unique = [];
    items.forEach((item) => {
      const seller = item?.seller;
      if (seller && seller._id && !unique.some((entry) => entry._id === seller._id)) {
        unique.push(seller);
      }
    });
    return unique;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiService.getMyOrders();
        const ordersData = response.data || response?.orders || [];
        setOrders(ordersData);

        const groupedOrders = buildOrderGroups(ordersData);
        setOpenGroups(
          groupedOrders.reduce((accumulator, group, index) => {
            accumulator[group.key] = index === 0;
            return accumulator;
          }, {})
        );
      } catch (err) {
        setError(err.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const groupedOrders = useMemo(() => buildOrderGroups(orders), [orders]);

  const toggleGroup = (groupKey) => {
    setOpenGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
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
          <h2 className="text-xl font-semibold">Unable to load orders</h2>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
          <p className="mt-2 text-slate-600">Review the status of your purchases and expand only the month you want to inspect.</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-primary-orange px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-brown"
        >
          Continue Shopping
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-xl font-semibold text-slate-900">No orders yet.</p>
          <p className="mt-3 text-slate-600">Browse products and place your first order.</p>
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
                            <p className="mt-1 font-semibold text-slate-900">{order.status}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Total</p>
                            <p className="mt-1 font-semibold text-slate-900">${order.total?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Placed</p>
                            <p className="mt-1 font-semibold text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-sm text-slate-500">Shipping</p>
                          <p className="mt-2 text-slate-700">{order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
                        </div>
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-sm text-slate-500">Payment</p>
                          <p className="mt-2 text-slate-700">{order.paymentMethod}</p>
                        </div>
                      </div>

                      {getUniqueSellers(order.items).length > 0 && (
                        <div className="mt-6 rounded-3xl bg-slate-50 p-4">
                          <p className="text-sm text-slate-500">Contact artisan</p>
                          <div className="mt-3 flex flex-wrap gap-3">
                            {getUniqueSellers(order.items).map((seller) => {
                              const whatsappUrl = formatWhatsAppUrl(
                                seller.Cell || seller.phone,
                                `Hello ${seller.name || "Artisan"}, I have a question about order ${order.orderNumber}.`
                              );

                              if (!whatsappUrl) return null;

                              return (
                                <a
                                  key={seller._id}
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                                >
                                  Chat with {seller.name || "Artisan"}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                        <Link
                          to={`/order-success/${order._id}`}
                          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                          View details
                        </Link>
                        <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">{order.items?.length || 0} items</span>
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

export default Orders;
