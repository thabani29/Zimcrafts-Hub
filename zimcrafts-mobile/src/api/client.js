import api from "./api";

const unwrap = (response) => response.data;

const client = {
  login: (payload) => api.post("/auth/login", payload).then(unwrap),
  register: (payload) => api.post("/auth/register", payload).then(unwrap),
  getMe: () => api.get("/auth/me").then(unwrap),
  logout: () => api.post("/auth/logout").then(unwrap),

  getCategories: () => api.get("/categories").then(unwrap),
  getProducts: (params) => api.get("/products", { params }).then(unwrap),
  getProductById: (id) => api.get(`/products/${id}`).then(unwrap),

  createOrder: (payload) => api.post("/orders", payload).then(unwrap),
  getMyOrders: () => api.get("/orders/my-orders").then(unwrap),
  getSellerAnalytics: () => api.get("/orders/seller-analytics").then(unwrap),
  getSellerOrders: () => api.get("/orders/seller-orders").then(unwrap),
  updateSellerOrderStatus: (orderId, payload) =>
    api.put(`/orders/${orderId}/status`, payload).then(unwrap),

  getTutorials: (params) => api.get("/tutorials", { params }).then(unwrap),
  getTutorialById: (id) => api.get(`/tutorials/${id}`).then(unwrap),
  getTutorialRequestStatus: (tutorialId) =>
    api.get(`/tutorials/${tutorialId}/request-status`).then(unwrap),
  requestTutorialEnrollment: (tutorialId, payload) =>
    api.post(`/tutorials/${tutorialId}/request-enrollment`, payload).then(unwrap),
  getArtisanTutorialRequests: (params) =>
    api.get("/tutorial-requests/artisan", { params }).then(unwrap),
  respondToTutorialRequest: (requestId, action) =>
    api.post(`/tutorial-requests/${requestId}/respond`, { action }).then(unwrap),

  getWalletBalance: () => api.get("/wallet/balance").then(unwrap),
  getWalletTransactions: () => api.get("/wallet/transactions").then(unwrap),
  startWalletTopup: (amount) => api.post("/wallet/topup", { amount }).then(unwrap),

  getMyProducts: () => api.get("/products/my-products").then(unwrap),
  getMyTutorials: () => api.get("/tutorials/my-tutorials").then(unwrap),
};

export default client;
