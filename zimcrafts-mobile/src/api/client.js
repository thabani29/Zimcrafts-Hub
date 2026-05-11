import api from "./api";

const unwrap = (response) => response.data;

const client = {
  login: (payload) => api.post("/auth/login", payload).then(unwrap),
  register: (payload) => api.post("/auth/register", payload).then(unwrap),
  getMe: () => api.get("/auth/me").then(unwrap),
  logout: () => api.post("/auth/logout").then(unwrap),
  forgotPassword: (payload) => api.post("/auth/forgotpassword", payload).then(unwrap),
  resendVerification: (payload) => api.post("/auth/resend-verification", payload).then(unwrap),

  getCategories: () => api.get("/categories").then(unwrap),
  getProducts: (params) => api.get("/products", { params }).then(unwrap),
  getProductById: (id) => api.get(`/products/${id}`).then(unwrap),
  addProductReview: (id, payload) => api.post(`/products/${id}/reviews`, payload).then(unwrap),

  createOrder: (payload) => api.post("/orders", payload).then(unwrap),
  getMyOrders: () => api.get("/orders/my-orders").then(unwrap),
  getSellerAnalytics: () => api.get("/orders/seller-analytics").then(unwrap),
  getSellerOrders: () => api.get("/orders/seller-orders").then(unwrap),
  updateSellerOrderStatus: (orderId, payload) =>
    api.put(`/orders/${orderId}/status`, payload).then(unwrap),
  getOrderById: (id) => api.get(`/orders/${id}`).then(unwrap),
  verifyOrderCode: (id, code) => api.post(`/orders/${id}/verify-code`, { code }).then(unwrap),

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
  startWalletTopup: (amount, returnUrl) => api.post("/wallet/topup", { amount, returnUrl }).then(unwrap),

  getMyProducts: () => api.get("/products/my-products").then(unwrap),
  updateProduct: (id, payload) => api.put(`/products/${id}`, payload).then(unwrap),
  deleteProduct: (id) => api.delete(`/products/${id}`).then(unwrap),

  getMyTutorials: () => api.get("/tutorials/my-tutorials").then(unwrap),
  updateTutorial: (id, payload) => api.put(`/tutorials/${id}`, payload).then(unwrap),
  deleteTutorial: (id) => api.delete(`/tutorials/${id}`).then(unwrap),

  confirmWalletTopup: (reference) => api.post("/wallet/confirm", { reference }).then(unwrap),

  createProduct: (payload) => {
    const config = payload instanceof FormData 
      ? { headers: { "Content-Type": "multipart/form-data" } } 
      : {};
    return api.post("/products", payload, config).then(unwrap);
  },
  createTutorial: (payload) => api.post("/tutorials", payload).then(unwrap),

  getImageKitAuth: async () => {
    const baseURL = api.defaults.baseURL || "https://zimcrafts-hub.onrender.com/api/v1";
    const apiRoot = baseURL.replace(/\/api\/v1\/?$/, "");
    return api.get(`${apiRoot}/api/imagekit-auth`).then(unwrap);
  },

  uploadTutorialVideo: async (fileData) => {
    const authResponse = await client.getImageKitAuth();
    const authData = authResponse.data;

    const formData = new FormData();
    formData.append("file", fileData); 
    formData.append("fileName", `tutorial_video_${Date.now()}_${fileData.name}`);
    formData.append("publicKey", authData.publicKey);
    formData.append("signature", authData.signature);
    formData.append("expire", authData.expire);
    formData.append("token", authData.token);
    formData.append("folder", "/tutorial-videos");

    const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    return response.json();
  },
};

export default client;
