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
    // Clear the menu dot on entering the page
    try {
      if (window && window.history && window.location) {
        // Communicate via a simple storage flag; Menu reads unread from API anyway
        sessionStorage.setItem('seenNotificationsPage', '1');
      }
    } catch {}
  }, []);

  const markAllRead = async () => {
    // No-op for per-item read; keep button to clear dot semantics if needed
    try { localStorage.setItem('hasNewNotifications', '0'); } catch {}
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

  const MatchRow = ({ n }) => {
    const [profile, setProfile] = useState(null);
    const data = useMemo(() => {
      try { return typeof n.data === 'string' ? JSON.parse(n.data) : n.data; } catch { return {}; }
    }, [n.data]);

    useEffect(() => {
      const load = async () => {
        if (!data?.matchUserId) return;
        try {
          const resp = await fetch(`http://localhost:8081/api/users/${data.matchUserId}/basic`, {
            method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' }
          });
          if (resp.ok) setProfile(await resp.json());
        } catch {}
      };
      load();
    }, [data?.matchUserId]);

    const age = useMemo(() => {
      if (!profile?.birthdate) return null;
      const b = new Date(profile.birthdate); const t = new Date();
      let a = t.getFullYear() - b.getFullYear();
      const m = t.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
      return Math.max(0, a);
    }, [profile?.birthdate]);

    const avatarUrl = useMemo(() => {
      const p = profile?.photos;
      if (!p) return null;
      const arr = Array.isArray(p) ? p : []; // endpoint already returns objects with url
      const order1 = arr.find(ph => Number(ph.order) === 1 && ph.url);
      return (order1?.url) || (arr[0]?.url) || null;
    }, [profile?.photos]);

    const genderLabel = useMemo(() => {
      const g = (profile?.gender || '').toLowerCase();
      if (g === 'male') return 'Male';
      if (g === 'female') return 'Female';
      return 'Prefer not to say';
    }, [profile?.gender]);

    return (
      <div className={styles.notificationItem}>
        <div className={styles.notificationContent}>
          <div className={styles.matchHeaderRow}>
            <span className={styles.matchHeaderLeft}>
              <span className={styles.matchHeaderIcon}><i className="fa-solid fa-heart"></i></span>
              <span className={styles.matchHeaderTitle}>New match!</span>
            </span>
            <div className={styles.notificationTime}>{formatTime(n.created_at)}</div>
          </div>
          <div className={styles.matchBodyRow}>
            <div 
              className={styles.matchAvatar}
              aria-hidden
              style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
            />
            <div className={styles.matchBodyText}>
              <div className={styles.matchNameLine}>
                {profile?.first_name ? `${profile.first_name}${age ? `, ${age}` : ''}` : (data?.matchUserName || 'New match')}
              </div>
              <div className={styles.matchMetaLine}>
                <i className="fa fa-venus-mars"></i>
                <span className={styles.matchMetaText}>{genderLabel}</span>
              </div>
            </div>
          </div>
        </div>
        <button 
          aria-label="Dismiss"
          title="Dismiss"
          onClick={() => dismissOne(n.id)}
          style={{ background: 'transparent', border: 'none', color: 'var(--font-color-muted)', cursor: 'pointer' }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    );
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
              n.type === 'match' ? (
                <MatchRow key={n.id} n={n} />
              ) : (
                <div key={n.id} className={styles.notificationItem}>
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
                  <button 
                    aria-label="Dismiss"
                    title="Dismiss"
                    onClick={() => dismissOne(n.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--font-color-muted)', cursor: 'pointer' }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      <MobileMenu />
    </div>
  );
};

export default Notifications;
