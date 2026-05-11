import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import apiService from "../services/api";
import { useAuth } from "../context/AuthContext";

const SellerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [products, setProducts] = useState([]);
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletError, setWalletError] = useState("");
  const [walletLoading, setWalletLoading] = useState(true);
  const [tutorialRequests, setTutorialRequests] = useState([]);
  const [tutorialRequestsLoading, setTutorialRequestsLoading] = useState(true);
  const [tutorialRequestsError, setTutorialRequestsError] = useState("");
  const [requestActionLoadingId, setRequestActionLoadingId] = useState(null);
  const [topupAmount, setTopupAmount] = useState("10");
  const [topupLoading, setTopupLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUnitsSold: 0,
    totalOrders: 0,
    activeProducts: 0,
    totalProducts: 0,
    totalTutorials: 0,
    productRevenue: 0,
    tutorialRevenue: 0,
    totalRevenue: 0,
  });

  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchSellerProducts();
    fetchSellerTutorials();
    refreshSellerAnalytics();
    refreshWalletData();
    refreshTutorialRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const walletReference = new URLSearchParams(location.search).get("walletReference");

    if (!walletReference || !isAuthenticated) {
      return;
    }

    const confirmWalletTopup = async () => {
      try {
        await apiService.confirmWalletTopup(walletReference);
        await refreshWalletData();
      } catch (err) {
        console.error("Wallet top-up confirmation failed:", err);
        setWalletError(err.message || "Failed to confirm wallet top-up");
      } finally {
        navigate("/seller-dashboard", { replace: true });
      }
    };

    confirmWalletTopup();
  }, [isAuthenticated, location.search, navigate]);

  const refreshSellerAnalytics = async () => {
    try {
      const response = await apiService.getSellerAnalytics();
      setStats({
        totalUnitsSold: response?.data?.totalUnitsSold || 0,
        totalOrders: response?.data?.totalOrders || 0,
        activeProducts: response?.data?.activeProducts || 0,
        totalProducts: response?.data?.totalProducts || 0,
        totalTutorials: response?.data?.totalTutorials || 0,
        productRevenue: response?.data?.productRevenue || 0,
        tutorialRevenue: response?.data?.tutorialRevenue || 0,
        totalRevenue: response?.data?.totalRevenue || 0,
      });
    } catch (err) {
      console.error("Error fetching seller analytics:", err);
    }
  };

  const fetchSellerTutorials = async () => {
    try {
      const response = await apiService.getMyTutorials();
      setTutorials(response.data || []);
    } catch (err) {
      console.error("Error fetching tutorials:", err);
    }
  };

  const fetchSellerProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyProducts();
      setProducts(response.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      if (err.message === "Not authorized") {
        setError("Please login to view your seller dashboard.");
        navigate("/login");
      } else {
        setError(err.message || "Failed to fetch products");
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshWalletData = async () => {
    try {
      setWalletLoading(true);
      setWalletError("");

      const [walletResponse, transactionResponse] = await Promise.all([
        apiService.getWalletBalance(),
        apiService.getWalletTransactions({ limit: 8 }),
      ]);

      setWallet(walletResponse?.data || walletResponse);
      setWalletTransactions(transactionResponse?.data || []);
    } catch (err) {
      console.error("Error fetching wallet:", err);
      setWalletError(err.message || "Failed to load wallet data");
    } finally {
      setWalletLoading(false);
    }
  };

  const refreshTutorialRequests = async () => {
    try {
      setTutorialRequestsLoading(true);
      setTutorialRequestsError("");
      const response = await apiService.getArtisanTutorialRequests({ limit: 10 });
      setTutorialRequests(response?.data || []);
    } catch (err) {
      console.error("Error fetching tutorial requests:", err);
      setTutorialRequestsError(err.message || "Failed to load tutorial requests");
    } finally {
      setTutorialRequestsLoading(false);
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "draft" : "active";
      await apiService.updateProduct(productId, { status: newStatus });

      const updatedProducts = products.map((product) =>
        product._id === productId ? { ...product, status: newStatus } : product
      );

      setProducts(updatedProducts);
      await refreshSellerAnalytics();
      alert(`Product ${newStatus === "active" ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      alert("Failed to update product: " + err.message);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await apiService.deleteProduct(productId);
      const updatedProducts = products.filter((product) => product._id !== productId);
      setProducts(updatedProducts);
      await refreshSellerAnalytics();
      alert("Product deleted successfully");
    } catch (err) {
      alert("Failed to delete product: " + err.message);
    }
  };

  const deleteTutorial = async (tutorialId) => {
    if (!window.confirm("Are you sure you want to delete this tutorial?")) return;

    try {
      await apiService.deleteTutorial(tutorialId);
      setTutorials(tutorials.filter((tutorial) => tutorial._id !== tutorialId));
      await refreshSellerAnalytics();
      alert("Tutorial deleted successfully");
    } catch (err) {
      alert("Failed to delete tutorial: " + err.message);
    }
  };

  const getPrimaryImage = (product) => {
    if (product.productimages && product.productimages.length > 0) {
      const primary = product.productimages.find((image) => image.isPrimary);
      return primary ? primary.url : product.productimages[0].url;
    }

    return "https://via.placeholder.com/100x100?text=No+Image";
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(price) || 0);
  };

  const handleTopup = async () => {
    const amount = Number(topupAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setWalletError("Enter a valid amount to recharge your wallet.");
      return;
    }

    try {
      setTopupLoading(true);
      setWalletError("");
      const response = await apiService.startWalletTopup(amount);
      const redirectUrl = response?.data?.redirectUrl || response?.redirectUrl;

      if (!redirectUrl) {
        throw new Error("Paynow did not return a redirect URL.");
      }

      window.location.href = redirectUrl;
    } catch (err) {
      console.error("Wallet top-up failed:", err);
      setWalletError(err.message || "Failed to start wallet top-up");
    } finally {
      setTopupLoading(false);
    }
  };

  const getWalletStatusClasses = (status) => (
    status === "SUSPENDED" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
  );

  const getTransactionAmountClass = (amount) => (
    Number(amount) < 0 ? "text-red-600" : "text-emerald-600"
  );

  const getTutorialRequestStatusClasses = (status) => {
    if (status === "APPROVED") return "bg-emerald-100 text-emerald-700";
    if (status === "REJECTED") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  const handleTutorialRequestAction = async (requestId, action) => {
    try {
      setRequestActionLoadingId(requestId);
      await apiService.respondToTutorialRequest(requestId, action);
      await Promise.all([refreshTutorialRequests(), refreshSellerAnalytics()]);
    } catch (err) {
      console.error("Failed to respond to tutorial request:", err);
      setTutorialRequestsError(err.message || "Failed to update tutorial request");
    } finally {
      setRequestActionLoadingId(null);
    }
  };

  const availableBalance = Number(wallet?.availableBalance || 0);
  const amountOwed = Number(wallet?.amountOwed || 0);
  const hasAvailableBalance = availableBalance > 0;
  const hasAmountOwed = amountOwed > 0;
  const pendingTutorialRequests = tutorialRequests.filter((request) => request.status === "PENDING").length;

  const sidebarItems = [
    { id: "overview", label: "Overview", badge: null },
    { id: "products", label: "Products", badge: products.length },
    { id: "tutorials", label: "Tutorials", badge: tutorials.length },
    { id: "wallet", label: "Wallet", badge: hasAmountOwed ? formatPrice(amountOwed) : null },
    { id: "requests", label: "Tutorial Requests", badge: pendingTutorialRequests || null },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-16 w-16 border-b-2 border-orange-500 rounded-full"></div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white p-6 shadow rounded-3xl">
          <h3>Total Products</h3>
          <p className="text-2xl font-bold">{stats.totalProducts}</p>
        </div>
        <div className="bg-white p-6 shadow rounded-3xl">
          <h3>Active Products</h3>
          <p className="text-2xl font-bold">{stats.activeProducts}</p>
        </div>
        <div className="bg-white p-6 shadow rounded-3xl">
          <h3>Units Sold</h3>
          <p className="text-2xl font-bold">{stats.totalUnitsSold}</p>
        </div>
        <div className="bg-white p-6 shadow rounded-3xl">
          <h3>Seller Orders</h3>
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="bg-white p-6 shadow rounded-3xl">
          <h3>Product Revenue</h3>
          <p className="text-2xl font-bold">{formatPrice(stats.productRevenue)}</p>
        </div>
        <div className="bg-white p-6 shadow rounded-3xl">
          <h3>Tutorial Revenue</h3>
          <p className="text-2xl font-bold">{formatPrice(stats.tutorialRevenue)}</p>
        </div>
        <div className="bg-white p-6 shadow rounded-3xl">
          <h3>Total Revenue</h3>
          <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-3xl">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
        </div>
        <div className="p-6 flex flex-wrap gap-4">
          <Link to="/upload-product" className="bg-orange-500 text-white px-4 py-2 rounded-xl">
            + Add New Product
          </Link>
          <Link to="/upload-tutorial" className="bg-blue-600 text-white px-4 py-2 rounded-xl">
            + Create Tutorial
          </Link>
          <Link to="/seller-orders" className="bg-primary-brown text-white px-4 py-2 rounded-xl">
            View Seller Orders
          </Link>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="bg-white shadow rounded-3xl">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Products</h2>
          </div>
          <div className="p-6 space-y-4">
            {products.length === 0 ? (
              <p>No products yet.</p>
            ) : (
              products.slice(0, 3).map((product) => (
                <div key={product._id} className="flex justify-between items-center border p-4 rounded-2xl">
                  <div className="flex items-center space-x-4">
                    <img src={getPrimaryImage(product)} alt={product.name} className="w-16 h-16 object-cover rounded" />
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-orange-500">{formatPrice(product.price)}</p>
                      <div className="text-sm text-gray-600 space-x-3">
                        <span>Stock: {product.stock}</span>
                        <span>Sold: {product.soldCount || 0}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("products")}
                    className="text-primary-orange hover:underline text-sm font-medium"
                  >
                    Manage
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-3xl">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Tutorials</h2>
          </div>
          <div className="p-6 space-y-4">
            {tutorials.length === 0 ? (
              <p>No tutorials yet.</p>
            ) : (
              tutorials.slice(0, 3).map((tutorial) => (
                <div
                  key={tutorial._id}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:bg-sky-50/40 hover:shadow-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-blue-50 to-amber-50 text-2xl text-sky-700 transition-transform duration-300 group-hover:scale-110">
                      T
                    </div>
                    <div>
                      <h3 className="font-semibold">{tutorial.title}</h3>
                      <p className="text-blue-500">{formatPrice(tutorial.price)}</p>
                      <div className="text-sm text-gray-600 space-x-3">
                        <span>Lessons: {tutorial.lessons?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("tutorials")}
                    className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 shadow-sm transition-all duration-300 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-900 active:translate-y-px"
                  >
                    Manage
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="bg-white shadow rounded-3xl">
      <div className="p-6 border-b flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">My Products ({products.length})</h2>
        <Link to="/upload-product" className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium">
          Add Product
        </Link>
      </div>
      <div className="p-6 space-y-4">
        {products.length === 0 ? (
          <p>No products yet.</p>
        ) : (
          products.map((product) => (
            <div key={product._id} className="flex justify-between items-center border p-4 rounded-2xl">
              <div className="flex items-center space-x-4">
                <img src={getPrimaryImage(product)} alt={product.name} className="w-16 h-16 object-cover rounded" />
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-orange-500">{formatPrice(product.price)}</p>
                  <div className="text-sm text-gray-600 space-x-3">
                    <span>Stock: {product.stock}</span>
                    <span>Sold: {product.soldCount || 0}</span>
                    <span className={`px-2 py-1 text-xs rounded ${product.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-200"}`}>
                      {product.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => toggleProductStatus(product._id, product.status)}
                  className={`px-3 py-1 rounded text-white ${product.status === "active" ? "bg-yellow-500" : "bg-green-500"}`}
                >
                  {product.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <Link to={`/edit-product/${product._id}`} className="bg-blue-500 text-white px-3 py-1 rounded">
                  Edit
                </Link>
                <button onClick={() => deleteProduct(product._id)} className="bg-red-500 text-white px-3 py-1 rounded">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTutorials = () => (
    <div className="bg-white shadow rounded-3xl">
      <div className="p-6 border-b flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">My Tutorials ({tutorials.length})</h2>
        <Link to="/upload-tutorial" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          Add Tutorial
        </Link>
      </div>
      <div className="p-6 space-y-4">
        {tutorials.length === 0 ? (
          <p>No tutorials yet.</p>
        ) : (
          tutorials.map((tutorial) => (
            <div
              key={tutorial._id}
              className="group flex flex-col gap-4 rounded-3xl border border-slate-200 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:bg-sky-50/40 hover:shadow-lg lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-blue-50 to-amber-50 text-2xl text-sky-700 transition-transform duration-300 group-hover:scale-110">
                  T
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{tutorial.title}</h3>
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      {tutorial.category?.name || "Uncategorized"}
                    </span>
                  </div>
                  <p className="mt-1 text-blue-500">{formatPrice(tutorial.price)}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                    <span>{tutorial.lessons?.length || 0} lessons</span>
                    <span>Self-paced content</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/upload-tutorial?id=${tutorial._id}`}
                  className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-blue-600 hover:shadow-md active:translate-y-px"
                >
                  Edit
                </Link>
                <button
                  onClick={() => deleteTutorial(tutorial._id)}
                  className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-red-600 hover:shadow-md active:translate-y-px"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderWallet = () => (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-slate-900">Wallet</h2>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getWalletStatusClasses(wallet?.status)}`}>
                {wallet?.status || "ACTIVE"}
              </span>
            </div>

            {walletLoading ? (
              <p className="text-sm text-slate-500">Loading wallet...</p>
            ) : (
              <>
                <p className="text-4xl font-bold text-slate-900">{formatPrice(wallet?.balance || 0)}</p>
                <p className="text-sm text-slate-500">
                  The wallet now tracks only what you owe the platform or what you have prepaid for platform charges. Artisan earnings stay in the revenue card above.
                </p>
                <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Credit left for fees</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-800">{formatPrice(availableBalance)}</p>
                    <p className="mt-1 text-xs text-emerald-700">
                      {hasAvailableBalance ? "This is prepaid credit available to cover platform charges." : "No prepaid platform credit is available right now."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Amount owed to system</p>
                    <p className="mt-1 text-2xl font-bold text-red-800">{formatPrice(amountOwed)}</p>
                    <p className="mt-1 text-xs text-red-700">
                      {hasAmountOwed ? "This is the amount you still need to pay for platform service charges." : "You do not currently owe the platform anything."}
                    </p>
                  </div>
                </div>
              </>
            )}

            {wallet && wallet.balance < 0 && wallet.balance > -10 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Your account is in arrears.
              </div>
            )}

            {wallet && wallet.balance <= -10 && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Account suspended. Recharge to continue receiving orders.
              </div>
            )}

            {walletError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {walletError}
              </div>
            )}
          </div>

          <div className="w-full max-w-md rounded-3xl bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Recharge wallet</h3>
            <p className="mt-2 text-sm text-slate-500">Use Paynow to add credit for future platform fees.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="number"
                min="1"
                step="0.01"
                value={topupAmount}
                onChange={(event) => setTopupAmount(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                placeholder="Enter amount"
              />
              <button
                onClick={handleTopup}
                disabled={topupLoading}
                className="rounded-2xl bg-primary-orange px-5 py-3 font-semibold text-white transition hover:bg-primary-brown disabled:cursor-not-allowed disabled:opacity-60"
              >
                {topupLoading ? "Redirecting..." : "Top Up"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-slate-900">Wallet activity</h3>
          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
            {walletLoading ? (
              <div className="p-4 text-sm text-slate-500">Loading transactions...</div>
            ) : walletTransactions.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No wallet transactions yet.</div>
            ) : (
              walletTransactions.map((transaction) => (
                <div key={transaction._id} className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{transaction.type.replace(/_/g, " ")}</p>
                    <p className="text-sm text-slate-500">{transaction.description || "Wallet update"}</p>
                    <p className="text-xs text-slate-400">{new Date(transaction.createdAt).toLocaleString()}</p>
                  </div>
                  <p className={`text-lg font-semibold ${getTransactionAmountClass(transaction.amount)}`}>
                    {Number(transaction.amount) < 0 ? "-" : "+"}
                    {formatPrice(Math.abs(Number(transaction.amount) || 0))}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTutorialRequests = () => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Tutorial Requests</h2>
          <p className="mt-1 text-sm text-slate-500">Review customer requests to join your tutorials.</p>
        </div>
        <button
          onClick={refreshTutorialRequests}
          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {tutorialRequestsError && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {tutorialRequestsError}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
        {tutorialRequestsLoading ? (
          <div className="p-4 text-sm text-slate-500">Loading tutorial requests...</div>
        ) : tutorialRequests.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No tutorial requests yet.</div>
        ) : (
          tutorialRequests.map((request) => (
            <div key={request._id} className="border-b border-slate-200 px-4 py-4 last:border-b-0">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-slate-900">{request.customerId?.name || "Customer"}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getTutorialRequestStatusClasses(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">Tutorial: {request.tutorialId?.title || "Tutorial"}</p>
                  <p className="text-sm text-slate-500">Email: {request.customerId?.email || "No email provided"}</p>
                  {request.message && <p className="text-sm text-slate-500">Message: {request.message}</p>}
                  <p className="text-xs text-slate-400">{new Date(request.createdAt).toLocaleString()}</p>
                </div>

                {request.status === "PENDING" ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleTutorialRequestAction(request._id, "APPROVE")}
                      disabled={requestActionLoadingId === request._id}
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {requestActionLoadingId === request._id ? "Working..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleTutorialRequestAction(request._id, "REJECT")}
                      disabled={requestActionLoadingId === request._id}
                      className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                      {requestActionLoadingId === request._id ? "Working..." : "Reject"}
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">
                    {request.status === "APPROVED" ? "Customer has been approved for access." : "This request was rejected."}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderActiveTab = () => {
    if (activeTab === "products") return renderProducts();
    if (activeTab === "tutorials") return renderTutorials();
    if (activeTab === "wallet") return renderWallet();
    if (activeTab === "requests") return renderTutorialRequests();
    return renderOverview();
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Seller Dashboard</h1>
        <p className="mt-2 text-slate-600">Manage your catalog, revenue, wallet fees, and tutorial approvals from one place.</p>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 self-start rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Workspace</h2>
            <p className="mt-1 text-sm text-slate-500">Jump between seller tools without a long scroll.</p>
          </div>

          <div className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
                  activeTab === item.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="font-medium">{item.label}</span>
                {item.badge ? (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    activeTab === item.id ? "bg-white/15 text-white" : "bg-white text-slate-600"
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick Links</p>
            <div className="mt-3 space-y-2 text-sm">
              <Link to="/upload-product" className="block text-slate-700 hover:text-primary-orange">
                Add a new product
              </Link>
              <Link to="/upload-tutorial" className="block text-slate-700 hover:text-primary-orange">
                Create a tutorial
              </Link>
              <Link to="/seller-orders" className="block text-slate-700 hover:text-primary-orange">
                View seller orders
              </Link>
            </div>
          </div>
        </aside>

        <section>{renderActiveTab()}</section>
      </div>
    </div>
  );
};

export default SellerDashboard;
