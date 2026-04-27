import axios from "axios";
import * as SecureStore from "expo-secure-store";

const fallbackBaseUrl = "http://192.168.0.100:5000/api/v1";
const TOKEN_KEY = "zimcrafts_access_token";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || fallbackBaseUrl,
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const nextConfig = { ...config };

  nextConfig.headers = {
    Accept: "application/json",
    ...(config.headers || {}),
  };

  if (token) {
    nextConfig.headers.Authorization = `Bearer ${token}`;
  }

  return nextConfig;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Something went wrong";

    if (error?.response?.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }

    return Promise.reject(new Error(message));
  }
);

export const secureStorageKeys = {
  token: TOKEN_KEY,
  user: "zimcrafts_user",
};

export default api;
