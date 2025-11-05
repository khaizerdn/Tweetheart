import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './styles.module.css';

const Button = ({
  to,
  iconClass,
  label,
  extraClassName = '',
  onClick = null,
  relative = false,
  showDot = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  let isSelected = false;
  let targetPath = to;

  if (relative) {
    // Get the base from the URL's username (assumes URL like "/username/...")
    const pathSegments = location.pathname.split('/');
    const basePath = `/${pathSegments[1]}`;
    const relativePart = to.replace(/^\//, '');
    targetPath = `${basePath}/${relativePart}`;

    // Check if the third segment matches the new sub-route.
    const currentSubPath = pathSegments[2] || '';
    isSelected = currentSubPath === relativePart;
  } else {
    isSelected = location.pathname === to;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(relative ? targetPath : to);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Render the icon.
  const renderIcon = () => {
    return <i className={iconClass}></i>;
  };

  return (
    <div
      role="button"
      tabIndex="0"
      className={`${styles.buttonDefault} ${isSelected ? styles.selected : ''} ${extraClassName}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.buttonLogoContainer}>
        <div className={styles.buttonLogo}>
          {renderIcon()}
        </div>
      </div>
      <div className={styles.buttonText}>{label}</div>
      {showDot && <span className={styles.badgeDot} aria-hidden></span>}
    </div>
  );
};

Button.propTypes = {
  to: PropTypes.string.isRequired,
  iconClass: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  extraClassName: PropTypes.string,
  onClick: PropTypes.func,
  relative: PropTypes.bool,
  showDot: PropTypes.bool,
};

export default Button;
