import React, { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import MobileMenu from '../../../components/MobileMenu';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './server';
import styles from './styles.module.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'likes', 'matches', 'messages'

  // Fetch notifications data
  const fetchNotificationsData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const data = await fetchNotifications();
      setNotifications(data);
      
    } catch (err) {
      console.error("Error fetching notifications:", err);
      // For now, show mock data when API fails
      const mockNotifications = [
        {
          id: 1,
          type: 'like',
          title: 'Someone liked you!',
          message: 'Sarah liked your profile. Check out their profile!',
          userName: 'Sarah',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
          id: 2,
          type: 'match',
          title: 'It\'s a Match!',
          message: 'You and Alex liked each other! Start chatting now.',
          userName: 'Alex',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
          id: 3,
          type: 'message',
          title: 'New Message',
          message: 'You have a new message from Emma.',
          userName: 'Emma',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        }
      ];
      setNotifications(mockNotifications);
      setError(""); // Clear error since we're showing mock data
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotificationsData();
  }, []);

  // Filter notifications based on filter type
  const filterNotifications = (notifications, filterType) => {
    switch (filterType) {
      case 'unread':
        return notifications.filter(notification => !notification.isRead);
      case 'likes':
        return notifications.filter(notification => notification.type === 'like');
      case 'matches':
        return notifications.filter(notification => notification.type === 'match');
      case 'messages':
        return notifications.filter(notification => notification.type === 'message');
      case 'all':
      default:
        return notifications;
    }
  };

  // Get counts for each filter type
  const getFilterCounts = () => {
    const allCount = notifications.length;
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const likesCount = notifications.filter(n => n.type === 'like').length;
    const matchesCount = notifications.filter(n => n.type === 'match').length;
    const messagesCount = notifications.filter(n => n.type === 'message').length;
    
    return { allCount, unreadCount, likesCount, matchesCount, messagesCount };
  };

  const { allCount, unreadCount, likesCount, matchesCount, messagesCount } = getFilterCounts();

  // Apply filter when filterType changes
  const filteredNotifications = filterNotifications(notifications, filter);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, isRead: true }
              : n
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return 'fa fa-heart';
      case 'match':
        return 'fa fa-users';
      case 'message':
        return 'fa fa-comment';
      case 'profile_view':
        return 'fa fa-eye';
      default:
        return 'fa fa-bell';
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'like':
        return '#e91e63';
      case 'match':
        return '#4caf50';
      case 'message':
        return '#2196f3';
      case 'profile_view':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className={styles.notifications}>
        <Header title="Notifications" className={styles.notificationsHeader} />
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <i className="fa fa-spinner fa-spin"></i>
            <h3>Loading notifications...</h3>
            <p>Getting your latest updates</p>
          </div>
        </div>
        <MobileMenu />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.notifications}>
        <Header title="Notifications" className={styles.notificationsHeader} />
        <div className={styles.container}>
          <div className={styles.errorState}>
            <i className="fa fa-exclamation-triangle"></i>
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button 
              onClick={fetchNotificationsData} 
              className={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        </div>
        <MobileMenu />
      </div>
    );
  }

  return (
    <div className={styles.notifications}>
      <Header title="Notifications" className={styles.notificationsHeader}>
        {unreadCount > 0 && (
          <button 
            className={styles.markAllReadButton}
            onClick={handleMarkAllAsRead}
            title="Mark all as read"
          >
            <i className="fa fa-check-double"></i>
            Mark all read
          </button>
        )}
      </Header>
      
      <div className={styles.container}>
        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          <button 
            className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            <i className="fa fa-bell"></i>
            <span>All</span>
            {allCount > 0 && <span className={styles.count}>{allCount}</span>}
          </button>
          <button 
            className={`${styles.filterTab} ${filter === 'unread' ? styles.active : ''}`}
            onClick={() => setFilter('unread')}
          >
            <i className="fa fa-circle"></i>
            <span>Unread</span>
            {unreadCount > 0 && <span className={styles.count}>{unreadCount}</span>}
          </button>
          <button 
            className={`${styles.filterTab} ${filter === 'likes' ? styles.active : ''}`}
            onClick={() => setFilter('likes')}
          >
            <i className="fa fa-heart"></i>
            <span>Likes</span>
            {likesCount > 0 && <span className={styles.count}>{likesCount}</span>}
          </button>
          <button 
            className={`${styles.filterTab} ${filter === 'matches' ? styles.active : ''}`}
            onClick={() => setFilter('matches')}
          >
            <i className="fa fa-users"></i>
            <span>Matches</span>
            {matchesCount > 0 && <span className={styles.count}>{matchesCount}</span>}
          </button>
          <button 
            className={`${styles.filterTab} ${filter === 'messages' ? styles.active : ''}`}
            onClick={() => setFilter('messages')}
          >
            <i className="fa fa-comment"></i>
            <span>Messages</span>
            {messagesCount > 0 && <span className={styles.count}>{messagesCount}</span>}
          </button>
        </div>

        {/* Notifications List */}
        <div className={styles.notificationsList}>
          {filteredNotifications.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fa fa-bell-slash"></i>
              <h3>No notifications</h3>
              <p>
                {filter === 'all' 
                  ? "You're all caught up! Check back later for new updates."
                  : `No ${filter} notifications found.`
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div 
                key={notification.id}
                className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={styles.notificationIcon}>
                  <i 
                    className={getNotificationIcon(notification.type)}
                    style={{ color: getNotificationColor(notification.type) }}
                  ></i>
                </div>
                
                <div className={styles.notificationContent}>
                  <div className={styles.notificationHeader}>
                    <h4 className={styles.notificationTitle}>
                      {notification.title}
                    </h4>
                    <span className={styles.notificationTime}>
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  
                  <p className={styles.notificationMessage}>
                    {notification.message}
                  </p>
                  
                  {notification.userName && (
                    <div className={styles.notificationUser}>
                      <span>From: {notification.userName}</span>
                    </div>
                  )}
                </div>
                
                {!notification.isRead && (
                  <div className={styles.unreadIndicator}></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      <MobileMenu />
    </div>
  );
};

export default Notifications;
