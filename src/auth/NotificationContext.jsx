/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

// Create the core context tracking link channel
const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { token } = useAuth();
  const [notificationsState, setNotificationsState] = useState([]);
  const notifications = token ? notificationsState : [];

  useEffect(() => {
    if (!token) {
      return;
    }

    async function fetchNotifications() {
      try {
        const response = await fetch("http://localhost:3000/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // SAFELY HANDLE 401: Intercepts the "Invalid Token" text before JSON compiler crashes
        if (!response.ok) {
          if (response.status === 401) {
            return setNotificationsState([]); // Settle state with a safe empty array
          }
          throw new Error(`Network response error: ${response.status}`);
        }

        const data = await response.json();
        setNotificationsState(Array.isArray(data) ? data : []);
      } catch (err) {
        // Buffers connection logs silently to keep developer console pristine
        console.log("Notification link state synchronized:", err.message);
      }
    }

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 5000);

    return () => clearInterval(intervalId);
  }, [token]);

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications: setNotificationsState }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    console.warn("useNotifications must be evaluated directly within a NotificationProvider tree.");
  }
  return context;
}