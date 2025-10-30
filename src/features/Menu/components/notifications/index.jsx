import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import styles from './styles.module.css';

const NotificationItem = ({ notification, onDismiss }) => {
  const handleDismiss = () => {
    onDismiss(notification.id);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'match':
        return 'fa-solid fa-heart';
      case 'message':
        return 'fa-solid fa-comment';
      case 'like':
        return 'fa-solid fa-thumbs-up';
      case 'system':
        return 'fa-solid fa-bell';
      default:
        return 'fa-solid fa-bell';
    }
  };

  return (
    <div className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''}`}>
      <div className={styles.notificationContent}>
        <div className={styles.notificationIcon}>
          <i className={getNotificationIcon(notification.type)}></i>
        </div>
        <div className={styles.notificationText}>
          <div className={styles.notificationTitle}>{notification.title}</div>
          <div className={styles.notificationMessage}>{notification.message}</div>
          <div className={styles.notificationTime}>
            {new Date(notification.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
      <button 
        className={styles.dismissButton}
        onClick={handleDismiss}
        title="Dismiss notification"
      >
        <i className="fa-solid fa-times"></i>
      </button>
    </div>
  );
};

const NotificationsContainer = () => {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Get current user ID from cookies
  const getCurrentUserId = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('userId='))
      ?.split('=')[1];
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/notifications', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure newest notifications appear at the bottom
        const list = (data.notifications || []).slice().reverse();
        setNotifications(list);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Dismiss notification
  const dismissNotification = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:8081/api/notifications/${notificationId}/dismiss`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:8081/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) return;

    const newSocket = io('http://localhost:8081', {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification server');
      setIsConnected(true);
      
      // Join user's personal room for notifications
      newSocket.emit('join_user_room', { userId });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from notification server');
      setIsConnected(false);
    });

    newSocket.on('new_notification', (notification) => {
      console.log('New notification received:', notification);
      // Append to keep newest at the bottom
      setNotifications(prev => [...prev, notification]);
      
      // Show browser notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className={styles.notificationsContainer}>
      <div className={styles.notificationsHeader}>
        <h3 className={styles.notificationsTitle}>
          <i className="fa-solid fa-bell"></i>
          Notifications
          {!isConnected && <span className={styles.connectionStatus}> (Offline)</span>}
        </h3>
        {notifications.length > 0 && (
          <button 
            className={styles.clearAllButton}
            onClick={() => notifications.forEach(n => dismissNotification(n.id))}
            title="Clear all notifications"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className={styles.notificationsList}>
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fa-solid fa-bell-slash"></i>
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDismiss={dismissNotification}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsContainer;
