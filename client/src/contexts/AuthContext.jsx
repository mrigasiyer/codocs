import React, { createContext, useState, useEffect } from "react";
import { API_URL } from "../config/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("codocs-token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          // Verify token with server
          const response = await fetch(`${API_URL}/api/rooms`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            // Token is valid, get user info from localStorage or make a separate call
            const userData = localStorage.getItem("codocs-user");
            if (userData) {
              setUser(JSON.parse(userData));
            }
          } else {
            // Token is invalid, clear it
            localStorage.removeItem("codocs-token");
            localStorage.removeItem("codocs-user");
            setToken(null);
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem("codocs-token");
          localStorage.removeItem("codocs-user");
          setToken(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  // Handle Google OAuth callback globally
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userParam = urlParams.get("user");
    const error = urlParams.get("error");

    console.log("OAuth callback detected:", {
      token: !!token,
      user: !!userParam,
      error,
      currentPath: window.location.pathname,
      fullURL: window.location.href,
    });

    if (error) {
      console.error("OAuth error:", error);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (token && userParam) {
      try {
        console.log("Processing OAuth success callback");
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log("User data:", user);
        handleGoogleAuth(token, user);
        // Clean up URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      } catch (parseError) {
        console.error("Error parsing user data:", parseError);
      }
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("codocs-token", data.token);
        localStorage.setItem("codocs-user", JSON.stringify(data.user));
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (networkError) {
      console.error("Login network error:", networkError);
      return { success: false, error: "Network error" };
    }
  };

  const register = async (email, username, password, displayName) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username, password, displayName }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("codocs-token", data.token);
        localStorage.setItem("codocs-user", JSON.stringify(data.user));
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (networkError) {
      console.error("Login network error:", networkError);
      return { success: false, error: "Network error" };
    }
  };

  const handleGoogleAuth = (token, userData) => {
    setToken(token);
    setUser(userData);
    localStorage.setItem("codocs-token", token);
    localStorage.setItem("codocs-user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("codocs-token");
    localStorage.removeItem("codocs-user");
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    handleGoogleAuth,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
