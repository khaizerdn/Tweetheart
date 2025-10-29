# Header Component

A reusable header component that displays a title and optional children elements.

## Usage

```jsx
import Header from '../../../components/Header';

// Basic usage with just a title
<Header title="Page Title" />

// With additional elements (like buttons)
<Header title="Matches">
  <button onClick={handleFilter}>Filter</button>
</Header>

// With custom className
<Header title="Settings" className="custom-header" />
```

## Props

- `title` (string, required): The main title text to display
- `children` (ReactNode, optional): Additional elements to display on the right side of the header
- `className` (string, optional): Additional CSS classes to apply to the header container

## Styling

The component uses CSS modules and follows the design system variables:
- Uses `var(--color-primary-3)` for background
- Uses `var(--background-color-secondary-default)` for text color
- Uses `var(--font-size-024)` for title font size
- Automatically spaces children elements with proper margins
