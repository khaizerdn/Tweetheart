import React, { useRef } from 'react';
import styles from '../../utils/styles/styles.module.css';
import { useInputValidation } from '../../utils/hooks/useInputValidation';
import icon from '../../utils/icons/Icons';

const DateInput = React.forwardRef(({ label, placeholder, value, onChange, min, max, required = false, isSubmitted = false, styles: themeStyles = {} }, ref) => {
  const dateInputRef = useRef(null);
  const { error, showError, isChecking, isFocused, handleChange, handleBlur, handleFocus } = useInputValidation({
    type: 'date',
    label,
    value,
    onChange,
    min,
    max,
    required,
    isSubmitted,
  }, ref);

  const resolveDateConstraint = (constraint) => {
    if (!constraint || constraint === '') return undefined;
    if (constraint === 'present') return new Date().toISOString().split('T')[0];
    
    const dateMatch = constraint.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dateMatch) {
      const [, month, day, year] = dateMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    const relativeMatch = constraint.match(/^(\d+)([y|m|d])$/);
    if (relativeMatch) {
      const value = parseInt(relativeMatch[1], 10);
      const unit = relativeMatch[2];
      const date = new Date();
      if (unit === 'y') date.setFullYear(date.getFullYear() - value);
      if (unit === 'm') date.setMonth(date.getMonth() - value);
      if (unit === 'd') date.setDate(date.getDate() - value);
      return date.toISOString().split('T')[0];
    }
    
    return undefined;
  };

  const handleCalendarClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.focus();
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.click();
      }
    }
  };

  const resolvedMin = resolveDateConstraint(min);
  const resolvedMax = resolveDateConstraint(max);
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
        '--input-label-background': themeStyles.background
      }}
    >
      <div className={styles.inputWrapper}>
        <input
          type="date"
          placeholder={isFocused ? effectivePlaceholder : ''}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          ref={dateInputRef}
          min={resolvedMin}
          max={resolvedMax}
          className={`${styles.inputField} ${showError && error ? styles.error : ''} ${value ? styles['has-value'] : ''} ${isChecking ? styles.checking : ''}`}
        />
        <label className={`${styles.inputLabel} ${value || isFocused ? styles.filled : ''}`}>{label}</label>
        <span className={styles.inputIcon} onClick={handleCalendarClick}>
          <icon.Calendar />
        </span>
        {showError && error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    </div>
  );
});

export default DateInput;