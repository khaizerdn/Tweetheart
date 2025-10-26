import React, { lazy, Suspense, useState, useEffect } from 'react';
import './UserProfile.css';

const ProfileMenu = lazy(() => import('./ProfileMenu'));
const ProfileContent = lazy(() => import('./ProfileContent'));

const API_URL = import.meta.env.VITE_API_URL;

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('/default-profile.png');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('/default-cover.png');


  // ✅ FETCH USER DATA
  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch(`${API_URL}/user-details`, {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();
        if (!response.ok) {
          console.error("Error fetching user data:", data.message);
          return;
        }

        const user = data.user; // 👈 FIXED: extract user object
        if (!user) {
          console.error("No user data found in response");
          return;
        }

        setUserData({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          email: user.email,
          birthdate: user.birthdate,
          gender: user.gender,
          created_at: user.created_at,
          about: {
            bio: user.about || '# About Me\n\nWrite your bio here...',
          },
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    fetchUserData();
  }, []);

  // ✅ FETCH PROFILE PHOTO
  useEffect(() => {
    async function fetchProfilePhoto() {
      try {
        const response = await fetch(`${API_URL}/api/getProfilePhoto`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (data.imageUrl) setProfilePhotoUrl(data.imageUrl);
      } catch (error) {
        console.error("Error fetching profile photo:", error);
      }
    }
    fetchProfilePhoto();
  }, []);


  // ✅ FETCH COVER PHOTO
  useEffect(() => {
    async function fetchCoverPhoto() {
      try {
        const response = await fetch(`${API_URL}/api/getCoverPhoto`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (data.imageUrl) setCoverPhotoUrl(data.imageUrl);
      } catch (error) {
        console.error("Error fetching cover photo:", error);
      }
    }
    fetchCoverPhoto();
  }, []);

  // ✅ LOADING STATE
  if (!userData) return <div>Loading user data...</div>;
  const { first_name, last_name, username } = userData;

  // ✅ UPLOAD HANDLERS
  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      const response = await fetch(`${API_URL}/api/uploadProfilePhoto`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json();
      if (data.imageUrl) setProfilePhotoUrl(data.imageUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleCoverPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('coverPhoto', file);

    try {
      const response = await fetch(`${API_URL}/api/uploadCoverPhoto`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json();
      if (data.imageUrl) setCoverPhotoUrl(data.imageUrl);
    } catch (error) {
      console.error("Cover photo upload failed:", error);
    }
  };


  // ✅ COMPONENT RENDER
  return (
    <div className="userprofile">
      {/* Cover Photo */}
      <div
        className="userprofile-coverphoto"
        style={{ backgroundImage: `url(${coverPhotoUrl})` }}
      >
        <input
          type="file"
          id="uploadCoverPhotoInput"
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleCoverPhotoUpload}
        />
        <button
          className="edit-cover-btn"
          onClick={() => document.getElementById('uploadCoverPhotoInput').click()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M4 17.25V21h3.75l9.06-9.06-3.75-3.75L4 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          Edit cover photo
        </button>
      </div>

      {/* Basic Info Section */}
      <div className="userprofile-basicinfo">
        <div className="userprofile-profilephoto-wrapper">
          <div className="userprofile-profilephoto">
            <img src={profilePhotoUrl} alt="Profile" className="profile-photo" />
          </div>

          <input
            type="file"
            id="uploadProfilePhotoInput"
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleProfilePhotoUpload}
          />

          <button
            className="upload-photo-btn"
            onClick={() => document.getElementById('uploadProfilePhotoInput').click()}
            aria-label="Upload profile photo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm0 1.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z" />
              <path d="M20 5h-3.17l-1.83-2H9.99L8.17 5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 14H5V7h3.99l1.83-2h4.36l1.83 2H20v12z" />
            </svg>
          </button>
        </div>

        <div className="userprofile-header">
          <div className="userprofile-info">
            <div className="userprofile-firstandlast">
              {first_name} {last_name}
            </div>
            <div className="userprofile-username">
              @{username}
            </div>
          </div>

          <div className="userprofile-actions">
            <button className="addfriend-btn">Add Friend</button>
          </div>
        </div>
      </div>

      <Suspense fallback={<div>Loading menu...</div>}>
        <ProfileMenu />
      </Suspense>

      <div className="userprofile-main">
        <div className="userprofile-content-container">
          <Suspense fallback={<div>Loading content...</div>}>
            <ProfileContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
