import React, { useRef } from 'react';
import styles from '../../utils/styles/styles.module.css';
import { useInputValidation } from '../../utils/hooks/useInputValidation';

const TextInput = React.forwardRef(({ type = 'text', label, placeholder, value, onChange, min, max, confirmPassword, required = false, isSubmitted = false, errorOverride = '', styles: themeStyles = {} }, ref) => {
  const inputRef = useRef(null);
  const { error, showError, isChecking, isFocused, handleChange, handleBlur, handleFocus } = useInputValidation({
    type,
    label,
    value,
    onChange,
    min,
    max,
    confirmPassword,
    required,
    isSubmitted,
    errorOverride,
  }, ref);

  const effectiveType = type === 'checkemail' ? 'email' : type === 'checkusername' ? 'text' : type;

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
          type={effectiveType}
          placeholder={isFocused ? placeholder : ''}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          ref={inputRef}
          className={`${styles.inputField} ${showError && error ? styles.error : ''} ${value ? styles['has-value'] : ''} ${isChecking ? styles.checking : ''}`}
        />
        <label className={`${styles.inputLabel} ${value || isFocused ? styles.filled : ''}`}>{label}</label>
        {showError && error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    </div>
  );
});

export default TextInput;