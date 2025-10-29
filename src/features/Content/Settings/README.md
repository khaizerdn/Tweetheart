# Settings Page

This component provides a settings interface for the dating app, including theme management and other user preferences.

## Features

### Theme Toggle
- **Light Mode**: Default theme with light backgrounds and dark text
- **Dark Mode**: Dark theme with dark backgrounds and light text
- **Persistent Storage**: Theme preference is saved to localStorage
- **System Preference Detection**: Automatically detects user's system theme preference on first visit

### Theme Implementation
The theme system uses CSS custom properties (CSS variables) that are dynamically updated based on the selected theme:

- `--color-primary-1` through `--color-primary-26` are dynamically set based on the current theme
- Light theme: Primary colors go from white (100%) to black (0%)
- Dark theme: Primary colors go from black (0%) to white (100%)
- Theme is applied via `data-theme` attribute on the document root

### Additional Settings
The component includes placeholder sections for:
- Notifications management
- Privacy settings
- Account settings

## Usage

The Settings page is accessible via the navigation menu and is routed at `/settings`.

## Files

- `index.jsx` - Main Settings component
- `styles.module.css` - Component-specific styles
- `server.js` - Utility functions for theme management
- `README.md` - This documentation

## Theme Toggle Implementation

The theme toggle uses a custom switch component that:
1. Displays current theme with visual previews
2. Allows switching between light and dark modes
3. Persists the selection to localStorage
4. Applies the theme immediately to the document

## CSS Variables

The theme system relies on the following CSS variables defined in `src/utils/styles/global/tokens.css`:

- `--theme-primary-1` through `--theme-primary-26` - Theme-specific primary colors
- `--color-primary-1` through `--color-primary-26` - Dynamic primary colors that reference theme colors
- `[data-theme="dark"]` - Dark theme selector that overrides theme colors
