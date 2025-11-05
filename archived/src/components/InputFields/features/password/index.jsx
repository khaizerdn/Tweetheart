import React, { useState } from 'react';
import styles from '../../utils/styles/styles.module.css';
import { useInputValidation } from '../../utils/hooks/useInputValidation';
import icon from '../../utils/icons/Icons';

const PasswordInput = React.forwardRef(({ type = 'password', label, placeholder, value, onChange, confirmPassword, required = false, isSubmitted = false, styles: themeStyles = {} }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const { error, showError, isChecking, isFocused, handleChange, handleBlur, handleFocus } = useInputValidation({
    type,
    label,
    value,
    onChange,
    confirmPassword,
    required,
    isSubmitted,
  }, ref);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      className={styles.inputContainer}
      style={{
        '--input-default': themeStyles.default,
        '--input-hover': themeStyles.hover,
        '--input-active': themeStyles.active,
        '--input-selected': themeStyles.selected,
        '--input-disabled': themeStyles.disabled,
        '--input-muted': themeStyles.muted,
        '--input-label-background': themeStyles.background
      }}
    >
      <div className={styles.inputWrapper}>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={isFocused ? placeholder : ''}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={`${styles.inputField} ${showError && error ? styles.error : ''} ${value ? styles['has-value'] : ''} ${isChecking ? styles.checking : ''}`}
        />
        <label className={`${styles.inputLabel} ${value || isFocused ? styles.filled : ''}`}>{label}</label>
        <span className={styles.inputIcon} onClick={togglePasswordVisibility}>
          {showPassword ? <icon.Eye /> : <icon.EyeSlash />}
        </span>
        {showError && error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    </div>
  );
});

export default PasswordInput;