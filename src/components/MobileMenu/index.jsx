import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import layoutStyles from '../../utils/styles/layout.module.css';

const MobileMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      icon: 'fa-home',
      path: '/home'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'fa-bell',
      path: '/notifications'
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

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={layoutStyles.mobileMenu}>
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
  );
};

export default MobileMenu;
