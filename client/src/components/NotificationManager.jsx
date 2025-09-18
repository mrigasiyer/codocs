import { useState, useCallback } from "react";
import Notification from "./Notification";

export default function NotificationManager() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback(
    (message, type = "info", duration = 3000) => {
      const id = Date.now() + Math.random();
      const notification = { id, message, type, duration };

      setNotifications((prev) => [...prev, notification]);
    },
    []
  );

  const removeNotification = useCallback((id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  // Expose addNotification function globally so other components can use it
  window.addNotification = addNotification;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-h-96 overflow-hidden">
      {notifications.slice(0, 3).map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
