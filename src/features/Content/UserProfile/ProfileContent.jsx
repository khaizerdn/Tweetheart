// ProfileContent.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import AboutTab from './tabs/about'; // New import
import PostsTab from './tabs/PostsTab';
import GalleryTab from './tabs/GalleryTab';
import FriendsTab from './tabs/FriendsTab';
import FollowingTab from './tabs/FollowingTab';
import './UserProfile.css';

const ProfileContent = () => {
  const location = useLocation();
  const segments = location.pathname.split('/');
  const activeTab = segments[2] || 'about'; // Default to "about" instead of "posts"

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return <AboutTab />;
      case 'posts':
        return <PostsTab />;
      case 'gallery':
        return <GalleryTab />;
      case 'friends':
        return <FriendsTab />;
      case 'following':
        return <FollowingTab />;
      default:
        return <div>Error: Unknown tab selected.</div>; // Improved error message
    }
  };

  return (
    <div className="profile-content">
      {renderContent()}
    </div>
  );
};

export default ProfileContent;