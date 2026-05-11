const API_BASE_URL =
    process.env.REACT_APP_API_URL ||
    "https://zimcrafts-hub.onrender.com/api/v1";

const GET_CACHE_TTL_MS = 3000;

class ApiService {
    constructor() {
        this.pendingGetRequests = new Map();
        this.getResponseCache = new Map();
    }

    // ================= CORE REQUEST =================
    async request(endpoint, options = {}, isJson = true) {
        const url = `${API_BASE_URL}${endpoint}`;
        const storedToken = window.localStorage.getItem('zimcrafts-token');
        const method = (options.method || 'GET').toUpperCase();
        const cacheKey = `${method}:${url}`;

        const headers = {
            Accept: 'application/json',
            ...(options.headers || {}),
            ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
        };

        if (isJson && method !== 'GET') {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            ...options,
            method,
            headers,
            credentials: 'include',
        };

        if (method === 'GET') {
            delete config.body;

            const cachedResponse = this.getResponseCache.get(cacheKey);
            if (cachedResponse && Date.now() - cachedResponse.timestamp < GET_CACHE_TTL_MS) {
                return cachedResponse.data;
            }

            const pendingRequest = this.pendingGetRequests.get(cacheKey);
            if (pendingRequest) {
                return pendingRequest;
            }
        }

        const requestPromise = (async () => {
            const response = await fetch(url, config);

            let data;
            const contentType = response.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                const message =
                    (data && (data.message || data.error)) ||
                    "API request failed";

                if (response.status === 401) {
                    window.localStorage.removeItem('zimcrafts-token');
                    window.localStorage.removeItem('zimcrafts-user');
                    throw new Error(message || 'Not authorized');
                }

                if (response.status === 429) {
                    const retryAfter = response.headers.get('retry-after');
                    const retryMessage = retryAfter
                        ? `${message}. Please wait ${retryAfter} seconds and try again.`
                        : message;
                    throw new Error(retryMessage);
                }

                throw new Error(message);
            }

            if (method === 'GET') {
                this.getResponseCache.set(cacheKey, {
                    data,
                    timestamp: Date.now(),
                });
            }

            return data;
        })();

        if (method === 'GET') {
            this.pendingGetRequests.set(cacheKey, requestPromise);
            try {
                return await requestPromise;
            } finally {
                this.pendingGetRequests.delete(cacheKey);
            }
        }

        return requestPromise;
    }

    // ================= AUTH =================
    login(email, password) {
        return this.request("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
    }

    register(userData) {
        return this.request("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData),
        });
    }

    logout() {
        return this.request("/auth/logout", { method: "POST" }).catch(() => {});
    }

    getCurrentUser() {
        const storedToken = window.localStorage.getItem('zimcrafts-token');
        if (!storedToken) {
            return Promise.reject(new Error('Not authorized'));
        }
        return this.request("/auth/me");
    }

    forgotPassword(email) {
        return this.request("/auth/forgotpassword", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
    }

    resetPassword(token, password) {
        return this.request(`/auth/resetpassword/${token}`, {
            method: "PUT",
            body: JSON.stringify({ password }),
        });
    }

    verifyEmail(token) {
        return this.request(`/auth/verify-email/${token}`, {
            method: "GET",
        });
    }

    // ================= PRODUCTS =================
    getProducts(params = {}) {
            const query = new URLSearchParams(params).toString();
            return this.request(
                    `/products${query ? `?${query}` : ""}`
    );
  }

  getProductsByCategory(categoryId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(
      `/products/category/${categoryId}${query ? `?${query}` : ""}`
    );
  }

  getProductById(id) {
    return this.request(`/products/${id}`);
  }

  getCategories() {
    return this.request('/categories');
  }

  getOrderById(orderId) {
    return this.request(`/orders/${orderId}`);
  }
  getMyOrders() {
    return this.request('/orders/my-orders');
  }

  getSellerOrders() {
    return this.request('/orders/seller-orders');
  }

  getSellerAnalytics() {
    return this.request('/orders/seller-analytics');
  }

  updateSellerOrderStatus(orderId, statusData) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData)
    });
  }

  verifyOrderCode(orderId, codeData) {
    return this.request(`/orders/${orderId}/verify-code`, {
      method: 'POST',
      body: JSON.stringify(codeData)
    });
  }
  postProductReview(productId, reviewData) {
    return this.request(
      `/products/${productId}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify(reviewData)
      }
    );
  }

  createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  startPaynowCheckout(orderData) {
    return this.request('/payments/paynow/checkout', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  confirmPaynowCheckout(reference) {
    return this.request(`/payments/paynow/confirm/${encodeURIComponent(reference)}`);
  }

  getWalletBalance() {
    return this.request('/wallet/balance');
  }

  getWalletTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/wallet/transactions${query ? `?${query}` : ''}`);
  }

  startWalletTopup(amount) {
    return this.request('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  confirmWalletTopup(reference) {
    return this.request(`/wallet/topup/confirm/${encodeURIComponent(reference)}`);
  }

  getMyProducts() {
    return this.request("/products/my-products");
  }

  updateProduct(productId, productData) {
    const isFormData = productData instanceof FormData;

    return this.request(
      `/products/${productId}`,
      {
        method: "PUT",
        body: productData,
      },
      !isFormData
    );
  }

  createProduct(productData) {
    const isFormData = productData instanceof FormData;

    return this.request(
      "/products",
      {
        method: "POST",
        body: productData,
      },
      !isFormData
    );
  }

  deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: "DELETE",
    });
  }

  // ================= TUTORIALS =================
  getTutorials(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(
      `/tutorials${query ? `?${query}` : ""}`
    );
  }

  getTutorialById(id) {
    return this.request(`/tutorials/${id}`);
  }

  getTutorialRequestStatus(tutorialId) {
    return this.request(`/tutorials/${tutorialId}/request-status`);
  }

  requestTutorialEnrollment(tutorialId, payload = {}) {
    return this.request(`/tutorials/${tutorialId}/request-enrollment`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  getMyTutorials() {
    return this.request("/tutorials/my-tutorials");
  }

  createTutorial(tutorialData) {
    return this.request("/tutorials", {
      method: "POST",
      body: JSON.stringify(tutorialData),
    });
  }

  updateTutorial(tutorialId, tutorialData) {
    return this.request(`/tutorials/${tutorialId}`, {
      method: "PUT",
      body: JSON.stringify(tutorialData),
    });
  }

  deleteTutorial(tutorialId) {
    return this.request(`/tutorials/${tutorialId}`, {
      method: "DELETE",
    });
  }

  getEnrollment(tutorialId) {
    return this.request(`/enroll/${tutorialId}`);
  }

  enrollTutorial(tutorialId) {
    return this.request(`/enroll/${tutorialId}`, {
      method: "POST",
    });
  }

  startTutorialPaynowEnrollment(tutorialId) {
    return this.request(`/enroll/${tutorialId}/paynow`, {
      method: "POST",
    });
  }

  confirmTutorialPaynowEnrollment(reference) {
    return this.request(`/enroll/paynow/confirm/${encodeURIComponent(reference)}`);
  }

  getArtisanTutorialRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/tutorial-requests/artisan${query ? `?${query}` : ""}`);
  }

  respondToTutorialRequest(requestId, action) {
    return this.request(`/tutorial-requests/${requestId}/respond`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  }

  submitLessonExam(tutorialId, lessonId, answers) {
    return this.request(`/enroll/${tutorialId}/lessons/${lessonId}/exam`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  }

  // ================= IMAGEKIT AUTH (FIXED) =================
  async getImageKitAuth() {
    const apiRoot = API_BASE_URL.replace(/\/api\/v1\/?$/, "") ||
      "https://zimcrafts-hub.onrender.com";
    const url = `${apiRoot}/api/imagekit-auth`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        payload.message || payload.error || "ImageKit auth failed"
      );
    }

    return payload; // IMPORTANT: return whole payload
  }

  // ================= VIDEO UPLOAD =================
  async uploadTutorialVideo(file, onProgress) {
    const authResponse = await this.getImageKitAuth();
    const authData = authResponse.data;

    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "fileName",
      `tutorial_video_${Date.now()}_${file.name}`
    );
    formData.append("publicKey", authData.publicKey);
    formData.append("signature", authData.signature);
    formData.append("expire", authData.expire);
    formData.append("token", authData.token);
    formData.append("folder", "/tutorial-videos");

    const uploadUrl = "https://upload.imagekit.io/api/v1/files/upload";
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText} - ${text}`
      );
    }

    const responseData = await response.json();

    return responseData;
  }

  // ================= EXAMS =================
  getExam(tutorialId, lessonId = null) {
    const query = lessonId ? `?lessonId=${lessonId}` : '';
    return this.request(`/exam/${tutorialId}${query}`);
  }

  submitExam(tutorialId, answers, lessonId = null) {
    const body = lessonId ? { answers, lessonId } : { answers };
    return this.request(`/exam/${tutorialId}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  getExamResult(tutorialId, lessonId = null) {
    const query = lessonId ? `?lessonId=${lessonId}` : '';
    return this.request(`/exam/${tutorialId}/result${query}`);
  }
}

const apiService = new ApiService();
export default apiService;
