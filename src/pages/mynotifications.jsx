import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./mynotifications.css";

import {
  Bell,
  UserPlus,
  Users,
  Gamepad2,
  Clock3,
  UserMinus,
  Wifi,
  MonitorUp,
  MessageSquare,
  Heart,
  Trophy,
  Medal,
  Send,
  AtSign,
  Wrench,
  Plug,
} from "lucide-react";
const iconMap = {
  Bell: Bell,
  UserPlus: UserPlus,
  Users: Users,
  Gamepad2: Gamepad2,
  Clock3: Clock3,
  UserMinus: UserMinus,
  Wifi: Wifi,
  MonitorUp: MonitorUp,
  MessageSquare: MessageSquare,
  Heart: Heart,
  Trophy: Trophy,
  Medal: Medal,
  Send: Send,
  AtSign: AtSign,
  Wrench: Wrench,
  Plug: Plug,
};


const API = import.meta.env.VITE_API;

export default function Home() {
  const { token } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedNotificationTypeId, setSelectedNotificationTypeId] =
    useState("");
  const [notificationText, setNotificationText] = useState("");

  const [allUsers, setAllUsers] = useState([]);
  const [notificationTypes, setNotificationTypes] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [createNotificationError, setCreateNotificationError] = useState("");

  // get users for dropdown
  const syncSetAllUsers = async () => {
    try {
      const response = await fetch(`${API}/api/users/dropdown`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setAllUsers(data);
    } catch (err) {
      console.error("Failed to fetch users for dropdown", err);
    }
  };

  // get notification types for dropdown
  const getNotificationTypes = async () => {
    try {
      const response = await fetch(`${API}/api/notifications/types`);
      const data = await response.json();

      setNotificationTypes(data);
    } catch (err) {
      console.error("Failed to fetch notification types", err);
    }
  };

  // create notification
  const handleCreateNotification = async () => {
    if (
      !selectedUserId ||
      !selectedNotificationTypeId ||
      !notificationText
    ) {
      setCreateNotificationError("All fields are required.");
      return;
    }

    try {
      setCreateNotificationError("");

      const response = await fetch(`${API}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          user_id: selectedUserId,
          notification_type_id: selectedNotificationTypeId,
          notification_text: notificationText,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setCreateNotificationError(errorText);
        return;
      }

      setSelectedUserId("");
      setSelectedNotificationTypeId("");
      setNotificationText("");
      setUserSearch("");

      await getNotifications();
    } catch (err) {
      console.error("Failed to create notification:", err);
      setCreateNotificationError("Failed to create notification.");
    }
  };

  // get notifications
  const getNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API}/api/notifications/mynotifications`,
        { headers }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load my notifications."
        );
      }

      setNotifications(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getNotifications();
    syncSetAllUsers();
    getNotificationTypes();
  }, [token]);

  return (
    <main>
      <h1>My Notifications!</h1>

      {/* <p>
        {token
          ? "Logged in: showing all N."
          : "Logged out: showing public N."}
      </p> */}

      {loading && <p>Loading notifications...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && (
        <ul className="notifications-list">
          {notifications.map((notification) => (
            <li
              className={`notification-card ${
                notification.is_read ? "read" : "unread"
              }`}
              key={notification.notification_id}
            >
              {/* <div className="notification-icon">🔔</div> */}
              <div className="notification-icon">
                {(() => {
                  const IconComponent =
                    iconMap[notification.icon] || Bell;

                  return <IconComponent size={22} />;
                })()}
              </div>
              <div className="notification-content">
                <p className="notification-type">
                  {notification.display_name}
                </p>

                <h3 className="notification-text">
                  {notification.notification_text}
                </h3>
              </div>

              <div className="notification-right">
                <p className="notification-time">
                  {new Date(
                    notification.created_at
                  ).toLocaleString()}
                </p>

                {!notification.is_read && (
                  <div className="notification-dot"></div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* EMJ Test Admin Add Notification Section */}
      <section className="admin-notification-panel">
        <h2>Test Create Notification</h2>

        <div className="admin-notification-form">
          <div className="user-search-wrap">
            <input
              type="text"
              value={userSearch}
              onChange={(event) => {
                setUserSearch(event.target.value);
                setShowUserDropdown(true);
              }}
              placeholder="Search users..."
            />

            {showUserDropdown && (
              <div className="user-dropdown">
                {allUsers
                  .filter(
                    (user) =>
                      userSearch.trim() !== "" &&
                      user.username
                        .toLowerCase()
                        .includes(userSearch.toLowerCase())
                  )
                  .map((user) => (
                    <div
                      key={user.user_id}
                      onClick={() => {
                        setSelectedUserId(user.user_id);
                        setUserSearch(user.username);
                        setShowUserDropdown(false);
                      }}
                    >
                      {user.username}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <select
            value={selectedNotificationTypeId}
            onChange={(e) =>
              setSelectedNotificationTypeId(e.target.value)
            }
          >
            <option value="">Select notification type</option>

            {notificationTypes.map((type) => (
              <option
                key={type.notification_type_id}
                value={type.notification_type_id}
              >
                {type.display_name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={notificationText}
            onChange={(e) => setNotificationText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateNotification();
              }
            }}
            placeholder="Notification text"
          />

          <button onClick={handleCreateNotification}>
            Create Notification
          </button>
        </div>

        {createNotificationError && (
          <p className="admin-notification-error">
            {createNotificationError}
          </p>
        )}
      </section>
    </main>
  );
}