import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import logoUrl from '../../utils/icons/logo.svg';

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
          alt="Gamecord Logo" 
          className={styles.logo}
          width="28"
          height="28"
        />
      </div>
    </div>
  );
};

export default Logo;
