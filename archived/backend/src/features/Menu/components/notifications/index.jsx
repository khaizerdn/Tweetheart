import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import styles from './styles.module.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
        <span className={styles.notificationIcon} aria-hidden>
          <i className={getNotificationIcon(notification.type)}></i>
        </span>
        <span className={styles.notificationText}>
          {notification.message || notification.title}
        </span>
      </div>
      <button 
        className={styles.dismissButton}
        onClick={handleDismiss}
        title="Dismiss notification"
        aria-label="Dismiss notification"
      >
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
};

const NotificationsContainer = () => {
  const [lastNotification, setLastNotification] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false); // only visible when a new one arrives
  const [matchedUser, setMatchedUser] = useState(null);

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
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Keep the most recent for state, but do NOT auto-show
        const list = (data.notifications || []).slice().reverse();
        const latest = list.length > 0 ? list[list.length - 1] : null;
        setLastNotification(latest);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Dismiss notification
  const dismissNotification = async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/dismiss`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setLastNotification(null);
        setShowNotifications(false);
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
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

  // Initialize Socket.IO connection or static mode event listener
  useEffect(() => {
    const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true' || import.meta.env.MODE === 'static';
    
    if (isStaticMode) {
      // In static mode, listen for custom events instead of Socket.IO
      const handleStaticNotification = (event) => {
        const notification = event.detail;
        console.log('New notification received (static mode):', notification);
        setLastNotification(notification);
        setShowNotifications(true);
        
        // Show browser notification if permission is granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
          });
        }
      };
      
      // Listen for custom notification events
      window.addEventListener('mock_notification', handleStaticNotification);
      
      return () => {
        window.removeEventListener('mock_notification', handleStaticNotification);
      };
    } else {
      // Dynamic mode: use Socket.IO
      const userId = getCurrentUserId();
      if (!userId) return;

      // Socket.io connects to /socket.io on current origin (proxied by Nginx)
      const newSocket = io({
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
        // Replace with the latest notification and show the tray
        setLastNotification(notification);
        setShowNotifications(true);
        
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
    }
  }, []);

  // Fetch notifications on component mount (do not auto-show)
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // When lastNotification changes, try to load matched user info (for both match and like types)
  useEffect(() => {
    async function loadMatchedUser() {
      setMatchedUser(null);
      if (!lastNotification || (lastNotification.type !== 'match' && lastNotification.type !== 'like')) return;
      try {
        const raw = lastNotification.data;
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const matchUserId = data?.matchUserId;
        if (!matchUserId) return;
        // Prefer dedicated basic profile endpoint for correct gender + signed photos
        const resp = await fetch(`${API_URL}/users/${matchUserId}/basic`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (resp.ok) {
          const found = await resp.json();
          // Normalize shape for this component
          const normalized = {
            id: found.id,
            first_name: found.first_name,
            last_name: found.last_name,
            gender: found.gender, // already mapped to male/female/prefer_not_to_say
            birthdate: found.birthdate,
            photos: found.photos
          };
          setMatchedUser(normalized);
        }
      } catch (e) {
        // Soft-fail: keep minimal text-only toast
      }
    }
    loadMatchedUser();
  }, [lastNotification]);

  if (!showNotifications || !lastNotification) return null;

  // Render compact layout with header and details when available
  const resolveGenderLabel = (gender) => {
    if (gender === null || gender === undefined) return 'Not specified';
    const g = String(gender).trim().toLowerCase();
    // Common variants from DB/front-end
    if (g === 'male' || g === 'm' || g === 'man') return 'Male';
    if (g === 'female' || g === 'f' || g === 'woman' || g === 'women') return 'Female';
    if (g === 'other' || g === 'prefer_not_to_say' || g === 'prefer not to say' || g === 'n/a' || g === 'na') return 'Prefer not to say';
    // Capitalized DB enums 'Male','Female','Other' will be handled by lowercasing above
    return 'Not specified';
  };

  const resolveAvatarUrl = () => {
    const photos = matchedUser?.photos;
    if (!photos) return null;
    try {
      const arr = Array.isArray(photos) ? photos : JSON.parse(photos);
      if (!Array.isArray(arr) || arr.length === 0) return null;
      // handle array of urls
      if (typeof arr[0] === 'string') {
        return arr[0];
      }
      // handle array of objects
      const order1 = arr.find(p => Number(p.order) === 1 && (p.url || p.signedUrl));
      return (order1?.url || order1?.signedUrl) || arr.find(p => p.url || p.signedUrl)?.url || arr.find(p => p.url || p.signedUrl)?.signedUrl || null;
    } catch {
      return null;
    }
  };

  const avatarUrl = resolveAvatarUrl();

  return (
    <div className={styles.notificationsContainer}>
      <div className={styles.headerRow}>
        <span className={styles.headerLeft}>
          <span className={styles.headerIcon} aria-hidden>
            <i className="fa-solid fa-heart"></i>
          </span>
          <span className={styles.headerTitle}>New match!</span>
        </span>
        <button 
          className={styles.headerClose}
          onClick={() => dismissNotification(lastNotification.id)}
          aria-label="Dismiss notification"
          title="Dismiss notification"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div className={styles.bodyRow}>
        <div 
          className={styles.avatar}
          aria-hidden
          style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
        ></div>
        <div className={styles.bodyText}>
          <div className={styles.nameLine}>
            {matchedUser?.first_name && matchedUser?.birthdate
              ? `${matchedUser.first_name}, ${Math.max(0, Math.floor((Date.now() - new Date(matchedUser.birthdate).getTime()) / (365.25*24*60*60*1000)))}`
              : (lastNotification?.data?.matchUserName || (typeof lastNotification?.data === 'string' ? JSON.parse(lastNotification.data)?.matchUserName : undefined) || 'New match')}
          </div>
          <div className={styles.metaLine}>
            <i className="fa fa-venus-mars"></i>
            <span className={styles.metaText}>{resolveGenderLabel(matchedUser?.gender)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsContainer;
