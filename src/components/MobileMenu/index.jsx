import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import layoutStyles from '../../utils/styles/layout.module.css';
import styles from './styles.module.css';
import requestAccessToken from '../../api/requestAccessToken';

const MobileMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const menuItems = [
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'fa-bell',
      path: '/notifications'
    },
    {
      id: 'home',
      label: 'Home',
      icon: 'fa-home',
      path: '/home'
    },
    {
      id: 'matches',
      label: 'Matches',
      icon: 'fa-heart',
      path: '/matches'
    },
    {
      id: 'chats',
      label: 'Chats',
      icon: 'fa-comments',
      path: '/chats'
    }
  ];

  const burgerMenuItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: 'fa-user',
      path: currentUserId ? `/profile/${currentUserId}` : '/profile'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'fa-cog',
      path: '/settings'
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'fa-sign-out-alt',
      path: '/logout'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleBurgerMenuNavigation = (path, itemId) => {
    if (itemId === 'logout') {
      handleLogout();
    } else {
      navigate(path);
      setIsMenuOpen(false);
    }
  };

  const handleLogout = async () => {
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
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

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

  return (
    <>
      {/* Full-screen overlay menu */}
      <div className={`${styles.overlay} ${isMenuOpen ? styles.overlayOpen : ''}`} onClick={toggleMenu}></div>
      
      {/* Burger menu panel */}
      <div className={`${styles.burgerMenu} ${isMenuOpen ? styles.burgerMenuOpen : ''}`}>
        <div className={styles.burgerMenuHeader}>
          <h3 className={styles.burgerMenuTitle}>Menu</h3>
          <button className={styles.closeButton} onClick={toggleMenu} aria-label="Close menu">
            <i className="fa fa-times"></i>
          </button>
        </div>
        <div className={styles.burgerMenuContent}>
          {burgerMenuItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.burgerMenuItem} ${isActive(item.path) ? styles.active : ''}`}
              onClick={() => handleBurgerMenuNavigation(item.path, item.id)}
              aria-label={item.label}
            >
              <i className={`fa ${item.icon}`}></i>
              <span className={styles.burgerMenuLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div className={layoutStyles.mobileMenu}>
        {/* Burger menu button */}
        <button
          className={`${styles.burgerButton} ${isMenuOpen ? styles.burgerButtonOpen : ''}`}
          onClick={toggleMenu}
          aria-label="Open menu"
          title="Menu"
        >
          <div className={styles.burgerIcon}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        {/* Regular menu items */}
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`${layoutStyles.menuItem} ${isActive(item.path) ? layoutStyles.active : ''}`}
            onClick={() => handleNavigation(item.path)}
            aria-label={item.label}
            title={item.label}
          >
            <i className={`fa ${item.icon}`}></i>
          </button>
        ))}
      </div>
    </>
  );
};

export default MobileMenu;
