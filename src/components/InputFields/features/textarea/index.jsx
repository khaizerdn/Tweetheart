import React, { useRef } from 'react';
import styles from '../../utils/styles/styles.module.css';
import { useInputValidation } from '../../utils/hooks/useInputValidation';

const TextareaInput = React.forwardRef(({ type = 'textarea', label, placeholder, value, onChange, min, max, required = false, isSubmitted = false, errorOverride = '', styles: themeStyles = {}, rows = 4 }, ref) => {
  const textareaRef = useRef(null);
  const { error, showError, isChecking, isFocused, handleChange, handleBlur, handleFocus } = useInputValidation({
    type,
    label,
    value,
    onChange,
    min,
    max,
    required,
    isSubmitted,
    errorOverride,
  }, ref);

  const currentLength = value ? value.length : 0;
  const showCharCount = max && max > 0;

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
        <textarea
          placeholder={isFocused ? placeholder : ''}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          ref={textareaRef}
          rows={rows}
          maxLength={max}
          className={`${styles.inputField} ${styles.textareaField} ${showError && error ? styles.error : ''} ${value ? styles['has-value'] : ''} ${isChecking ? styles.checking : ''}`}
        />
        <label className={`${styles.inputLabel} ${value || isFocused ? styles.filled : ''}`}>{label}</label>
        {showError && error && <span className={styles.errorMessage}>{error}</span>}
        {showCharCount && (
          <span className={styles.charCounter}>
            {currentLength}/{max}
          </span>
        )}
      </div>
    </div>
  );
});

export default TextareaInput;

