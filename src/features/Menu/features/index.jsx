// src/pages/Menu/Menu.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import styles from '../utils/styles/styles.module.css';
import Button from '../components/button';
import Search from '../components/search';
import Logo from '../components/logo';
import Profile from '../components/profile';
import requestAccessToken from '../../../api/requestAccessToken';

function Menu() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('/default-profile.png');

  const logout = async () => {
    console.log("Attempting to log out...");
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
          username: data.username,
        });
      } catch (error) {
        console.error("Error fetching user data:", error.response?.data?.message || error.message);
      }
    }
    fetchUserData();
  }, []);

  useEffect(() => {
    async function fetchProfilePhoto() {
      try {
        const response = await requestAccessToken.get('/api/getProfilePhoto'); // use Axios instance
        const data = response.data;

        if (data.imageUrl) {
          setProfilePhotoUrl(data.imageUrl);
        }
      } catch (error) {
        console.error("Error fetching profile photo:", error.response?.data?.message || error.message);
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
        <Profile userData={userData} profilePhotoUrl={profilePhotoUrl} />
        <Search />
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
        <Button to="/scrimmage" iconClass="fa-solid fa-bolt" label="Scrimmage" />
        <Button to="/chats" iconClass="fa-solid fa-comments" label="Chats" />
        <Button to="/friends" iconClass="fa-solid fa-users" label="Friends" />
        <Button to="/teams" iconClass="fa-solid fa-shield" label="Teams" />
        <Button to="/organizations" iconClass="fa-solid fa-building" label="Organizations" />
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
