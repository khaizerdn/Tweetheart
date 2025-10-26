import React from 'react';
import TextInput from './features/text';
import PasswordInput from './features/password';
import DateInput from './features/date';
import SelectInput from './features/select';

const InputField = React.forwardRef((props, ref) => {
  const { type = 'text', styles: themeStyles = {} } = props;

  // Define default theme values to prevent undefined properties
  const defaultTheme = {
    background: 'var(--color-primary-3)',
    backgroundOption: 'var(--color-primary-4)',
    disabled: 'var(--color-primary-3)',
    muted: 'var(--color-primary-4)',
    default: 'var(--color-primary-5)',
    hover: 'var(--color-primary-6)',
    active: 'var(--color-primary-7)',
    selected: 'var(--color-primary-8)',
  };

  // Merge provided theme styles with defaults
  const mergedStyles = { ...defaultTheme, ...themeStyles };

  switch (type) {
    case 'password':
    case 'createpassword':
    case 'confirmPassword':
      return <PasswordInput {...props} styles={mergedStyles} ref={ref} />;
    case 'date':
      return <DateInput {...props} styles={mergedStyles} ref={ref} />;
    case 'select':
      return <SelectInput {...props} styles={mergedStyles} ref={ref} />;
    default:
      return <TextInput {...props} styles={mergedStyles} ref={ref} />;
  }
});

export default InputField;