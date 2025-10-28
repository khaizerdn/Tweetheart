import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import logoUrl from '../../../../utils/assets/logo.svg';

const Logo = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <div className={styles.logoContainer}>
      <div className={styles.logoButton} onClick={handleLogoClick}>
        <img 
          src={logoUrl} 
          alt="Tweetheart" 
          className={styles.logo}
          width="32"
          height="32"
        />
        <span className={styles.logoText}>Tweetheart</span>
      </div>
    </div>
  );
};

export default Logo;
