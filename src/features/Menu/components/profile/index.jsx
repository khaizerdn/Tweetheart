import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';

const Profile = ({ userData, profilePhotoUrl, currentUserId }) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (userData && currentUserId) {
      navigate(`/profile/${currentUserId}`);
    }
  };

  return (
    <div className={styles.buttonProfile} onClick={handleProfileClick}>
      <div className={styles.buttonLogoContainer}>
        {profilePhotoUrl ? (
          <img
            src={profilePhotoUrl}
            alt="profile"
            className={styles.profilePhoto}
            width="32"
            height="32"
          />
        ) : (
          <div className={styles.profilePhotoPlaceholder}>
            <i className="fa fa-user"></i>
          </div>
        )}
      </div>
      <div className={styles.buttonText}>
        {userData ? (
          <>
            {userData.first_name} {userData.last_name}
          </>
        ) : (
          "Profile"
        )}
      </div>
    </div>
  );
};

Profile.propTypes = {
  userData: PropTypes.object,
  profilePhotoUrl: PropTypes.string,
  currentUserId: PropTypes.string,
};

export default Profile;
