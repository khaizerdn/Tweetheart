import React from 'react';
import styles from './styles.module.css';

const Button = ({ icon, onClick, position = 'left', type = 'primary', children, htmlType, loading = false, disabled = false }) => {
  const className = `${styles.button} ${position === 'right' ? styles['right-align'] : position === 'center' ? styles['center-align'] : ''} ${type === 'secondary' ? styles['type-secondary'] : type === 'primary' ? styles['type-primary'] : ''} ${loading ? styles.loading : ''} ${disabled || loading ? styles.disabled : ''}`;

  return (
    <button className={className} onClick={onClick} type={htmlType} disabled={disabled || loading}>
      {loading && <span className={styles.spinner}></span>}
      {!loading && children}
      {!loading && icon && <span className={styles.icon}>{icon}</span>}
    </button>
  );
};

export default Button;