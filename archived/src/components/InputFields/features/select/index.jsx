import React, { useRef } from 'react';
import styles from '../../utils/styles/styles.module.css';
import { useInputValidation } from '../../utils/hooks/useInputValidation';
import icon from '../../utils/icons/Icons';

const SelectInput = React.forwardRef(({ label, placeholder, value, onChange, options = [], required = false, isSubmitted = false, styles: themeStyles = {} }, ref) => {
  const selectInputRef = useRef(null);
  const { error, showError, isChecking, isFocused, handleChange, handleBlur, handleFocus } = useInputValidation({
    type: 'select',
    label,
    value,
    onChange,
    required,
    isSubmitted,
  }, ref);

  const effectivePlaceholder = placeholder || 'Select an option';

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
        '--input-label-background': themeStyles.background,
        '--input-option-background': themeStyles.backgroundOption
      }}
    >
      <div className={styles.inputWrapper}>
        <select
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          ref={selectInputRef}
          className={`${styles.inputField} ${showError && error ? styles.error : ''} ${value || isFocused ? styles['has-value'] : ''}`}
        >
          <option value="" hidden></option>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label className={`${styles.inputLabel} ${value || isFocused ? styles.filled : ''}`}>{label}</label>
        {!value && (
          <span className={`${styles.inputPlaceholder} ${isFocused ? styles.filled : ''}`}>
            {effectivePlaceholder}
          </span>
        )}
        <span className={`${styles.inputIcon} ${styles.selectIcon}`}>
          <icon.Arrow />
        </span>
        {showError && error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    </div>
  );
});

export default SelectInput;