import React from 'react';
import styles from './styles.module.css';

const Button = ({ icon, onClick, position = 'left', type = 'primary', children, htmlType }) => {
  const className = `${styles.button} ${position === 'right' ? styles['right-align'] : position === 'center' ? styles['center-align'] : ''} ${type === 'secondary' ? styles['type-secondary'] : type === 'primary' ? styles['type-primary'] : ''}`;

  return (
    <button className={className} onClick={onClick} type={htmlType}>
      {children}
      {icon && <span className={styles.icon}>{icon}</span>}
    </button>
  );
};

export default Button;