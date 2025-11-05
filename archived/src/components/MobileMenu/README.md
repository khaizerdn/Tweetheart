# MobileMenu Component

A responsive bottom navigation menu component designed for mobile devices and when the container shortcut is removed.

## Features

- **Responsive Design**: Only displays on mobile devices (screens < 1024px)
- **Navigation**: Provides quick access to main app sections
- **Active State**: Highlights the current page/route
- **Accessibility**: Includes proper ARIA labels and keyboard navigation
- **Smooth Animations**: Hover and active state transitions

## Menu Items

- **Home**: Navigate to the home page
- **Notifications**: Access notifications
- **Matches**: View matches
- **Chats**: Access chat conversations

## Usage

```jsx
import MobileMenu from '../../../components/MobileMenu';

// In your component
<MobileMenu />
```

## Styling

The component uses CSS modules with responsive breakpoints:

- **Mobile/Tablet (1px - 685px)**: Full mobile menu display (when container shortcut is hidden)
- **Desktop (686px+)**: Hidden (when container shortcut is visible)

## Props

None required. The component automatically:
- Uses React Router's `useNavigate` and `useLocation` hooks
- Determines active state based on current route
- Handles navigation on button clicks

## CSS Variables Used

- `--background-color-1`: Menu background
- `--background-color-primary-default-1`: Border color
- `--background-color-3`: Hover background
- `--background-color-primary-hover-1`: Active background
- `--background-color-secondary-default`: Active text color
- `--font-color-muted`: Default text color
- `--font-color-hover`: Hover text color

## Responsive Breakpoints

- **Very Small (1px - 320px)**: Compact spacing and smaller icons
- **Small Mobile (321px - 480px)**: Standard mobile spacing
- **Large Mobile (481px - 685px)**: Larger spacing and icons
- **Desktop (686px+)**: Hidden (container shortcut visible)
