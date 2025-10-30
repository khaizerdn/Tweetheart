import React, { useEffect, useMemo, useState } from 'react';
import Header from '../../../components/Header';
import MobileMenu from '../../../components/MobileMenu';
import styles from './styles.module.css';

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // all, match, message

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const resp = await fetch('http://localhost:8081/api/notifications', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!resp.ok) throw new Error(`Failed (${resp.status})`);
      const data = await resp.json();
      const list = Array.isArray(data?.notifications) ? data.notifications : [];
      setItems(list);
    } catch (e) {
      setError('Failed to load notifications');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      // Optimistic UI: mark locally
      setItems(prev => prev.map(n => ({ ...n, is_read: 1 })));
      // Best-effort: call per item unread
      const unread = items.filter(n => !n.is_read);
      await Promise.all(unread.map(n => fetch(`http://localhost:8081/api/notifications/${n.id}/read`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }
      })));
    } catch {}
  };

  const dismissOne = async (id) => {
    try {
      setItems(prev => prev.filter(n => n.id !== id));
      await fetch(`http://localhost:8081/api/notifications/${id}/dismiss`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }
      });
    } catch {}
  };

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return items;
    if (activeFilter === 'match' || activeFilter === 'message') return items.filter(n => n.type === activeFilter);
    return items;
  }, [items, activeFilter]);

  const counts = useMemo(() => ({
    all: items.length,
    match: items.filter(n => n.type === 'match').length,
    message: items.filter(n => n.type === 'message').length,
  }), [items]);

  const iconClassFor = (type) => {
    switch (type) {
      case 'match': return 'fa-solid fa-heart';
      case 'message': return 'fa-solid fa-comment';
      case 'like': return 'fa-solid fa-thumbs-up';
      default: return 'fa-solid fa-bell';
    }
  };

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch { return ''; }
  };

  return (
    <div className={styles.notifications}>
      <Header 
        title="Notifications" 
        className={styles.notificationsHeader}
        right={
          <button className={styles.markAllReadButton} onClick={markAllRead}>
            <i className="fa-solid fa-check-double"></i>
            Mark all read
          </button>
        }
      />

      <div className={styles.container}>
        {/* Filters */}
        <div className={styles.filterTabs}>
          {['all','match','message'].map(key => (
            <button 
              key={key}
              className={`${styles.filterTab} ${activeFilter === key ? styles.active : ''}`}
              onClick={() => setActiveFilter(key)}
            >
              <i className={iconClassFor(key)}></i>
              <span style={{ textTransform: 'capitalize' }}>{key}</span>
              <span className="count">{counts[key] || 0}</span>
            </button>
          ))}
        </div>

        {/* Loading / Error / Empty */}
        {loading && (
          <div className={styles.loadingState}>
            <i className="fa-solid fa-spinner fa-spin"></i>
            <h3>Loading notifications…</h3>
            <p>Please wait a moment.</p>
          </div>
        )}

        {!loading && error && (
          <div className={styles.errorState}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <h3>Unable to load</h3>
            <p>{error}</p>
            <button className={styles.retryButton} onClick={fetchNotifications}>Retry</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <i className="fa-solid fa-bell-slash"></i>
            <h3>No notifications</h3>
            <p>You're all caught up.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className={styles.notificationsList}>
            {filtered.map(n => (
              <div key={n.id} className={`${styles.notificationItem} ${!n.is_read ? styles.unread : ''}`}>
                <div className={styles.notificationIcon}>
                  <i className={iconClassFor(n.type)}></i>
                </div>
                <div className={styles.notificationContent}>
                  <div className={styles.notificationHeader}>
                    <h4 className={styles.notificationTitle}>{n.title || 'Notification'}</h4>
                    <div className={styles.notificationTime}>{formatTime(n.created_at)}</div>
                  </div>
                  {n.message && <p className={styles.notificationMessage}>{n.message}</p>}
                  {n.user && <div className={styles.notificationUser}>{n.user}</div>}
                </div>
                {!n.is_read && <span className={styles.unreadIndicator} />}
                <button 
                  aria-label="Dismiss"
                  title="Dismiss"
                  onClick={() => dismissOne(n.id)}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--font-color-muted)', cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <MobileMenu />
    </div>
  );
};

export default Notifications;
