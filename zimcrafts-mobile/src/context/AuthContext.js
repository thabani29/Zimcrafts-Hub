import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import client from "../api/client";
import { secureStorageKeys } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    bootstrapAuth();
  }, []);

  const bootstrapAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync(secureStorageKeys.token);
      if (!token) {
        setUser(null);
        return;
      }

      const response = await client.getMe();
      setUser(response.user || null);
      await SecureStore.setItemAsync(
        secureStorageKeys.user,
        JSON.stringify(response.user || null)
      );
    } catch (error) {
      setUser(null);
      await SecureStore.deleteItemAsync(secureStorageKeys.token);
      await SecureStore.deleteItemAsync(secureStorageKeys.user);
    } finally {
      setIsBootstrapping(false);
    }
  };

  const login = async (email, password) => {
    const response = await client.login({ email, password });
    await SecureStore.setItemAsync(secureStorageKeys.token, response.accessToken);
    await SecureStore.setItemAsync(
      secureStorageKeys.user,
      JSON.stringify(response.user || null)
    );
    setUser(response.user || null);
    return response;
  };

  const register = async (payload) => {
    return client.register(payload);
  };

  const logout = async () => {
    try {
      await client.logout();
    } catch (error) {
      // Local credential cleanup still matters if the backend call fails.
    } finally {
      setUser(null);
      await SecureStore.deleteItemAsync(secureStorageKeys.token);
      await SecureStore.deleteItemAsync(secureStorageKeys.user);
    }
  };

  const refreshProfile = async () => {
    const response = await client.getMe();
    setUser(response.user || null);
    await SecureStore.setItemAsync(
      secureStorageKeys.user,
      JSON.stringify(response.user || null)
    );
    return response.user;
  };

  const value = useMemo(
    () => ({
      user,
      isBootstrapping,
      isAuthenticated: Boolean(user),
      isCustomer: user?.role === "customer",
      isArtisan: user?.role === "artisan/seller" || user?.role === "admin",
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
