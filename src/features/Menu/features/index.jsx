// src/pages/Menu/Menu.jsx
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useNavigate, useLocation } from 'react-router-dom';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import styles from '../utils/styles/styles.module.css';
import Button from '../components/button';
import Logo from '../components/logo';
import Profile from '../components/profile';
import NotificationsContainer from '../components/notifications';
import requestAccessToken from '../../../api/requestAccessToken';

function Menu() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [socket, setSocket] = useState(null);

  const logout = async () => {
    try {
      const response = await requestAccessToken.post('/logout');

      if (response.status === 200) {
        navigate("/");
        window.location.reload();
      } else {
        console.error("Logout failed:", response.data);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await requestAccessToken.get('/user-basic'); // use Axios instance
        const data = response.data;

        setUserData({
          first_name: data.firstName,
          last_name: data.lastName,
        });
      } catch (error) {
        console.error("Error fetching user data:", error.response?.data?.message || error.message);
      }
    }
    fetchUserData();
  }, []);

  // Hide the dot when visiting the notifications page and persist state
  useEffect(() => {
    if (location.pathname === '/notifications') {
      setHasNewNotifications(false);
      try { localStorage.setItem('hasNewNotifications', '0'); } catch {}
    }
  }, [location.pathname]);

  useEffect(() => {
    // Get current user ID from cookies
    const userId = document.cookie
      .split('; ')
      .find(row => row.startsWith('userId='))
      ?.split('=')[1];
    
    if (userId) {
      setCurrentUserId(userId);
    }
  }, []);

  useEffect(() => {
    async function fetchProfilePhoto() {
      try {
        const response = await requestAccessToken.get('/api/photos'); // use the same endpoint as Profile
        const data = response.data;

        if (data.photos && data.photos.length > 0) {
          // Find the photo with order 1
          const order1Photo = data.photos.find(photo => photo.order === 1);
          
          if (order1Photo && order1Photo.url) {
            setProfilePhotoUrl(order1Photo.url);
          } else {
            // If no order 1 photo found, set to null (will show placeholder)
            setProfilePhotoUrl(null);
          }
        } else {
          // If no photos found, set to null (will show placeholder)
          setProfilePhotoUrl(null);
        }
      } catch (error) {
        console.error("Error fetching profile photo:", error.response?.data?.message || error.message);
        // On error, set to null (will show placeholder)
        setProfilePhotoUrl(null);
      }
    }
    fetchProfilePhoto();
  }, []);

  // Initialize notification dot from persistent flag (no per-item unread)
  useEffect(() => {
    try {
      const flag = localStorage.getItem('hasNewNotifications');
      setHasNewNotifications(flag === '1');
    } catch {}
  }, []);

  // Socket listener to show dot on new notifications
  useEffect(() => {
    if (!currentUserId) return;
    // Socket.io connects to /socket.io on current origin (proxied by Nginx)
    const s = io({ withCredentials: true });
    s.on('connect', () => {
      s.emit('join_user_room', { userId: currentUserId });
    });
    s.on('new_notification', () => {
      setHasNewNotifications(true);
      try { localStorage.setItem('hasNewNotifications', '1'); } catch {}
    });
    setSocket(s);
    return () => { s.close(); };
  }, [currentUserId]);


  return (
    <div className={styles.menuContainer}>
      {/* Top Container - Logo */}
      <div className={styles.topContainer}>
        <Logo />
      </div>

      {/* Highlighted Features Container */}
      <div className={styles.highlightedContainer}>
        <Profile userData={userData} profilePhotoUrl={profilePhotoUrl} currentUserId={currentUserId} />
      </div>

      <hr className={styles.sectionSeparator} />

      {/* Scrollable Main Content Container */}
      <OverlayScrollbarsComponent
        options={{ 
          scrollbars: { 
            autoHide: 'leave', 
            autoHideDelay: 0 
          },
          overflow: { 
            x: 'hidden', 
            y: 'scroll' 
          } 
        }}
        className={styles.scrollableContainer}
      >
        <Button to="/" iconClass="fa-solid fa-house" label="Home" />
        <Button to="/notifications" iconClass="fa-solid fa-bell" label="Notifications" showDot={hasNewNotifications} />
        <Button to="/matches" iconClass="fa-solid fa-heart" label="Matches" />
        <Button to="/chats" iconClass="fa-solid fa-comments" label="Chats" />
      </OverlayScrollbarsComponent>

      {/* Notifications Container - placed below the scrollable container */}
      <NotificationsContainer />

      <hr className={styles.sectionSeparator} />
      {/* Bottom Container */}
      <div className={styles.bottomContainer}>
        <Button to="/settings" iconClass="fa-solid fa-gear" label="Settings" />
        <Button to="/logout" iconClass="fa-solid fa-right-from-bracket" label="Logout" onClick={logout} />
      </div>
    </div>
  );
}

export default Menu;
