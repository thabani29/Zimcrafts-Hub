// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import apiService from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = window.localStorage.getItem('zimcrafts-user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedToken = window.localStorage.getItem('zimcrafts-token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await apiService.getCurrentUser();
      const currentUser = response?.user || null;
      setUser(currentUser);
      if (currentUser) {
        window.localStorage.setItem('zimcrafts-user', JSON.stringify(currentUser));
      }
    } catch (err) {
      // Ignore 401 errors (not logged in)
      if (err.message !== "Not authorized") {
        console.error("Failed to load user:", err.message);
        setError(err.message);
      }
      setUser(null);
      window.localStorage.removeItem('zimcrafts-user');
      window.localStorage.removeItem('zimcrafts-token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      const currentUser = response.user || null;
      setUser(currentUser);
      if (currentUser) {
        window.localStorage.setItem('zimcrafts-user', JSON.stringify(currentUser));
      }
      if (response.accessToken) {
        window.localStorage.setItem('zimcrafts-token', response.accessToken);
      }
      return response;
    } catch (err) {
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      const currentUser = response.user || null;
      setUser(currentUser);
      if (currentUser) {
        window.localStorage.setItem('zimcrafts-user', JSON.stringify(currentUser));
      }
      if (response.accessToken) {
        window.localStorage.setItem('zimcrafts-token', response.accessToken);
      }
      return response;
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error("Logout error:", err.message);
    } finally {
      setUser(null);
      window.localStorage.removeItem('zimcrafts-user');
      window.localStorage.removeItem('zimcrafts-token');
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};