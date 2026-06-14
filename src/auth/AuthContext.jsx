/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const API = import.meta.env.VITE_API;

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
  const savedToken = localStorage.getItem("token");
    if (!savedToken) return null;
    try {
      return JSON.parse(atob(savedToken.split(".")[1]));
    } catch {
      return null;
    }    
  });

  
  const register = async (credentials) => {
    const response = await fetch(API + "/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const result = await response.json();
    if (!response.ok) {
      throw Error(result.message);
    }
    setToken(result.token);
  };


  const login = async (credentials) => {
    const response = await fetch(API + "/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const text = await response.text();

    if (!response.ok) {
      throw Error(text || "Login failed");
    }

    const result = JSON.parse(text);
    setToken(result.token);
    localStorage.setItem("token", result.token);
    setUser(result.user);
  };


  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  useEffect(() => {
    if (!token) return;

    const sendHeartbeat = async () => {
      await fetch(API + "/api/users/heartbeat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    };

    sendHeartbeat();

    const interval = setInterval(() => {
      sendHeartbeat();
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);



  // const value = { token, register, login, logout };
  const value = { token, user, register, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}





export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw Error("useAuth must be used within AuthProvider");
  return context;
}