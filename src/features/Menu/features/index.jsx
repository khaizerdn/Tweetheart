// src/pages/Menu/Menu.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import styles from '../utils/styles/styles.module.css';
import Button from '../components/button';
import Logo from '../components/logo';
import Profile from '../components/profile';
import requestAccessToken from '../../../api/requestAccessToken';

function Menu() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

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
        <Button to="/notifications" iconClass="fa-solid fa-bell" label="Notifications" />
        <Button to="/matches" iconClass="fa-solid fa-heart" label="Matches" />
        <Button to="/chats" iconClass="fa-solid fa-comments" label="Chats" />
      </OverlayScrollbarsComponent>

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
