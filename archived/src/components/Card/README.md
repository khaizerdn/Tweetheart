# Card Component

A reusable card component for displaying profile cards with photos, navigation, and customizable content overlay.

## Features

- **Photo Display**: Supports single or multiple photos with automatic carousel
- **Photo Navigation**: Built-in previous/next buttons for photo navigation
- **Photo Indicators**: Visual dots showing current photo position
- **Customizable Content**: Flexible children prop for card info overlay
- **Forward Ref Support**: Can be used with refs for advanced interactions (e.g., swiping)
- **Custom Overlays**: Support for additional overlays (e.g., swipe indicators)
- **Responsive**: Mobile-friendly with responsive sizing
- **Placeholder Support**: Custom placeholder when no photos available

## Usage

### Basic Usage

```jsx
import Card from '../../components/Card';

function ProfileCard() {
  const photos = [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg',
    'https://example.com/photo3.jpg'
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };
  
  const prevPhoto = () => {
    setCurrentIndex((prev) => prev === 0 ? photos.length - 1 : prev - 1);
  };
  
  return (
    <Card
      photos={photos}
      currentPhotoIndex={currentIndex}
      onNextPhoto={nextPhoto}
      onPrevPhoto={prevPhoto}
    >
      <div className={styles.nameAge}>
        <h3>John Doe, 25</h3>
      </div>
    </Card>
  );
}
```

### With Custom Placeholder

```jsx
<Card
  photos={[]}
  placeholder={
    <div className={styles.customPlaceholder}>
      <i className="fa fa-user"></i>
      <p>Upload photos to see preview</p>
    </div>
  }
>
  <div>Profile information here</div>
</Card>
```

### With Ref (for Swipe Functionality)

```jsx
const cardRef = useRef(null);

<Card
  ref={cardRef}
  photos={photos}
  currentPhotoIndex={currentIndex}
  onNextPhoto={nextPhoto}
  onPrevPhoto={prevPhoto}
  onTouchStart={(e) => handleTouchStart(e)}
  onTouchMove={(e) => handleTouchMove(e)}
  onTouchEnd={(e) => handleTouchEnd(e)}
>
  <div>Card content</div>
</Card>
```

### With Custom Overlays

```jsx
<Card
  photos={photos}
  currentPhotoIndex={currentIndex}
  onNextPhoto={nextPhoto}
  onPrevPhoto={prevPhoto}
  overlays={
    <>
      <div className={styles.swipeOverlayLeft} />
      <div className={styles.swipeOverlayRight} />
    </>
  }
>
  <div>Card content</div>
</Card>
```

### Disabling Navigation

```jsx
<Card
  photos={photos}
  currentPhotoIndex={currentIndex}
  showNavigation={false}
  showIndicators={false}
>
  <div>Card content</div>
</Card>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `photos` | `array` | `[]` | Array of photo URLs to display |
| `currentPhotoIndex` | `number` | `0` | Index of currently displayed photo |
| `onNextPhoto` | `function` | - | Callback function when next button is clicked |
| `onPrevPhoto` | `function` | - | Callback function when previous button is clicked |
| `children` | `node` | - | Content to display in the card info overlay (bottom section) |
| `className` | `string` | `''` | Additional CSS classes to apply to the card |
| `showNavigation` | `boolean` | `true` | Whether to show prev/next navigation buttons |
| `showIndicators` | `boolean` | `true` | Whether to show photo position indicators |
| `placeholder` | `node` | Default placeholder | Custom component to show when no photos available |
| `overlays` | `node` | - | Additional overlays to render on top of the card |
| `ref` | `ref` | - | React ref for accessing the card DOM element |
| `...props` | `any` | - | Any additional props are passed to the root div element |

## Styling

The Card component uses CSS Modules with the following class names:

- `.card` - Root card container
- `.photoContainer` - Container for the photo and navigation
- `.photo` - The photo image element
- `.photoIndicators` - Container for photo position dots
- `.indicator` / `.indicator.active` - Individual photo position dots
- `.navButton` / `.prevButton` / `.nextButton` - Navigation buttons
- `.cardInfo` - Bottom overlay container for children
- `.placeholderPhoto` - Default placeholder styling

You can override these styles by:
1. Passing a custom `className` prop
2. Wrapping the Card in a styled container
3. Using global CSS to override the module styles

## Examples in Codebase

### SignUp Component
Location: `src/features/SignUp/index.jsx`

Shows a preview card while the user fills out the signup form.

### Home Component
Location: `src/features/Content/Home/index.jsx`

Uses the Card component with swipe functionality for the dating app's main interface.

## Notes

- The component automatically handles responsive sizing through CSS media queries
- Navigation buttons and indicators only show when there are multiple photos
- The card uses `forwardRef` to support advanced use cases like drag/swipe functionality
- The component is designed to work with any photo source (URLs, data URIs, etc.)

