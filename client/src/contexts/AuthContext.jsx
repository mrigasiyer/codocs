import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("codocs-token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          // Verify token with server
          const response = await fetch("http://localhost:3001/api/rooms", {
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

  const login = async (email, password) => {
    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
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
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  };

  const register = async (email, username, password, displayName) => {
    try {
      const response = await fetch("http://localhost:3001/api/auth/register", {
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
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      return { success: false, error: "Network error" };
    }
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
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
