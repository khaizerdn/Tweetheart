// Settings server utilities
// This file can be used for any server-side functionality related to settings
// Currently, theme preferences are handled client-side via localStorage

export const saveThemePreference = (theme) => {
  try {
    localStorage.setItem('theme', theme);
    return true;
  } catch (error) {
    console.error('Failed to save theme preference:', error);
    return false;
  }
};

export const getThemePreference = () => {
  try {
    return localStorage.getItem('theme') || 'light';
  } catch (error) {
    console.error('Failed to get theme preference:', error);
    return 'light';
  }
};

export const applyTheme = (theme) => {
  try {
    document.documentElement.setAttribute('data-theme', theme);
    return true;
  } catch (error) {
    console.error('Failed to apply theme:', error);
    return false;
  }
};
