import React from 'react';
import MobileMenu from '../../../../../components/MobileMenu';
import Button from '../../../../../components/Buttons/Button';
import styles from '../../styles.module.css';

const LocationRequired = ({ 
  isMobile, 
  error, 
  isRequesting, 
  showTooManyAttempts, 
  onGetLocation 
}) => {
  return (
    <div className={styles.home}>
      <div className={styles.locationRequiredContainer}>
        <div className={styles.emptyState}>
          <i className="fa fa-map-marker-alt"></i>
          <h3>Location Access Required</h3>
          <p className={styles.locationInfo}>
            To help you find matches nearby, we need access to your location. 
            This allows us to show you people in your area and improve your experience.
          </p>
          {/* Error display */}
          {error && <div className={styles.error}>{error}</div>}
          <Button
            type="secondary"
            position="center"
            onClick={onGetLocation}
            loading={isRequesting}
            disabled={isRequesting}
          >
            Allow Location
          </Button>
          {/* Too Many Attempts warning below the button, in a smaller red style */}
          {showTooManyAttempts && (
            <div className={styles.tooManyAttemptsWarning}>
              You have attempted to allow location too many times. Please go to your browser settings and manually allow this site to access your location.
            </div>
          )}
        </div>
      </div>
      {isMobile && <MobileMenu />}
    </div>
  );
};

export default LocationRequired;

