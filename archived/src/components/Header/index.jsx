import React from 'react';
import styles from './styles.module.css';

const Header = ({ title, children, className = '' }) => {
  return (
    <div className={`${styles.header} ${className}`}>
      <h1>{title}</h1>
      {children}
    </div>
  );
};

export default Header;
