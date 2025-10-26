import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';

const Profile = ({ userData, profilePhotoUrl }) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (userData) {
      navigate(`/${userData.username}`);
    }
  };

  return (
    <div className={styles.buttonProfile} onClick={handleProfileClick}>
      <div className={styles.buttonLogoContainer}>
        <img
          src={profilePhotoUrl}
          alt="profile"
          className={styles.profilePhoto}
          width="32"
          height="32"
        />
      </div>
      <div className={styles.buttonText}>
        {userData ? (
          <>
            {userData.first_name} {userData.last_name}
            <div className={styles.buttonTextOther}>@{userData.username}</div>
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
  profilePhotoUrl: PropTypes.string.isRequired,
};

export default Profile;
