import { useNotifications } from "../auth/NotificationContext";
import { useAuth } from "../auth/AuthContext";
import "./NotificationBanner.css";

export default function NotificationBanner() {
  const { token } = useAuth();
  const { notifications, setNotifications } = useNotifications();  

  if (!notifications.length) return null;
  const notification = notifications[0];

  async function handleDismiss() {
    await fetch(
      `${import.meta.env.VITE_API}/api/notifications/${notification.notification_id}/read`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setNotifications((current) =>
      current.filter(
        (item) => item.notification_id !== notification.notification_id
      )
    );
  }


  return (
    // <div className="notification-banner">
    //   {notification.notification_text}
    //   <button onClick={handleDismiss}>X</button>
    // </div>    
    <div className="notification-banner">
      <span className="notification-icon">🔗</span>
      <span>{notification.display_name}</span>
      <span>{notification.notification_text}</span>
      <button onClick={handleDismiss}>×</button>
    </div>
  );
}