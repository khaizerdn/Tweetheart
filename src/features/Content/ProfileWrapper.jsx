import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Profile from './Profile';
import OtherProfile from './OtherProfile';

function ProfileWrapper() {
  const { userId } = useParams();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get current user ID from cookie
  useEffect(() => {
    try {
      const userIdFromCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userId='))
        ?.split('=')[1];
      
      console.log('ProfileWrapper - Current user ID from cookie:', userIdFromCookie);
      console.log('ProfileWrapper - URL userId param:', userId);
      
      if (userIdFromCookie) {
        setCurrentUserId(userIdFromCookie);
      } else {
        console.warn('ProfileWrapper - No user ID found in cookie');
      }
      setLoading(false);
    } catch (error) {
      console.error('ProfileWrapper - Error getting user ID from cookie:', error);
      setLoading(false);
    }
  }, [userId]);

  // Determine if viewing own profile
  const isOwnProfile = currentUserId && userId && currentUserId === userId;
  
  console.log('ProfileWrapper - isOwnProfile:', isOwnProfile);
  console.log('ProfileWrapper - currentUserId:', currentUserId);
  console.log('ProfileWrapper - userId:', userId);
  console.log('ProfileWrapper - loading:', loading);

  if (loading) {
    console.log('ProfileWrapper - Still loading, showing loading screen');
    return <div>Loading...</div>;
  }

  // If no userId in URL, show error
  if (!userId) {
    console.log('ProfileWrapper - No userId in URL, showing error');
    return <div>Error: No user ID provided</div>;
  }

  // If viewing own profile, show editing component
  if (isOwnProfile) {
    console.log('ProfileWrapper - Rendering Profile component (own profile)');
    return <Profile />;
  }

  // If viewing other user's profile, show viewing component
  console.log('ProfileWrapper - Rendering OtherProfile component (other user)');
  return <OtherProfile />;
}

export default ProfileWrapper;
